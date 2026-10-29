import { createFileRoute } from '@tanstack/react-router'
import APIKeys from '@/features/api-keys'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'

// API key của team (một key cho các app được chọn), không thuộc riêng app nào
function APIKeysPage() {
  return (
    <>
      <Header>
        <div className='ml-auto flex items-center gap-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <APIKeys />
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/api-keys/')({
  component: APIKeysPage,
})
