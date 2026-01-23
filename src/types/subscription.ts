// App pricing - per-app pricing model
export interface AppPricing {
  appCode: string
  appName: string
  description: string
  pricing: {
    monthly: number
    yearly: number
  }
  features: string[]
}

// App subscription - per-team per-app subscription
export interface AppSubscription {
  id: string
  team_id: string
  app_id: string
  status: 'registered' | 'active' | 'suspended'
  registered_by: string
  create_at?: string
  updated_at?: string
  // Legacy fields for backward compatibility
  teamId?: string
  appCode?: string
  billingCycle?: 'monthly' | 'yearly'
  currentPeriodStart?: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd?: boolean
  subscribedAt?: string
}
