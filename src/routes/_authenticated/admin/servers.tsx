import { createFileRoute } from '@tanstack/react-router'
import AdminServers from '@/features/admin/servers'

export const Route = createFileRoute('/_authenticated/admin/servers')({
  component: AdminServers,
})
