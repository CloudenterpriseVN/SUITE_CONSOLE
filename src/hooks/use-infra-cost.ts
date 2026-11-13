// Chi phí hạ tầng theo team (superadmin) — API /admin/cost/* của Cloud Function console.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request, requestWithPost } from '@/utils/request'

export interface CostUnits {
  requests?: number
  active_users?: number
  active_devices?: number
  transactions?: number
}

export interface TeamCost {
  team_id: string
  team_name: string
  /** Chi phí trực tiếp trước credit (dùng để định giá) */
  gross: number
  /** Chi phí trực tiếp thực trả */
  net: number
  overhead_equal: number
  overhead_usage: number
  apps: Record<string, { gross: number; net: number }>
  drivers: Record<string, number>
  units: CostUnits
  units_by_app: Record<string, CostUnits>
}

export interface CostReport {
  month: string
  built_at: string
  currency: string
  teams: TeamCost[]
  overhead: { gross: number; net: number; drivers: Record<string, number> }
  reconciliation: {
    gross_total?: number
    net_total?: number
    gross_attributed?: number
    attributed_ratio?: number
    fs_read_coverage?: number
  }
}

export function useCostMonths() {
  return useQuery({
    queryKey: ['admin-cost-months'],
    queryFn: () => request<{ months: string[] }>('/admin/cost/reports'),
    select: (d) => d.months,
  })
}

export function useCostReport(month: string | undefined) {
  return useQuery({
    queryKey: ['admin-cost-report', month],
    queryFn: () => request<CostReport>(`/admin/cost/reports/${month}`),
    enabled: !!month,
    retry: false,
  })
}

export function useRebuildCostReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (month: string) =>
      requestWithPost<object, CostReport>(`/admin/cost/reports/${month}/build`, {}),
    onSuccess: (report) => {
      qc.setQueryData(['admin-cost-report', report.month], report)
      qc.invalidateQueries({ queryKey: ['admin-cost-months'] })
    },
  })
}
