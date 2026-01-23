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
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { AppSelector } from '@/components/app-selector'
import { AppSubscriptionCard } from './components/app-subscription-card'
import { appsState, savedAppState } from '@/stores/applicationStore'
import { useActiveTeam } from '@/hooks/use-team'
import { useCreateSubscription } from '@/hooks/use-app-subscription'
import { useAtomValue, useSetAtom } from 'jotai'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { AlertCircle, Loader2 } from 'lucide-react'

const appText = new Map<string, string>([
  ['all', 'All Apps'],
  ['subscribed', 'Subscribed'],
  ['notSubscribed', 'Not Subscribed'],
])

export default function Apps() {
  const apps = useAtomValue(appsState)
  const setActiveApp = useSetAtom(savedAppState)
  const { data: activeTeam } = useActiveTeam()
  const navigate = useNavigate()
  const createSubscription = useCreateSubscription()
  const [sort, setSort] = useState('ascending')
  const [searchTerm, setSearchTerm] = useState('')

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
    }
  }

  const handleAccess = (appCode: string) => {
    setActiveApp(appCode)
    navigate({ to: '/dashboard' })
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

        {!activeTeam ? (
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
                    onSubscribe={() => handleSubscribe(app.id, app.name)}
                    onAccess={() => handleAccess(app.code)}
                    isSubscribing={createSubscription.isPending}
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
