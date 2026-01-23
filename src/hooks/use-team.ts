import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { activeTeamIdAtom, savedAppState, appsState } from '@/stores/applicationStore'
import { request, requestWithPost, requestWithDelete } from '@/utils/request'
import type { Team, TeamMember } from '@/types/team'
import { useTeamSubscriptions } from './use-app-subscription'

// Get all teams for current user
export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      return await request<Team[]>('/teams')
    },
  })
}

// Get active team
export function useActiveTeam() {
  const activeTeamId = useAtomValue(activeTeamIdAtom)

  return useQuery({
    queryKey: ['team', activeTeamId],
    queryFn: async () => {
      const teams = await request<Team[]>('/teams')
      return teams.find(t => t.id === activeTeamId) ?? null
    },
    enabled: !!activeTeamId,
  })
}

// Get team members by subscription
export function useTeamMembers() {
  const activeTeamId = useAtomValue(activeTeamIdAtom)
  const activeAppCode = useAtomValue(savedAppState)
  const apps = useAtomValue(appsState)
  const { data: subscriptions } = useTeamSubscriptions()

  // Find active app
  const activeApp = apps.find(app => app.code === activeAppCode)

  // Find subscription for current team and app
  const subscription = subscriptions?.find(
    (sub: any) => sub.team_id === activeTeamId && sub.app_id === activeApp?.id
  )

  return useQuery({
    queryKey: ['team-members', subscription?.id],
    queryFn: async () => {
      if (!subscription?.id) return []

      // Call real API endpoint: GET /subscriptions/{subscription_id}/members
      const API_URL = import.meta.env.VITE_API_URL
      if (!API_URL) {
        return []
      }

      return await request<TeamMember[]>(`/subscriptions/${subscription.id}/members`)
    },
    enabled: !!subscription?.id,
  })
}

// Invite team member (creates member with pending status)
export function useInviteTeamMember() {
  const activeTeamId = useAtomValue(activeTeamIdAtom)
  const activeAppCode = useAtomValue(savedAppState)
  const apps = useAtomValue(appsState)
  const { data: subscriptions } = useTeamSubscriptions()

  const activeApp = apps.find(app => app.code === activeAppCode)
  const subscription = subscriptions?.find(
    (sub: any) => sub.team_id === activeTeamId && sub.app_id === activeApp?.id
  )

  return {
    inviteMember: async (email: string, role: string = 'member') => {
      if (!subscription?.id) {
        throw new Error('No active subscription found')
      }

      const API_URL = import.meta.env.VITE_API_URL
      if (!API_URL) {
        throw new Error('API URL not configured')
      }

      return await requestWithPost<{ email: string; role: string }, TeamMember>(
        `/subscriptions/${subscription.id}/members`,
        { email, role }
      )
    },
    subscriptionId: subscription?.id,
  }
}

// Revoke team member (owner only - deletes invitation)
export function useRevokeMember() {
  const queryClient = useQueryClient()
  const activeTeamId = useAtomValue(activeTeamIdAtom)
  const activeAppCode = useAtomValue(savedAppState)
  const apps = useAtomValue(appsState)
  const { data: subscriptions } = useTeamSubscriptions()

  const activeApp = apps.find(app => app.code === activeAppCode)
  const subscription = subscriptions?.find(
    (sub: any) => sub.team_id === activeTeamId && sub.app_id === activeApp?.id
  )

  return useMutation({
    mutationFn: async (memberId: string) => {
      if (!subscription?.id) {
        throw new Error('No active subscription found')
      }

      return await requestWithDelete<{ message: string }>(
        `/subscriptions/${subscription.id}/members/${memberId}`
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', subscription?.id] })
    },
  })
}
