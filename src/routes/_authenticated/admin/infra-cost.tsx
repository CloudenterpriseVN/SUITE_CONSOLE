import { createFileRoute } from '@tanstack/react-router'
import AdminInfraCost from '@/features/admin/infra-cost'

export const Route = createFileRoute('/_authenticated/admin/infra-cost')({
  component: AdminInfraCost,
})
