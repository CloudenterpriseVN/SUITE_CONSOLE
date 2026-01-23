import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { activeTeamIdAtom } from '@/stores/applicationStore'
import { request, requestWithPost, requestWithPatch } from '@/utils/request'
import type { AppPricing, AppSubscription } from '@/types/subscription'
import type { Invoice } from '@/types/invoice'

// Get all app pricing
export function useAppPricing() {
  return useQuery({
    queryKey: ['app-pricing'],
    queryFn: async () => {
      // TODO: Implement backend endpoint /app-pricing
      return [] as AppPricing[]
    },
    enabled: false, // Temporarily disabled - endpoint not implemented
  })
}

// Get app subscriptions for active team (using real API)
export function useTeamSubscriptions(teamId?: string) {
  const activeTeamId = useAtomValue(activeTeamIdAtom)
  const selectedTeamId = teamId ?? activeTeamId

  return useQuery({
    queryKey: ['app-subscriptions', selectedTeamId],
    queryFn: async () => {
      if (!selectedTeamId) return []

      // Call real API endpoint: GET /subscriptions?team_id=xxx
      const API_URL = import.meta.env.VITE_API_URL
      if (!API_URL) {
        // Fallback to mock data if no API URL
        const allSubscriptions = await request<AppSubscription[]>('/app-subscriptions')
        return allSubscriptions.filter(s => s.teamId === selectedTeamId)
      }

      return await request<AppSubscription[]>(`/subscriptions?team_id=${selectedTeamId}`)
    },
    enabled: !!selectedTeamId,
  })
}

// Get all invoices
export function useAllInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      // TODO: Implement backend endpoint /invoices
      return [] as Invoice[]
    },
    enabled: false, // Temporarily disabled - endpoint not implemented
  })
}

// Get invoices for active team
export function useTeamInvoices(teamId?: string) {
  const activeTeamId = useAtomValue(activeTeamIdAtom)
  const selectedTeamId = teamId ?? activeTeamId

  return useQuery({
    queryKey: ['invoices', selectedTeamId],
    queryFn: async () => {
      // TODO: Implement backend endpoint /invoices
      return [] as Invoice[]
    },
    enabled: false, // Temporarily disabled - endpoint not implemented
  })
}

// Check if active team has subscription for specific app
export function useAppSubscriptionStatus(appId: string) {
  const { data: subscriptions } = useTeamSubscriptions()

  const subscription = subscriptions?.find((s: AppSubscription) =>
    s.app_id === appId &&
    (s.status === 'registered' || s.status === 'active' || s.status === 'suspended')
  )

  return {
    isSubscribed: !!subscription,
    subscription,
    canAccess: !!subscription && (subscription.status === 'registered' || subscription.status === 'active'),
  }
}

// Create new subscription (real API)
export function useCreateSubscription() {
  const queryClient = useQueryClient()
  const activeTeamId = useAtomValue(activeTeamIdAtom)

  return useMutation({
    mutationFn: async (data: { team_id: string; app_id: string }) => {
      return await requestWithPost('/subscriptions', data, {})
    },
    onSuccess: () => {
      // Invalidate and refetch subscriptions
      queryClient.invalidateQueries({ queryKey: ['app-subscriptions', activeTeamId] })
    },
  })
}

// Update subscription status (real API)
export function useUpdateSubscriptionStatus() {
  const queryClient = useQueryClient()
  const activeTeamId = useAtomValue(activeTeamIdAtom)

  return useMutation({
    mutationFn: async (data: { subscriptionId: string; status: 'registered' | 'active' | 'suspended' }) => {
      return await requestWithPatch(
        `/subscriptions/${data.subscriptionId}`,
        { status: data.status }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-subscriptions', activeTeamId] })
    },
  })
}
