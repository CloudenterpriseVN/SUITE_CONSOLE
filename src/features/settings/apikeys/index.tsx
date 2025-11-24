import { Main } from '@/components/layout/main'

export default function APIKeys() {

  return (
      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>API Keys</h2>
            <p className='text-muted-foreground'>
              Manage your API keys for integration
            </p>
          </div>
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
            
        </div>
      </Main>
  )
}