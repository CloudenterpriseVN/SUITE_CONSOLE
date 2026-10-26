import { createFileRoute } from '@tanstack/react-router'
import AdminApps from '@/features/admin/apps'

export const Route = createFileRoute('/_authenticated/admin/apps')({
  component: AdminApps,
})
