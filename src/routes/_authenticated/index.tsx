import { createFileRoute } from '@tanstack/react-router'
// import Dashboard from '@/features/dashboard'
import Apps from '@/features/apps'

export const Route = createFileRoute('/_authenticated/')({
  // component: Dashboard,
  component: Apps,
})
