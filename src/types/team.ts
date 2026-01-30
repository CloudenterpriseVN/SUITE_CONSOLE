export interface Team {
  id: string
  name: string             // Tên ngắn (hiển thị)
  fullName?: string        // Tên đầy đủ (xuất hoá đơn)
  owner: string            // email của owner (dùng cho billing)
  logo?: string
  billingAddress?: string  // Địa chỉ xuất hoá đơn
  taxId?: string           // Mã số thuế
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
  | 'subscribe:apps'
  | 'access:apps'
