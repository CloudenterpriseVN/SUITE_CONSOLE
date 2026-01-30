import { columns } from './components/users-columns'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersTable } from './components/users-table'
import UsersProvider from './context/users-context'
import { useTeamMembers } from '@/hooks/use-team'
import { useActiveTeam } from '@/hooks/use-team'
import { AlertCircle } from 'lucide-react'

export default function Users() {
  const { data: activeTeam } = useActiveTeam()
  const { data: members, isLoading } = useTeamMembers()

  // Map team members to user list format
  const userList = (members || []).map((member) => ({
    id: member.id || '',
    email: member.email || '',
    role: (member.role || 'member') as 'owner' | 'admin' | 'member',
    status: (member.status || 'active') as 'active' | 'pending' | 'inactive',
  }))

  return (
    <UsersProvider>
      <div className='flex-1 w-full flex flex-col'>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Team Members</h2>
            <p className='text-muted-foreground'>
              Manage team members and their roles here.
            </p>
          </div>
          <UsersPrimaryButtons />
        </div>

        {!activeTeam ? (
          <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-4 rounded-md my-4">
            <AlertCircle className="h-4 w-4" />
            <span>Please select a team to view members</span>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center p-8">
            <span className="text-muted-foreground">Loading members...</span>
          </div>
        ) : (
          <div className='flex-1 overflow-auto py-1'>
            <UsersTable data={userList} columns={columns} />
          </div>
        )}
      </div>

      <UsersDialogs />
    </UsersProvider>
  )
}