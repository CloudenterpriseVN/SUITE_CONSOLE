import { X, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { useInvitations, useWithdrawInvitation } from '@/hooks/use-invitations'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Main } from '@/components/layout/main'

export default function Invitations() {
  const { data: invitations, isLoading } = useInvitations()
  const withdrawMutation = useWithdrawInvitation()

  const handleWithdraw = async (invitationId: string) => {
    try {
      await withdrawMutation.mutateAsync(invitationId)
      toast.success('Invitation withdrawn successfully!')
    } catch {
      toast.error('Failed to withdraw invitation')
    }
  }

  return (
    <Main>
      <div className='mb-6'>
        <h2 className='text-2xl font-bold tracking-tight'>Invitations</h2>
        <p className='text-muted-foreground'>
          Manage your team invitations here.
        </p>
      </div>

      {isLoading ? (
        <div className='flex items-center justify-center p-8'>
          <span className='text-muted-foreground'>Loading invitations...</span>
        </div>
      ) : !invitations || invitations.length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-16'>
            <Mail className='text-muted-foreground mb-4 h-12 w-12' />
            <h3 className='mb-2 text-lg font-semibold'>No invitations</h3>
            <p className='text-muted-foreground text-sm'>
              You don't have any invitations at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4'>
          {invitations.map((invitation) => {
            const isPending = invitation.status === 'pending'
            const isActive = invitation.status === 'active'
            const statusVariant =
              invitation.status === 'active'
                ? 'default'
                : invitation.status === 'pending'
                  ? 'outline'
                  : 'destructive'

            return (
              <Card key={invitation.id}>
                <CardHeader>
                  <div className='flex items-start justify-between'>
                    <div className='space-y-1'>
                      <CardTitle className='flex items-center gap-2'>
                        {invitation.team?.name || 'Unknown Team'}
                        <Badge variant='secondary' className='capitalize'>
                          {invitation.role}
                        </Badge>
                        <Badge variant={statusVariant} className='capitalize'>
                          {invitation.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {invitation.app?.name || 'Unknown App'}
                      </CardDescription>
                    </div>
                    <div className='flex gap-2'>
                      {(isPending || isActive) && (
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => handleWithdraw(invitation.id)}
                          disabled={withdrawMutation.isPending}
                        >
                          <X className='mr-2 h-4 w-4' />
                          {isPending ? 'Decline' : 'Withdraw'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='text-muted-foreground text-sm'>
                    Invited by:{' '}
                    <span className='font-medium'>{invitation.invited_by}</span>
                  </div>
                  {isPending && (
                    <p className='text-muted-foreground mt-2 text-sm'>
                      Mở liên kết trong email mời và đặt mật khẩu để tham gia
                      team.
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </Main>
  )
}
