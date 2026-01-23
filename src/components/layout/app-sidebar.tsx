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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const activeAppCode = useAtomValue(savedAppState)

  // Filter out "Application" group if no app is selected
  const visibleNavGroups = sidebarData.navGroups.filter((group) => {
    if (group.title === 'Application' && !activeAppCode) {
      return false
    }
    return true
  })

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
