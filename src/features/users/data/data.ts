import {
  IconShield,
  IconUsersGroup,
  IconUser,
} from '@tabler/icons-react'
import { UserStatus } from './schema'

export const callTypes = new Map<UserStatus, string>([
  ['active', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['inactive', 'bg-neutral-300/40 border-neutral-300'],
  ['pending', 'bg-sky-200/40 text-sky-900 dark:text-sky-100 border-sky-300'],
])

export const userTypes = [
  {
    label: 'Owner',
    value: 'owner',
    icon: IconShield,
  },
  {
    label: 'Admin',
    value: 'admin',
    icon: IconUsersGroup,
  },
  {
    label: 'Member',
    value: 'member',
    icon: IconUser,
  },
] as const
