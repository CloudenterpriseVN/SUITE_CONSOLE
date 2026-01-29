import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { activeTeamIdAtom, savedAppState } from '@/stores/applicationStore'
import { request, requestWithPost, requestWithDelete } from '@/utils/request'
import { useTeamSubscriptions } from './use-app-subscription'
import type { APIKey, CreateAPIKeyResponse, CreateAPIKeyRequest } from '@/types/api-key'

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

// Get all API keys for a subscription
export function useSubscriptionAPIKeys(subscriptionId: string | undefined) {
  return useQuery({
    queryKey: ['api-keys', subscriptionId],
    queryFn: async () => {
      if (!subscriptionId) return []
      return await request<APIKey[]>(`/subscriptions/${subscriptionId}/api-keys`)
    },
    enabled: !!subscriptionId,
  })
}

// Get API keys for active subscription (uses context)
export function useActiveSubscriptionAPIKeys() {
  const { subscriptionId } = useActiveSubscription()
  return useSubscriptionAPIKeys(subscriptionId)
}

// Create a new API key
export function useCreateAPIKey(subscriptionId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateAPIKeyRequest) => {
      if (!subscriptionId) throw new Error('Subscription ID is required')
      return await requestWithPost<CreateAPIKeyRequest, CreateAPIKeyResponse>(
        `/subscriptions/${subscriptionId}/api-keys`,
        data,
        {}
      )
    },
    onSuccess: () => {
      // Invalidate and refetch API keys
      queryClient.invalidateQueries({ queryKey: ['api-keys', subscriptionId] })
    },
  })
}

// Delete an API key
export function useDeleteAPIKey(subscriptionId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (keyId: string) => {
      if (!subscriptionId) throw new Error('Subscription ID is required')
      return await requestWithDelete(`/subscriptions/${subscriptionId}/api-keys/${keyId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys', subscriptionId] })
    },
  })
}

// Regenerate an API key
export function useRegenerateAPIKey(subscriptionId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (keyId: string) => {
      if (!subscriptionId) throw new Error('Subscription ID is required')
      return await requestWithPost<{}, CreateAPIKeyResponse>(
        `/subscriptions/${subscriptionId}/api-keys/${keyId}/regenerate`,
        {},
        {}
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys', subscriptionId] })
    },
  })
}
