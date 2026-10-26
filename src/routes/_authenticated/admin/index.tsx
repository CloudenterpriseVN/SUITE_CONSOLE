import { createFileRoute } from '@tanstack/react-router'
import AdminTeams from '@/features/admin/teams'

export const Route = createFileRoute('/_authenticated/admin/')({
  component: AdminTeams,
})
