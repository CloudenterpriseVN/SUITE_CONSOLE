import { useState } from 'react'
import { ChevronsUpDown, Check, Plus, Pencil, AlertCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { useAtom } from 'jotai'
import { teamsState, activeTeamIdAtom, localTeamsAtom, modifiedTeamIdsAtom } from '@/stores/applicationStore'
import { TeamDialog } from '@/components/team-dialog'
import type { Team } from '@/types/team'
import { toast } from 'sonner'

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const [teams] = useAtom(teamsState)
  const [activeTeamId, setActiveTeamId] = useAtom(activeTeamIdAtom)
  const [, setLocalTeams] = useAtom(localTeamsAtom)
  const [modifiedTeamIds, setModifiedTeamIds] = useAtom(modifiedTeamIdsAtom)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)

  // Chỉ lấy các team đã được phê duyệt để switch
  const teamArray = Array.isArray(teams) ? teams : []
  const verifiedTeams = teamArray.filter((team: Team) => team.verified)
  const activeTeam = verifiedTeams.find((t: Team) => t.id === activeTeamId) ?? verifiedTeams[0]

  const handleAddTeam = () => {
    setEditingTeam(null)
    setDialogOpen(true)
  }

  const handleEditTeam = (team: Team, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTeam(team)
    setDialogOpen(true)
  }

  const handleSaveTeam = (teamData: Partial<Team>) => {
    if (editingTeam) {
      // Edit mode
      const updatedTeams = teamArray.map((t: Team) =>
        t.id === editingTeam.id
          ? { ...t, ...teamData, updatedAt: new Date().toISOString() }
          : t
      )
      setLocalTeams(updatedTeams)
      setModifiedTeamIds(new Set([...modifiedTeamIds, editingTeam.id]))
      toast.success('Đã cập nhật team')
    } else {
      // Add mode
      const newTeam: Team = {
        id: `team_${Date.now()}`,
        name: teamData.name || '',
        owner: '', // Will be set by server
        verified: false,
        status: 'pending_verification',
        billingEmail: teamData.billingEmail || '',
        taxId: teamData.taxId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setLocalTeams([...teamArray, newTeam])
      setModifiedTeamIds(new Set([...modifiedTeamIds, newTeam.id]))
      toast.success('Đã tạo team mới. Team cần được phê duyệt trước khi sử dụng.')
    }
  }

  const handleSwitchTeam = (team: Team) => {
    if (!team.verified) {
      toast.error('Chỉ có thể chuyển sang team đã được phê duyệt')
      return
    }
    setActiveTeamId(team.id)
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              >
                <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                  <span className='text-sm font-semibold'>
                    {activeTeam?.name?.charAt(0) ?? 'T'}
                  </span>
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-semibold'>Suite Console</span>
                  <span className='truncate text-xs'>{activeTeam?.name ?? '—'}</span>
                </div>
                <ChevronsUpDown className='ml-auto' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
              align='start'
              side={isMobile ? 'bottom' : 'right'}
              sideOffset={4}
            >
              <DropdownMenuLabel className='text-muted-foreground text-xs'>
                Teams
              </DropdownMenuLabel>
              {teamArray.map((team: Team, index: number) => (
                <DropdownMenuItem
                  key={team.id}
                  onClick={() => handleSwitchTeam(team)}
                  className='gap-2 p-2'
                  disabled={!team.verified}
                >
                  <div className='flex size-6 items-center justify-center rounded-sm border'>
                    <span className='text-sm font-medium'>{team.name?.charAt(0) ?? 'T'}</span>
                  </div>
                  <div className='flex flex-1 flex-col'>
                    <span className={!team.verified ? 'text-muted-foreground' : ''}>
                      {team.name}
                    </span>
                    <div className='flex items-center gap-1'>
                      {!team.verified && (
                        <Badge variant='secondary' className='text-[10px] px-1 py-0'>
                          Chờ duyệt
                        </Badge>
                      )}
                      {modifiedTeamIds.has(team.id) && (
                        <Badge variant='outline' className='text-[10px] px-1 py-0 text-orange-600 border-orange-300'>
                          <AlertCircle className='h-2.5 w-2.5 mr-0.5' />
                          Có thay đổi
                        </Badge>
                      )}
                    </div>
                  </div>
                  {activeTeamId === team.id && <Check className='h-4 w-4' />}
                  <button
                    onClick={(e) => handleEditTeam(team, e)}
                    className='p-1 hover:bg-accent rounded'
                  >
                    <Pencil className='h-3 w-3 text-muted-foreground' />
                  </button>
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleAddTeam} className='gap-2 p-2'>
                <div className='bg-background flex size-6 items-center justify-center rounded-md border'>
                  <Plus className='size-4' />
                </div>
                <div className='font-medium'>Thêm team mới</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <TeamDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        team={editingTeam}
        onSave={handleSaveTeam}
      />
    </>
  )
}
