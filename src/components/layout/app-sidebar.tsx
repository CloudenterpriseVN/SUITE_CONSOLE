import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { NavGroup } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { TeamSwitcher } from '@/components/layout/team-switcher'
import { sidebarData } from './data/sidebar-data'
import { useAtomValue } from 'jotai'
import { savedAppState } from '@/stores/applicationStore'
import { useIsSuperadmin, usePendingCount } from '@/hooks/use-admin'
import { type NavGroup as NavGroupData } from './types'
import { adminNavGroup } from './data/sidebar-data'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const activeAppCode = useAtomValue(savedAppState)
  const isSuperadmin = useIsSuperadmin()
  const { data: pendingCount } = usePendingCount()

  // Filter out "Application" group if no app is selected
  const visibleNavGroups: NavGroupData[] = sidebarData.navGroups.filter((group) => {
    if (group.title === 'Application' && !activeAppCode) {
      return false
    }
    return true
  })

  // Khu quản trị nền tảng: chỉ superadmin thấy; badge = số đăng ký đang chờ duyệt.
  if (isSuperadmin) {
    visibleNavGroups.push({
      ...adminNavGroup,
      items: adminNavGroup.items.map((item) =>
        item.url === '/admin/subscriptions' && pendingCount ? { ...item, badge: String(pendingCount) } : item
      ),
    })
  }

  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {visibleNavGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
