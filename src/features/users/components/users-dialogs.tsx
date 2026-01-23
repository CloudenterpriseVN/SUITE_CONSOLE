import { useUsers } from '../context/users-context'
import { UsersDeleteDialog } from './users-delete-dialog'
import { UsersInviteDialog } from './users-invite-dialog'

export function UsersDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useUsers()
  return (
    <>
      <UsersInviteDialog
        key='user-invite'
        open={open === 'invite'}
        onOpenChange={() => setOpen('invite')}
      />

      {currentRow && (
        <UsersDeleteDialog
          key={`user-revoke-${currentRow.id}`}
          open={open === 'revoke'}
          onOpenChange={() => {
            setOpen('revoke')
            setTimeout(() => {
              setCurrentRow(null)
            }, 500)
          }}
          currentRow={currentRow}
        />
      )}
    </>
  )
}
