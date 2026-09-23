import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, createFileRoute } from '@tanstack/react-router'
import {
  isSignInWithEmailLink,
  reload,
  signInWithEmailLink,
  updatePassword,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { requestWithPost } from '@/utils/request'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/password-input'

function invitationIdFromLink() {
  let url = new URL(window.location.href)
  for (let depth = 0; depth < 3; depth += 1) {
    const id = url.searchParams.get('invitationId')
    if (id) return id
    const nested =
      url.searchParams.get('continueUrl') || url.searchParams.get('link')
    if (!nested) break
    try {
      url = new URL(nested)
    } catch {
      break
    }
  }
  return null
}

function AcceptInvitation() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [invitationId] = useState(invitationIdFromLink)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isReady, setIsReady] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [isWorking, setIsWorking] = useState(false)
  const [error, setError] = useState('')
  const emailLink = isSignInWithEmailLink(auth, window.location.href)

  useEffect(() => {
    auth.authStateReady().then(() => {
      const verifiedUid = invitationId
        ? sessionStorage.getItem(`invitation-verified:${invitationId}`)
        : null
      setIsVerified(
        !emailLink &&
          Boolean(auth.currentUser?.emailVerified) &&
          verifiedUid === auth.currentUser?.uid
      )
      setIsReady(true)
    })
  }, [emailLink, invitationId])

  const verifyEmail = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setIsWorking(true)
    try {
      const credential = await signInWithEmailLink(
        auth,
        email.trim().toLowerCase(),
        window.location.href
      )
      await reload(credential.user)
      if (!credential.user.emailVerified)
        throw new Error('Email chưa được xác minh')
      sessionStorage.setItem(
        `invitation-verified:${invitationId}`,
        credential.user.uid
      )
      const cleanUrl = new URL('/accept-invitation', window.location.origin)
      cleanUrl.searchParams.set('invitationId', invitationId!)
      window.history.replaceState({}, '', cleanUrl)
      setIsVerified(true)
    } catch {
      setError(
        'Không thể xác minh liên kết. Hãy kiểm tra email hoặc yêu cầu gửi lại lời mời.'
      )
    } finally {
      setIsWorking(false)
    }
  }

  const accept = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Mật khẩu cần ít nhất 8 ký tự.')
      return
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    if (!invitationId || !auth.currentUser?.emailVerified) {
      setError('Email hoặc lời mời chưa được xác minh.')
      return
    }

    setIsWorking(true)
    try {
      await updatePassword(auth.currentUser, password)
      await auth.currentUser.getIdToken(true)
      await requestWithPost(
        `/invitations/${encodeURIComponent(invitationId)}/accept`,
        {}
      )
      sessionStorage.removeItem(`invitation-verified:${invitationId}`)
      await queryClient.invalidateQueries()
      navigate({ to: '/' })
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Không thể hoàn tất lời mời. Vui lòng thử lại.'
      )
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <div className='bg-muted/30 flex min-h-svh items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle>Tham gia team</CardTitle>
          <CardDescription>
            Xác minh email và đặt mật khẩu để chấp nhận lời mời.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!invitationId ? (
            <p className='text-destructive text-sm'>
              Liên kết mời không hợp lệ.
            </p>
          ) : !isReady ? (
            <p className='text-muted-foreground text-sm'>
              Đang kiểm tra tài khoản...
            </p>
          ) : !isVerified && !emailLink ? (
            <p className='text-destructive text-sm'>
              Liên kết xác minh đã hết hạn hoặc không hợp lệ. Hãy yêu cầu gửi
              lại lời mời.
            </p>
          ) : !isVerified ? (
            <form className='space-y-4' onSubmit={verifyEmail}>
              <div className='space-y-2'>
                <Label htmlFor='invite-email'>Email nhận lời mời</Label>
                <Input
                  id='invite-email'
                  type='email'
                  autoComplete='email'
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              {error && (
                <p role='alert' className='text-destructive text-sm'>
                  {error}
                </p>
              )}
              <Button type='submit' className='w-full' disabled={isWorking}>
                Xác minh email
              </Button>
            </form>
          ) : (
            <form className='space-y-4' onSubmit={accept}>
              <p className='text-muted-foreground text-sm'>
                Email đã xác minh: {auth.currentUser?.email}
              </p>
              <div className='space-y-2'>
                <Label htmlFor='invite-password'>Mật khẩu mới</Label>
                <PasswordInput
                  id='invite-password'
                  autoComplete='new-password'
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='invite-confirm-password'>
                  Xác nhận mật khẩu
                </Label>
                <PasswordInput
                  id='invite-confirm-password'
                  autoComplete='new-password'
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
              {error && (
                <p role='alert' className='text-destructive text-sm'>
                  {error}
                </p>
              )}
              <Button type='submit' className='w-full' disabled={isWorking}>
                Đặt mật khẩu và tham gia team
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/(auth)/accept-invitation')({
  component: AcceptInvitation,
})
