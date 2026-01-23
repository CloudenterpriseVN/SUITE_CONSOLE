import { Main } from '@/components/layout/main'
import { useInvitations, useAcceptInvitation, useWithdrawInvitation } from '@/hooks/use-invitations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Mail } from 'lucide-react'
import { toast } from 'sonner'

export default function Invitations() {
  const { data: invitations, isLoading } = useInvitations()
  const acceptMutation = useAcceptInvitation()
  const withdrawMutation = useWithdrawInvitation()

  const handleAccept = async (invitationId: string) => {
    try {
      await acceptMutation.mutateAsync(invitationId)
      toast.success('Invitation accepted successfully!')
    } catch (error) {
      toast.error('Failed to accept invitation')
    }
  }

  const handleWithdraw = async (invitationId: string) => {
    try {
      await withdrawMutation.mutateAsync(invitationId)
      toast.success('Invitation withdrawn successfully!')
    } catch (error) {
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
        <div className="flex items-center justify-center p-8">
          <span className="text-muted-foreground">Loading invitations...</span>
        </div>
      ) : !invitations || invitations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No invitations</h3>
            <p className="text-sm text-muted-foreground">
              You don't have any invitations at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {invitations.map((invitation) => {
            const isPending = invitation.status === 'pending'
            const isActive = invitation.status === 'active'
            const statusVariant = invitation.status === 'active'
              ? 'default'
              : invitation.status === 'pending'
              ? 'outline'
              : 'destructive'

            return (
              <Card key={invitation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {invitation.team?.name || 'Unknown Team'}
                        <Badge variant="secondary" className="capitalize">
                          {invitation.role}
                        </Badge>
                        <Badge variant={statusVariant} className="capitalize">
                          {invitation.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {invitation.app?.name || 'Unknown App'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {isPending && (
                        <Button
                          size="sm"
                          onClick={() => handleAccept(invitation.id)}
                          disabled={acceptMutation.isPending}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                      )}
                      {(isPending || isActive) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleWithdraw(invitation.id)}
                          disabled={withdrawMutation.isPending}
                        >
                          <X className="h-4 w-4 mr-2" />
                          {isPending ? 'Decline' : 'Withdraw'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Invited by: <span className="font-medium">{invitation.invited_by}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </Main>
  )
}
