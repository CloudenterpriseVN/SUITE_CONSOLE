import { createFileRoute } from '@tanstack/react-router'
import AdminAudit from '@/features/admin/audit'

export const Route = createFileRoute('/_authenticated/admin/audit')({
  component: AdminAudit,
})
