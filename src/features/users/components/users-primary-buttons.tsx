import { IconMailPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { useUsers } from '../context/users-context'

export function UsersPrimaryButtons() {
  const { setOpen } = useUsers()
  return (
    <div className='flex gap-2'>
      <Button
        className='space-x-1'
        onClick={() => setOpen('invite')}
      >
        <span>Invite Users</span> <IconMailPlus size={18} />
      </Button>
    </div>
  )
}
