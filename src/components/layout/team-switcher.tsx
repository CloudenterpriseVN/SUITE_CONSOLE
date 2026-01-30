import { useState, useEffect } from 'react'
import { ChevronsUpDown, Check, Plus, Pencil, Building2, Loader2 } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useAtom } from 'jotai'
import { activeTeamIdAtom } from '@/stores/applicationStore'
import { useTeams, useCreateTeam, useUpdateTeam } from '@/hooks/use-team'
import { TeamDialog } from '@/components/team-dialog'
import type { Team } from '@/types/team'
import { toast } from 'sonner'

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const { data: teams, isLoading } = useTeams()
  const [activeTeamId, setActiveTeamId] = useAtom(activeTeamIdAtom)

  const createTeam = useCreateTeam()
  const updateTeam = useUpdateTeam()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)

  const teamArray = Array.isArray(teams) ? teams : []
  const activeTeam = teamArray.find((t: Team) => t.id === activeTeamId) ?? teamArray[0]

  // Tự động chọn team đầu tiên nếu chưa có active team hoặc team hiện tại không hợp lệ
  useEffect(() => {
    if (teamArray.length > 0) {
      const currentTeamValid = activeTeamId && teamArray.some((t: Team) => t.id === activeTeamId)
      if (!currentTeamValid) {
        setActiveTeamId(teamArray[0].id)
      }
    }
  }, [activeTeamId, teamArray, setActiveTeamId])

  const handleAddTeam = () => {
    setEditingTeam(null)
    setDialogOpen(true)
  }

  const handleEditTeam = (team: Team, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTeam(team)
    setDialogOpen(true)
  }

  const handleSaveTeam = async (teamData: Partial<Team>) => {
    try {
      if (editingTeam) {
        await updateTeam.mutateAsync({ id: editingTeam.id, ...teamData })
        toast.success('Đã cập nhật team')
      } else {
        await createTeam.mutateAsync(teamData)
        toast.success('Đã tạo team mới')
      }
      setDialogOpen(false)
    } catch (error) {
      toast.error(editingTeam ? 'Không thể cập nhật team' : 'Không thể tạo team')
    }
  }

  const handleSwitchTeam = (team: Team) => {
    setActiveTeamId(team.id)
  }

  const isSaving = createTeam.isPending || updateTeam.isPending

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg' disabled>
            <Skeleton className='size-8 rounded-lg' />
            <div className='grid flex-1 gap-1'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-3 w-16' />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Hiển thị UI tạo team khi chưa có team nào
  if (teamArray.length === 0) {
    return (
      <>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size='lg'
              onClick={handleAddTeam}
              className='border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5'
            >
              <div className='bg-primary/10 text-primary flex aspect-square size-8 items-center justify-center rounded-lg'>
                <Building2 className='size-4' />
              </div>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-semibold'>Tạo Team</span>
                <span className='truncate text-xs text-muted-foreground'>Bắt đầu sử dụng</span>
              </div>
              <Plus className='ml-auto size-4 text-primary' />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <TeamDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          team={null}
          onSave={handleSaveTeam}
          isSaving={isSaving}
        />
      </>
    )
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
                  <span className='truncate text-xs'>{activeTeam?.name ?? ''}</span>
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
                >
                  <div className='flex size-6 items-center justify-center rounded-sm border'>
                    <span className='text-sm font-medium'>{team.name?.charAt(0) ?? 'T'}</span>
                  </div>
                  <span className='flex-1'>{team.name}</span>
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
        isSaving={isSaving}
      />
    </>
  )
}
