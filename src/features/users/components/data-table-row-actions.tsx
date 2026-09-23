import { useState } from 'react'
import { Row } from '@tanstack/react-table'
import { UserX } from 'lucide-react'
import { toast } from 'sonner'
import { sendInvitationEmail } from '@/utils/send-invitation-email'
import { Button } from '@/components/ui/button'
import { useUsers } from '../context/users-context'
import { User } from '../data/schema'

interface DataTableRowActionsProps {
  row: Row<User>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useUsers()
  const [isSending, setIsSending] = useState(false)

  const resend = async () => {
    setIsSending(true)
    try {
      await sendInvitationEmail(row.original.email, row.original.id)
      toast.success(`Đã gửi lại lời mời tới ${row.original.email}`)
    } catch {
      toast.error('Không thể gửi lại email mời')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className='flex justify-end gap-2'>
      {row.original.status === 'pending' && (
        <Button
          variant='outline'
          size='sm'
          onClick={resend}
          disabled={isSending}
        >
          {isSending ? 'Đang gửi...' : 'Gửi lại email'}
        </Button>
      )}
      <Button
        variant='ghost'
        size='sm'
        onClick={() => {
          setCurrentRow(row.original)
          setOpen('revoke')
        }}
        className='text-destructive hover:text-destructive'
      >
        <UserX className='mr-2 h-4 w-4' />
        Revoke
      </Button>
    </div>
  )
}
