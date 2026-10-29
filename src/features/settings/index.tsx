import { Outlet } from '@tanstack/react-router'
import {
  IconApi,
  IconBrowserCheck,
  IconDatabase,
  IconNotification,
  IconPalette,
  IconUser,
} from '@tabler/icons-react'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import SidebarNav from './components/sidebar-nav'
import { TopNav } from '@/components/layout/top-nav'

export default function Settings() {
  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <TopNav />
          <div className='ml-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
      </Header>

      <Main fixed>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            Cài đặt
          </h1>
          <p className='text-muted-foreground'>
            Thiết lập cài đặt cho ứng dụng.
          </p>
        </div>
        <Separator className='my-4 lg:my-6' />
        <div className='flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <aside className='top-0 lg:sticky lg:w-52 shrink-0'>
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className='flex flex-1 w-full overflow-y-hidden p-1'>
            <Outlet />
          </div>
        </div>
      </Main>
    </>
  )
}

const sidebarNavItems = [
  {
    title: 'Thành viên',
    icon: <IconUser size={18} />,
    href: '/settings',
  },
  {
    title: 'Odoo',
    icon: <IconDatabase size={18} />,
    href: '/settings/odoo',
  },
  {
    title: 'Feeding API',
    icon: <IconApi size={18} />,
    href: '/settings/feed',
  },
  {
    title: 'Webhooks',
    icon: <IconPalette size={18} />,
    href: '/settings/webhooks',
  },
]
