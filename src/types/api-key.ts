// Vai trò của API key trong team (không có owner)
export type APIKeyRole = 'admin' | 'member'

// API Key model: key của team, dùng cho các app trong `apps` (mã ngắn: pos, wms, dms...)
export interface APIKey {
  id: string
  team_id?: string
  subscription_id?: string   // key cũ gắn một subscription (giữ cho tương thích ngược)
  apps: string[]
  role: APIKeyRole
  name: string
  key_prefix: string     // "sk_live_xxxxxxxx" - 16 chars for display
  status: 'active' | 'revoked'
  created_by: string
  create_at?: string
  updated_at?: string
}

// App của team mà người dùng cấp key được
export interface TeamKeyApp {
  app: string
  app_code: string
  status: string
}

export interface TeamAPIKeys {
  keys: APIKey[]
  apps: TeamKeyApp[]
}

// Response when creating a new API key (contains full key)
export interface CreateAPIKeyResponse extends APIKey {
  key: string           // Full key - only shown once!
}

// Request to create a new API key
export interface CreateAPIKeyRequest {
  name: string
  apps: string[]
  role: APIKeyRole
}

export type UpdateAPIKeyRequest = Partial<CreateAPIKeyRequest>
