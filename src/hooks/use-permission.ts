import { useCurrentUser } from '@/stores/authStore'
import { useTeamMembers } from './use-team'
import type { TeamPermission } from '@/types/team'

const rolePermissions: Record<string, TeamPermission[]> = {
  owner: [
    'view:billing',
    'manage:billing',
    'view:invoices',
    'pay:invoices',
    'invite:members',
    'manage:members',
    'edit:team',
    'subscribe:apps',
    'access:apps',
  ],
  billing_admin: [
    'view:billing',
    'manage:billing',
    'view:invoices',
    'pay:invoices',
    'subscribe:apps',
    'access:apps',
  ],
  member: [
    'view:billing',
    'access:apps',
  ],
}

export function usePermission() {
  const user = useCurrentUser()
  const { data: members } = useTeamMembers()

  // Tìm role của user trong active team
  const currentMember = members?.find(m => m.email === user?.email)
  const teamRole = currentMember?.role || 'member'

  const can = (permission: TeamPermission): boolean => {
    return rolePermissions[teamRole]?.includes(permission) ?? false
  }

  const hasRole = (role: 'owner' | 'billing_admin' | 'member'): boolean => {
    return teamRole === role
  }

  return {
    can,
    hasRole,
    role: teamRole,
  }
}
