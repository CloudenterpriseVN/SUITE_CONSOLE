import { createFileRoute } from '@tanstack/react-router'
import AdminSubscriptions from '@/features/admin/subscriptions'

export const Route = createFileRoute('/_authenticated/admin/subscriptions')({
  component: AdminSubscriptions,
})
