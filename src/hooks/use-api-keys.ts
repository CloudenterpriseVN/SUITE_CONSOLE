import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { activeTeamIdAtom, savedAppState } from '@/stores/applicationStore'
import { request, requestWithPost, requestWithPatch, requestWithDelete } from '@/utils/request'
import { useTeamSubscriptions } from './use-app-subscription'
import type {
  APIKey, CreateAPIKeyResponse, CreateAPIKeyRequest, TeamAPIKeys, UpdateAPIKeyRequest,
} from '@/types/api-key'

// Get active subscription based on current team + app context
export function useActiveSubscription() {
  const activeTeamId = useAtomValue(activeTeamIdAtom)
  const activeAppCode = useAtomValue(savedAppState)
  const { data: subscriptions, isLoading } = useTeamSubscriptions()

  const subscription = subscriptions?.find(
    s => s.team_id === activeTeamId && s.app_code === activeAppCode
  )

  return {
    subscription,
    subscriptionId: subscription?.id,
    isLoading,
    hasSubscription: !!subscription,
  }
}

// API key của team: một key cho nhiều app (`apps`), vai trò `admin` | `member`
export function useTeamAPIKeys() {
  const teamId = useAtomValue(activeTeamIdAtom)
  return useQuery({
    queryKey: ['api-keys', teamId],
    queryFn: () => request<TeamAPIKeys>(`/teams/${teamId}/api-keys`),
    enabled: !!teamId,
  })
}

function useTeamKeyMutation<P, T>(call: (teamId: string, args: P) => Promise<T>) {
  const teamId = useAtomValue(activeTeamIdAtom)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (args: P) => {
      if (!teamId) throw new Error('Team is required')
      return await call(teamId, args)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys', teamId] }),
  })
}

export function useCreateAPIKey() {
  return useTeamKeyMutation((teamId, data: CreateAPIKeyRequest) =>
    requestWithPost<CreateAPIKeyRequest, CreateAPIKeyResponse>(`/teams/${teamId}/api-keys`, data, {}))
}

export function useUpdateAPIKey() {
  return useTeamKeyMutation((teamId, { id, ...data }: UpdateAPIKeyRequest & { id: string }) =>
    requestWithPatch<UpdateAPIKeyRequest, APIKey>(`/teams/${teamId}/api-keys/${id}`, data, {}))
}

export function useDeleteAPIKey() {
  return useTeamKeyMutation((teamId, keyId: string) => requestWithDelete(`/teams/${teamId}/api-keys/${keyId}`))
}

export function useRegenerateAPIKey() {
  return useTeamKeyMutation((teamId, keyId: string) =>
    requestWithPost<Record<string, never>, CreateAPIKeyResponse>(`/teams/${teamId}/api-keys/${keyId}/regenerate`, {}, {}))
}
