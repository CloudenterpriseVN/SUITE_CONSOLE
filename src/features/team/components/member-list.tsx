import { useTeamMembers } from '@/hooks/use-team'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'

const roleLabels: Record<string, string> = {
  owner: 'Chủ sở hữu',
  billing_admin: 'Quản lý thanh toán',
  member: 'Thành viên',
}

export function MemberList() {
  const { data: members } = useTeamMembers()

  const handleRevokeMember = (memberId: string, memberEmail: string) => {
    toast.success(`Đã thu hồi lời mời của ${memberEmail}`)
  }

  const handleInviteAgain = (memberId: string, memberEmail: string) => {
    toast.info(`Đã gửi lại lời mời cho ${memberEmail}`)
  }

  if (!members || members.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Chưa có thành viên nào</div>
  }

  return (
    <div className="space-y-4">
      {members?.map((member) => (
        <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={member.photoURL} />
              <AvatarFallback>{member.email?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{member.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline">{roleLabels[member.role]}</Badge>
            {member.role !== 'owner' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleInviteAgain(member.id, member.email)}>
                    Gửi lại lời mời
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleRevokeMember(member.id, member.email)}
                  >
                    Thu hồi
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
