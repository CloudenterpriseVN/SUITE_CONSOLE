// API Key model
export interface APIKey {
  id: string
  subscription_id: string
  name: string
  key_prefix: string     // "sk_live_xxxxxxxx" - 16 chars for display
  status: 'active' | 'revoked'
  created_by: string
  create_at?: string
  updated_at?: string
}

// Response when creating a new API key (contains full key)
export interface CreateAPIKeyResponse {
  id: string
  name: string
  key: string           // Full key - only shown once!
  key_prefix: string
  status: 'active' | 'revoked'
  created_by: string
  create_at?: string
}

// Request to create a new API key
export interface CreateAPIKeyRequest {
  name: string
}
