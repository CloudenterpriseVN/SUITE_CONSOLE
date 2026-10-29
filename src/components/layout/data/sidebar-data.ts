import {
  IconApps,
  IconCreditCard,
  IconHelp,
  IconHistory,
  IconKey,
  IconPackages,
  IconShieldCheck,
  IconUsersGroup,
  IconUserCog,
} from '@tabler/icons-react'
import { type NavGroup, type SidebarData } from '../types'

// Chỉ hiện cho superadmin (app-sidebar.tsx). Mục Subscriptions mang badge số đăng ký chờ duyệt.
export const adminNavGroup: NavGroup = {
  title: 'Quản trị nền tảng',
  items: [
    { title: 'Teams', url: '/admin', icon: IconUsersGroup },
    { title: 'Subscriptions', url: '/admin/subscriptions', icon: IconShieldCheck },
    { title: 'Apps / OTA', url: '/admin/apps', icon: IconApps },
    { title: 'Nhật ký', url: '/admin/audit', icon: IconHistory },
  ],
}

export const sidebarData: SidebarData = {
  
  navGroups: [
    {
      title: 'Chung',
      items: [

        {
          title: 'Ứng dụng',
          url: '/',
          icon: IconPackages,
        },
        {
          title: 'Thanh toán',
          url: '/billing',
          icon: IconCreditCard,
        },
        {
          title: 'API Keys',
          url: '/api-keys',
          icon: IconKey,
        },
      ],
    },
    {
      title: 'Application',
      items: [
        {
          title: 'Settings',
          url: '/settings',
          icon: IconUserCog,
        },
      ],
    },
    {
      title: 'Khác',
      items: [
        {
          title: 'Trợ giúp',
          url: '/help-center',
          icon: IconHelp,
        },
      ],
    },
  ],
}
