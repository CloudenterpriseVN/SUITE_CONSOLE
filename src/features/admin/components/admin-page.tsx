import { Link, useLocation } from '@tanstack/react-router'
import { ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminMe } from '@/hooks/use-admin'
import { Card, CardContent } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'

const TABS = [
  { to: '/admin', label: 'Teams' },
  { to: '/admin/subscriptions', label: 'Subscriptions' },
  { to: '/admin/apps', label: 'Apps / OTA' },
  { to: '/admin/audit', label: 'Nhật ký' },
] as const

/** Khung chung của khu quản trị nền tảng: chặn người không phải superadmin + thanh tab. */
export function AdminPage({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  const { data: me, isLoading } = useAdminMe()
  const { pathname } = useLocation()

  return (
    <>
      <Header>
        <div className='ml-auto flex items-center gap-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        {isLoading ? (
          <p className='text-muted-foreground'>Đang kiểm tra quyền…</p>
        ) : !me?.is_superadmin ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-16'>
              <ShieldAlert className='text-muted-foreground mb-4 h-12 w-12' />
              <h3 className='mb-2 text-lg font-semibold'>Không có quyền</h3>
              <p className='text-muted-foreground text-sm'>
                Khu này chỉ dành cho quản trị viên nền tảng.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className='mb-4'>
              <h2 className='text-2xl font-bold tracking-tight'>{title}</h2>
              <p className='text-muted-foreground'>{description}</p>
            </div>
            <nav className='bg-muted mb-6 inline-flex flex-wrap gap-1 rounded-lg p-1'>
              {TABS.map((t) => (
                <Link
                  key={t.to}
                  to={t.to}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    pathname === t.to ||
                      (t.to !== '/admin' && pathname.startsWith(t.to))
                      ? 'bg-background shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t.label}
                </Link>
              ))}
            </nav>
            {children}
          </>
        )}
      </Main>
    </>
  )
}
