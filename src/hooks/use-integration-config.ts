import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { activeTeamIdAtom } from '@/stores/applicationStore'
import {
  request,
  requestWithPost,
  requestWithPatch,
  requestWithDelete,
} from '@/utils/request'
import type { OdooConfig, FeedConfig, OdooTestResult } from '@/types/integration'

// ─── Odoo Config ────────────────────────────────────────────

export function useOdooConfig() {
  const teamId = useAtomValue(activeTeamIdAtom)

  return useQuery({
    queryKey: ['odoo-config', teamId],
    queryFn: async () => {
      if (!teamId) return null
      return await request<OdooConfig>(`/teams/${teamId}/odoo-config`)
    },
    enabled: !!teamId,
    retry: false,
  })
}

export function useSaveOdooConfig() {
  const teamId = useAtomValue(activeTeamIdAtom)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<OdooConfig>) => {
      if (!teamId) throw new Error('Team ID is required')
      return await requestWithPatch<Partial<OdooConfig>, OdooConfig>(
        `/teams/${teamId}/odoo-config`,
        data
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['odoo-config', teamId] })
    },
  })
}

export function useDeleteOdooConfig() {
  const teamId = useAtomValue(activeTeamIdAtom)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!teamId) throw new Error('Team ID is required')
      return await requestWithDelete(`/teams/${teamId}/odoo-config`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['odoo-config', teamId] })
    },
  })
}

export function useTestOdooConnection() {
  const teamId = useAtomValue(activeTeamIdAtom)

  return useMutation({
    mutationFn: async (data?: Partial<OdooConfig>) => {
      if (!teamId) throw new Error('Team ID is required')
      return await requestWithPost<Partial<OdooConfig> | {}, OdooTestResult>(
        `/teams/${teamId}/odoo-test`,
        data ?? {},
        {}
      )
    },
  })
}

// ─── Feed Config ────────────────────────────────────────────

export function useFeedConfig() {
  const teamId = useAtomValue(activeTeamIdAtom)

  return useQuery({
    queryKey: ['feed-config', teamId],
    queryFn: async () => {
      if (!teamId) return null
      return await request<FeedConfig>(`/teams/${teamId}/feed-config`)
    },
    enabled: !!teamId,
    retry: false,
  })
}

export function useSaveFeedConfig() {
  const teamId = useAtomValue(activeTeamIdAtom)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<FeedConfig>) => {
      if (!teamId) throw new Error('Team ID is required')
      return await requestWithPatch<Partial<FeedConfig>, FeedConfig>(
        `/teams/${teamId}/feed-config`,
        data
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-config', teamId] })
    },
  })
}

export function useDeleteFeedConfig() {
  const teamId = useAtomValue(activeTeamIdAtom)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!teamId) throw new Error('Team ID is required')
      return await requestWithDelete(`/teams/${teamId}/feed-config`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-config', teamId] })
    },
  })
}
