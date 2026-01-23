import { HTMLAttributes, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { IconBrandGoogle } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

type UserAuthFormProps = HTMLAttributes<HTMLDivElement>

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { auth } = useAuthStore()

  async function handleGoogleSignIn() {
    setIsLoading(true)
    try {
      await auth.signInWithGoogle?.()

      // Invalidate all queries to force refetch with new auth token
      await queryClient.invalidateQueries()

      const redirect = new URLSearchParams(window.location.search).get('redirect')
      navigate({ to: redirect || '/' })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Google sign-in failed', err)
      toast.error('Sign in with Google failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('grid gap-4', className)} {...props}>
      <Button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        size='lg'
        className='w-full'
      >
        <IconBrandGoogle className='h-5 w-5 mr-2' />
        {isLoading ? 'Signing in...' : 'Sign in with Google'}
      </Button>
    </div>
  )
}
