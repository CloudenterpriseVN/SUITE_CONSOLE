import { FormEvent, HTMLAttributes, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { IconBrandGoogle } from '@tabler/icons-react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { auth as firebaseAuth } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

type UserAuthFormProps = HTMLAttributes<HTMLDivElement>

function getInternalRedirect() {
  const redirect = new URLSearchParams(window.location.search).get('redirect')

  if (!redirect?.startsWith('/')) return '/'

  const destination = new URL(redirect, window.location.origin)

  return destination.origin === window.location.origin
    ? `${destination.pathname}${destination.search}${destination.hash}`
    : '/'
}

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { auth } = useAuthStore()

  async function finishSignIn() {
    // Refresh data that may depend on the Firebase ID token before entering the app.
    await queryClient.invalidateQueries()
    navigate({ to: getInternalRedirect() })
  }

  async function handlePasswordSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    try {
      await signInWithEmailAndPassword(firebaseAuth, email.trim(), password)
      await finishSignIn()
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Email/password sign-in failed', err)
      toast.error('Email hoặc mật khẩu không đúng')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setIsLoading(true)
    try {
      await auth.signInWithGoogle?.()
      await finishSignIn()
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Google sign-in failed', err)
      toast.error('Đăng nhập Google thất bại')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('grid gap-4', className)} {...props}>
      <form onSubmit={handlePasswordSignIn} className='grid gap-3'>
        <div className='grid gap-2'>
          <label htmlFor='sign-in-email' className='text-sm font-medium'>
            Email
          </label>
          <Input
            id='sign-in-email'
            type='email'
            autoComplete='email'
            placeholder='name@example.com'
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        <div className='grid gap-2'>
          <label htmlFor='sign-in-password' className='text-sm font-medium'>
            Mật khẩu
          </label>
          <PasswordInput
            id='sign-in-password'
            autoComplete='current-password'
            placeholder='••••••••'
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        <Button type='submit' disabled={isLoading} size='lg' className='w-full'>
          {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>

      <div className='relative'>
        <div className='absolute inset-0 flex items-center'>
          <span className='w-full border-t' />
        </div>
        <div className='relative flex justify-center text-xs uppercase'>
          <span className='bg-background text-muted-foreground px-2'>Hoặc</span>
        </div>
      </div>

      <Button
        type='button'
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        size='lg'
        variant='outline'
        className='w-full'
      >
        <IconBrandGoogle className='mr-2 h-5 w-5' />
        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập bằng Google'}
      </Button>
    </div>
  )
}
