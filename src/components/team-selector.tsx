import { useAtom } from 'jotai'
import { activeTeamIdAtom } from '@/stores/applicationStore'
import { useTeams } from '@/hooks/use-team'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function TeamSelector() {
  const { data: teams, isLoading } = useTeams()
  const [activeTeamId, setActiveTeamId] = useAtom(activeTeamIdAtom)

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Đang tải teams...</div>
  }

  if (!teams || teams.length === 0) {
    return <div className="text-sm text-muted-foreground">Không có team nào</div>
  }

  const activeTeam = teams.find(t => t.id === activeTeamId)

  return (
    <Select value={activeTeamId ?? ''} onValueChange={setActiveTeamId}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Chọn team">
          {activeTeam && <span>{activeTeam.name}</span>}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {teams.map((team) => (
          <SelectItem key={team.id} value={team.id}>
            {team.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
