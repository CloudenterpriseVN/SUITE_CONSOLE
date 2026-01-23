import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { MemberList } from '@/features/team/components/member-list'
import { InviteMemberDialog } from '@/features/team/components/invite-member-dialog'
import { AppSelector } from '@/components/app-selector'
import { useActiveTeam } from '@/hooks/use-team'
import { Button } from '@/components/ui/button'
import { UserPlus, AlertCircle } from 'lucide-react'

function TeamMembersPage() {
  const [inviteOpen, setInviteOpen] = useState(false)
  const { data: activeTeam } = useActiveTeam()

  return (
    <div className="flex h-full flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Thành viên</h1>
          <p className="text-muted-foreground">
            Quản lý thành viên và quyền truy cập trong team
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setInviteOpen(true)} disabled={!activeTeam}>
            <UserPlus className="h-4 w-4 mr-2" />
            Mời thành viên
          </Button>
          <AppSelector />
        </div>
      </div>

      {!activeTeam ? (
        <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-4 rounded-md">
          <AlertCircle className="h-4 w-4" />
          <span>Vui lòng chọn team để xem danh sách thành viên</span>
        </div>
      ) : (
        <MemberList />
      )}

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/team/members')({
  component: TeamMembersPage,
})
