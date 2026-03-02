export interface OdooConfig {
  enabled: boolean
  url: string
  db: string
  username: string
  password?: string
  company_id?: number
  timeout: number
  created_at?: string
  updated_at?: string
}

export interface FeedConfig {
  source: string
  base_url: string
  auth_type: 'token' | 'api_key'
  auth_value?: string
  resources: string[]
  cache_ttl_minutes: number
  created_at?: string
  updated_at?: string
}

export interface OdooTestResult {
  success: boolean
  message: string
  version?: string
}
