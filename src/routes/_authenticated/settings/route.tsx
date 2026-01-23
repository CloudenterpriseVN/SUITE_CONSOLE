import { createFileRoute, redirect } from '@tanstack/react-router'
import Settings from '@/features/settings'

export const Route = createFileRoute('/_authenticated/settings')({
  beforeLoad: () => {
    // Check if app is selected from localStorage
    const savedApp = localStorage.getItem('current_app')
    if (!savedApp || savedApp === '""' || savedApp === 'null') {
      throw redirect({ to: '/' })
    }
  },
  component: Settings,
})
