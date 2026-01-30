import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { auth } from '@/lib/firebase'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    // Chờ Firebase auth state được khởi tạo
    await auth.authStateReady()

    // Redirect nếu chưa đăng nhập
    if (!auth.currentUser) {
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
