import { useState, useEffect } from 'react'
import {
  IconAdjustmentsHorizontal,
  IconSortAscendingLetters,
  IconSortDescendingLetters,
} from '@tabler/icons-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { AppSelector } from '@/components/app-selector'
import { AppSubscriptionCard } from './components/app-subscription-card'
import { loadableAppsState, savedAppState } from '@/stores/applicationStore'
import { useActiveTeam } from '@/hooks/use-team'
import { useCreateSubscription } from '@/hooks/use-app-subscription'
import { useAtom, useSetAtom } from 'jotai'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'

const appText = new Map<string, string>([
  ['all', 'All Apps'],
  ['subscribed', 'Subscribed'],
  ['notSubscribed', 'Not Subscribed'],
])

export default function Apps() {
  const [appsLoadable] = useAtom(loadableAppsState)
  const setActiveApp = useSetAtom(savedAppState)
  const { data: activeTeam, isLoading: isTeamLoading } = useActiveTeam()
  const navigate = useNavigate()
  const createSubscription = useCreateSubscription()
  const [sort, setSort] = useState('ascending')
  const [searchTerm, setSearchTerm] = useState('')
  const [subscribingAppId, setSubscribingAppId] = useState<string | null>(null)

  const isLoading = appsLoadable.state === 'loading' || isTeamLoading
  const apps = appsLoadable.state === 'hasData' ? appsLoadable.data : []

  // Check for invitation acceptance redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.get('invitation_accepted') === 'true') {
      toast.success('Invitation accepted!', {
        description: 'You have successfully joined the team',
      })
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }

    const error = params.get('error')
    if (error) {
      const errorMessages: Record<string, string> = {
        subscription_not_found: 'Subscription not found',
        member_not_found: 'Member invitation not found',
        email_mismatch: 'This invitation is not for your email',
        invitation_already_accepted: 'This invitation has already been accepted',
        server_error: 'An error occurred while processing the invitation',
      }
      toast.error('Failed to accept invitation', {
        description: errorMessages[error] || 'Unknown error',
      })
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleSubscribe = async (appId: string, appName: string) => {
    if (!activeTeam?.id) {
      toast.error('Vui lòng chọn team trước')
      return
    }

    setSubscribingAppId(appId)

    try {
      await createSubscription.mutateAsync({
        team_id: activeTeam.id,
        app_id: appId,
      })
      toast.success(`Đã đăng ký ${appName} thành công!`, {
        description: 'Subscription đang ở trạng thái "Đã đăng ký"',
      })
    } catch (error: any) {
      toast.error('Đăng ký thất bại', {
        description: error.message || 'Có lỗi xảy ra khi đăng ký app',
      })
    } finally {
      setSubscribingAppId(null)
    }
  }

  const handleAccess = (appCode: string) => {
    setActiveApp(appCode)
    navigate({ to: '/settings' })
  }

  const filteredApps = apps
    .sort((a, b) =>
      sort === 'ascending'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    )
    .filter((app) => app.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <Search />
        <div className='ml-auto flex items-center gap-4'>
          <AppSelector />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Content ===== */}
      <Main fixed>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            Suite Apps
          </h1>
          <p className='text-muted-foreground'>
            Explore and subscribe to our enterprise apps
          </p>
        </div>

        {isLoading ? (
          <>
            <div className='my-4 flex items-end justify-between sm:my-0 sm:items-center'>
              <Skeleton className='h-9 w-40 lg:w-[250px]' />
              <Skeleton className='h-9 w-16' />
            </div>
            <Separator className='shadow-sm' />
            <ul className='faded-bottom no-scrollbar grid gap-4 overflow-auto pt-4 pb-16 md:grid-cols-2 lg:grid-cols-3'>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <li key={i}>
                  <div className='rounded-lg border p-4 space-y-3'>
                    <div className='flex items-center gap-3'>
                      <Skeleton className='h-12 w-12 rounded-lg' />
                      <div className='space-y-2'>
                        <Skeleton className='h-4 w-32' />
                        <Skeleton className='h-3 w-24' />
                      </div>
                    </div>
                    <Skeleton className='h-8 w-full' />
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : !activeTeam ? (
          <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-4 rounded-md my-4">
            <AlertCircle className="h-4 w-4" />
            <span>Vui lòng chọn team để xem và đăng ký ứng dụng</span>
          </div>
        ) : (
          <>
            <div className='my-4 flex items-end justify-between sm:my-0 sm:items-center'>
              <div className='flex flex-col gap-4 sm:my-4 sm:flex-row'>
                <Input
                  placeholder='Filter apps...'
                  className='h-9 w-40 lg:w-[250px]'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className='w-16'>
                  <SelectValue>
                    <IconAdjustmentsHorizontal size={18} />
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align='end'>
                  <SelectItem value='ascending'>
                    <div className='flex items-center gap-4'>
                      <IconSortAscendingLetters size={16} />
                      <span>Ascending</span>
                    </div>
                  </SelectItem>
                  <SelectItem value='descending'>
                    <div className='flex items-center gap-4'>
                      <IconSortDescendingLetters size={16} />
                      <span>Descending</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator className='shadow-sm' />
            <ul className='faded-bottom no-scrollbar grid gap-4 overflow-auto pt-4 pb-16 md:grid-cols-2 lg:grid-cols-3'>
              {filteredApps.map((app) => (
                <li key={app.id}>
                  <AppSubscriptionCard
                    appId={app.id}
                    appCode={app.code}
                    appName={app.name}
                    appLogo={app.logo}
                    onSubscribe={() => handleSubscribe(app.id, app.name)}
                    onAccess={() => handleAccess(app.code)}
                    isSubscribing={subscribingAppId === app.id}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </Main>
    </>
  )
}
