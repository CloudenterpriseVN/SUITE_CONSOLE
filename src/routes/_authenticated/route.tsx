import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    // Check token from Cookies directly
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)

    const accessToken = cookies['access_token']

    // Redirect to sign-in if user is not authenticated
    if (!accessToken) {
      throw redirect({
        to: '/sign-in-2',
        search: {
          redirect: location.pathname,
        },
      })
    }
  },
  component: AuthenticatedLayout,
})
