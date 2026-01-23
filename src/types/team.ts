export interface Team {
  id: string
  name: string
  owner: string  // email của owner
  verified: boolean  // *** KEY: Team verification
  logo?: string
  status: 'active' | 'suspended' | 'pending_verification'
  billingEmail: string
  taxId?: string
  address?: {
    street: string
    city: string
    province: string
    postalCode: string
    country: string
  }
  createdAt: string
  updatedAt: string
  key?: string  // Firestore key (optional, for compatibility)
}

export interface TeamMember {
  id: string
  email: string
  role: 'owner' | 'admin' | 'member'
  status: 'active' | 'pending' | 'inactive'
  invited_by: string
  create_at?: string
  updated_at?: string
  // Legacy fields for backward compatibility
  team_id?: string
  teamId?: string
  userId?: string
  displayName?: string
  photoURL?: string
  joinedAt?: string
}

export type TeamPermission =
  | 'view:billing'
  | 'manage:billing'
  | 'view:invoices'
  | 'pay:invoices'
  | 'invite:members'
  | 'manage:members'
  | 'edit:team'
  | 'subscribe:apps'  // Chỉ verified team mới có
  | 'access:apps'
