import { Row } from '@tanstack/react-table'
import { UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUsers } from '../context/users-context'
import { User } from '../data/schema'

interface DataTableRowActionsProps {
  row: Row<User>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useUsers()

  return (
    <Button
      variant='ghost'
      size='sm'
      onClick={() => {
        setCurrentRow(row.original)
        setOpen('revoke')
      }}
      className='text-destructive hover:text-destructive'
    >
      <UserX className='h-4 w-4 mr-2' />
      Revoke
    </Button>
  )
}
