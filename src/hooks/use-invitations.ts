import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { request, requestWithDelete } from '@/utils/request'

export interface Invitation {
  id: string
  subscription_id: string
  email: string
  role: string
  status: string
  invited_by: string
  team?: {
    id: string
    name: string
    owner: string
  }
  app?: {
    id: string
    name: string
    code: string
    logo: string
  }
}

// Get all invitations for current user
export function useInvitations() {
  return useQuery({
    queryKey: ['invitations'],
    queryFn: async () => {
      return await request<Invitation[]>('/invitations')
    },
  })
}

// Withdraw invitation
export function useWithdrawInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invitationId: string) => {
      return await requestWithDelete(`/invitations/${invitationId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
  })
}
