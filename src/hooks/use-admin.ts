// Quản trị nền tảng (superadmin) — gọi API /admin/* của Cloud Function console.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  request,
  requestWithDelete,
  requestWithPatch,
  requestWithPost,
} from '@/utils/request'

// Trạng thái subscription là giá trị tự do; API các ứng dụng chỉ chạy khi `active`.
export const SUGGESTED_STATUSES = [
  'active',
  'registered',
  'suspended',
  'rejected',
  'trial',
]

export interface AdminTeamSummary {
  id: string
  name?: string
  full_name?: string
  owner?: string
  tax_id?: string
  status?: string | null
  status_reason?: string
  create_at?: string
  /** Chỉ có ở danh sách team (GET /admin/teams) */
  subscriptions?: TeamSubscriptionSummary[]
}

export interface TeamSubscriptionSummary {
  id: string
  app_id: string
  app_code?: string
  status?: string
  ota_version?: string | null
}

export interface AdminSubscription {
  id: string
  team_id: string
  team_name?: string
  app_id: string
  app_code?: string
  status?: string
  status_reason?: string
  status_changed_by?: string
  status_changed_at?: string
  registered_by?: string
  create_at?: string
  /** Phiên bản OTA ghim (id dòng app_versions); trống = dùng mặc định của app */
  ota_version_id?: string | null
  ota_version?: string | null
  team?: AdminTeamSummary | null
}

export interface AppVersion {
  /** null = mặc định hiện tại chưa được lưu thành dòng (dữ liệu cũ) */
  id: string | null
  app_id: string
  app_code?: string
  app_name?: string
  version: string
  bundle_url?: string
  checksum?: string
  remote_url?: boolean
  notes?: string
  created_by?: string
  create_at?: string
  is_default: boolean
  saved: boolean
  pinned_count: number
}

export interface NewAppVersion {
  app_id: string
  version: string
  bundle_url: string
  checksum: string
  remote_url?: boolean
  notes?: string
  set_default?: boolean
}

export interface AdminTeamDetail extends AdminTeamSummary {
  billing_address?: string
  subscriptions: AdminSubscription[]
}

export interface AppOta {
  version?: string
  bundle_url?: string | false
  checksum?: string | false
  remote_url?: boolean | string
}

export interface AdminApp {
  id: string
  name?: string
  code?: string
  desc?: string
  logo?: string
  load_type?: 'remote_url' | 'ota'
  remote_url?: string
  ota?: AppOta | null
}

export interface AuditEntry {
  id: string
  actor?: string
  action?: string
  target_type?: string
  target_id?: string
  before?: unknown
  after?: unknown
  reason?: string
  create_at?: string
}

export function useAdminMe() {
  return useQuery({
    queryKey: ['admin-me'],
    queryFn: () =>
      request<{ email: string; is_superadmin: boolean }>('/admin/me'),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useIsSuperadmin() {
  return useAdminMe().data?.is_superadmin === true
}

export function useAdminSubscriptions(filters: {
  status?: string
  q?: string
}) {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.q) params.set('q', filters.q)
  const qs = params.toString()
  return useQuery({
    queryKey: ['admin-subscriptions', qs],
    queryFn: () =>
      request<AdminSubscription[]>(`/admin/subscriptions${qs ? `?${qs}` : ''}`),
  })
}

export function usePendingCount() {
  const isSuperadmin = useIsSuperadmin()
  return useQuery({
    // Cùng khoá với useAdminSubscriptions({ status: 'registered' }) — dùng chung cache.
    queryKey: ['admin-subscriptions', 'status=registered'],
    queryFn: () =>
      request<AdminSubscription[]>('/admin/subscriptions?status=registered'),
    enabled: isSuperadmin,
    select: (rows) => rows.length,
  })
}

function invalidateAdmin(queryClient: ReturnType<typeof useQueryClient>) {
  for (const key of [
    'admin-subscriptions',
    'admin-teams',
    'admin-team',
    'admin-audit',
  ]) {
    queryClient.invalidateQueries({ queryKey: [key] })
  }
}

export function useSetSubscriptionStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; status: string; reason?: string }) =>
      requestWithPost<{ status: string; reason?: string }, AdminSubscription>(
        `/admin/subscriptions/${data.id}/status`,
        { status: data.status, reason: data.reason }
      ),
    onSuccess: () => invalidateAdmin(queryClient),
  })
}

export function useAdminTeams(filters: { q?: string; status?: string }) {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  const qs = params.toString()
  return useQuery({
    queryKey: ['admin-teams', qs],
    queryFn: () =>
      request<AdminTeamSummary[]>(`/admin/teams${qs ? `?${qs}` : ''}`),
  })
}

export function useAdminTeam(teamId: string | null) {
  return useQuery({
    queryKey: ['admin-team', teamId],
    queryFn: () => request<AdminTeamDetail>(`/admin/teams/${teamId}`),
    enabled: !!teamId,
  })
}

export interface NewTeam {
  name: string
  owner: string
  full_name?: string
  tax_id?: string
  billing_address?: string
}

export function useCreateTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: NewTeam) =>
      requestWithPost<NewTeam, AdminTeamSummary>('/admin/teams', data),
    onSuccess: () => invalidateAdmin(queryClient),
  })
}

/** Chuyển chủ team — backend ghi cả `teams.owner` lẫn `registered_by` của mọi subscription. */
export function useTransferOwner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { teamId: string; owner: string; reason?: string }) =>
      requestWithPost<{ owner: string; reason?: string }, AdminTeamSummary>(
        `/admin/teams/${data.teamId}/owner`,
        { owner: data.owner, reason: data.reason }
      ),
    onSuccess: () => invalidateAdmin(queryClient),
  })
}

export function useSubscribeForTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { teamId: string; appId: string; status: string }) =>
      requestWithPost<{ app_id: string; status: string }, AdminSubscription>(
        `/admin/teams/${data.teamId}/subscriptions`,
        { app_id: data.appId, status: data.status }
      ),
    onSuccess: () => invalidateAdmin(queryClient),
  })
}

export function useAdminApps() {
  return useQuery({
    queryKey: ['admin-apps'],
    queryFn: () => request<AdminApp[]>('/apps'),
  })
}

export function useUpdateApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; values: Partial<AdminApp> }) =>
      requestWithPatch<Partial<AdminApp>, AdminApp>(
        `/admin/apps/${data.id}`,
        data.values
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-apps'] })
      queryClient.invalidateQueries({ queryKey: ['admin-audit'] })
    },
  })
}

export function useAdminAudit(targetId?: string) {
  return useQuery({
    queryKey: ['admin-audit', targetId ?? ''],
    queryFn: () =>
      request<AuditEntry[]>(
        `/admin/audit${targetId ? `?target_id=${encodeURIComponent(targetId)}` : ''}`
      ),
  })
}

export function useAppVersions(appId?: string) {
  return useQuery({
    queryKey: ['admin-app-versions', appId ?? ''],
    queryFn: () =>
      request<AppVersion[]>(
        `/admin/app-versions${appId ? `?app_id=${encodeURIComponent(appId)}` : ''}`
      ),
  })
}

function invalidateOta(queryClient: ReturnType<typeof useQueryClient>) {
  for (const key of [
    'admin-app-versions',
    'admin-apps',
    'admin-subscriptions',
    'admin-teams',
    'admin-team',
    'admin-audit',
  ]) {
    queryClient.invalidateQueries({ queryKey: [key] })
  }
}

export function useCreateAppVersion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: NewAppVersion) =>
      requestWithPost<NewAppVersion, unknown>('/admin/app-versions', data),
    onSuccess: () => invalidateOta(queryClient),
  })
}

export function useSetDefaultAppVersion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (versionId: string) =>
      requestWithPost<object, AdminApp>(
        `/admin/app-versions/${encodeURIComponent(versionId)}/default`,
        {}
      ),
    onSuccess: () => invalidateOta(queryClient),
  })
}

export function useDeleteAppVersion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (versionId: string) =>
      requestWithDelete<unknown>(
        `/admin/app-versions/${encodeURIComponent(versionId)}`
      ),
    onSuccess: () => invalidateOta(queryClient),
  })
}

export function usePinSubscriptionOta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; versionId: string | null }) =>
      requestWithPost<{ version_id: string | null }, AdminSubscription>(
        `/admin/subscriptions/${data.id}/ota`,
        { version_id: data.versionId }
      ),
    onSuccess: () => invalidateOta(queryClient),
  })
}
