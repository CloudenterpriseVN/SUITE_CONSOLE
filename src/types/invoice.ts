export interface Invoice {
  id: string
  invoiceNumber: string
  teamId: string
  appCode: string
  appName: string
  status: 'draft' | 'pending' | 'paid' | 'failed' | 'cancelled'
  amount: number
  tax: number
  totalAmount: number
  dueDate: string
  paidAt?: string
  periodStart: string
  periodEnd: string
  description?: string
}

export interface PaymentRecord {
  id: string
  invoiceId: string
  teamId: string
  gateway: 'vnpay' | 'momo' | 'zalopay'
  amount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  paymentMethod?: string
  paidAt?: string
}
