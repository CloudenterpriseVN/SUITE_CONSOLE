import { sendSignInLinkToEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export async function sendInvitationEmail(email: string, invitationId: string) {
  const continueUrl = new URL('/accept-invitation', window.location.origin)
  continueUrl.searchParams.set('invitationId', invitationId)

  await sendSignInLinkToEmail(auth, email, {
    url: continueUrl.toString(),
    handleCodeInApp: true,
  })
}
