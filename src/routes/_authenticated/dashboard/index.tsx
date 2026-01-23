import { createFileRoute, redirect } from '@tanstack/react-router'
import Dashboard from '@/features/dashboard'

export const Route = createFileRoute('/_authenticated/dashboard/')({
  beforeLoad: () => {
    // Check if app is selected from localStorage
    const savedApp = localStorage.getItem('current_app')
    if (!savedApp || savedApp === '""' || savedApp === 'null') {
      throw redirect({ to: '/' })
    }
  },
  component: Dashboard,
})
