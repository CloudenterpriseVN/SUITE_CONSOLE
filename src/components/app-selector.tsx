import { useAtom, useAtomValue } from 'jotai'
import { savedAppState, appsState } from '@/stores/applicationStore'
import { useTeamSubscriptions } from '@/hooks/use-app-subscription'
import { useActiveTeam } from '@/hooks/use-team'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useMemo } from 'react'

export function AppSelector() {
  const apps = useAtomValue(appsState)
  const { data: activeTeam } = useActiveTeam()
  const { data: subscriptions } = useTeamSubscriptions()
  const [activeAppCode, setActiveAppCode] = useAtom(savedAppState)

  // Filter apps that have active subscription
  const activeApps = useMemo(() => {
    if (!subscriptions || !apps) return []

    const activeSubscriptions = subscriptions.filter(s => s.status === 'active')
    return apps.filter(app =>
      activeSubscriptions.some(sub => sub.app_id === app.id)
    )
  }, [apps, subscriptions])

  if (!activeTeam) {
    return <div className="text-sm text-muted-foreground">Chọn team trước</div>
  }

  if (activeApps.length === 0) {
    return <div className="text-sm text-muted-foreground">Chưa kích hoạt ứng dụng</div>
  }

  return (
    <Select value={activeAppCode ?? ''} onValueChange={setActiveAppCode}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Chọn ứng dụng" />
      </SelectTrigger>
      <SelectContent>
        {activeApps.map((app) => (
          <SelectItem key={app.id} value={app.code}>
            <div className="flex items-center gap-2">
              <span>{app.name}</span>
              {app.code === activeAppCode && (
                <Badge variant="default" className="text-xs">
                  Selected
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
