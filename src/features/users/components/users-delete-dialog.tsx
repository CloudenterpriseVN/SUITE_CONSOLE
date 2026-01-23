'use client'

import { useState } from 'react'
import { UserX } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { User } from '../data/schema'
import { useRevokeMember } from '@/hooks/use-team'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersDeleteDialog({ open, onOpenChange, currentRow }: Props) {
  const [value, setValue] = useState('')
  const revokeMutation = useRevokeMember()

  const handleRevoke = async () => {
    if (value.trim() !== currentRow.email) return

    try {
      await revokeMutation.mutateAsync(currentRow.id)
      toast.success(`Access revoked for ${currentRow.email}`)
      onOpenChange(false)
      setValue('')
    } catch (error) {
      toast.error('Failed to revoke access')
      console.error('Revoke error:', error)
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleRevoke}
      disabled={value.trim() !== currentRow.email || revokeMutation.isPending}
      title={
        <span className='text-destructive'>
          <UserX
            className='stroke-destructive mr-1 inline-block'
            size={18}
          />{' '}
          Revoke Access
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            Are you sure you want to revoke access for{' '}
            <span className='font-bold'>{currentRow.email}</span>?
            <br />
            This will remove their <span className='font-bold uppercase'>{currentRow.role}</span> access from the team.
          </p>

          <Label className='my-2'>
            Email:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='Enter email to confirm'
            />
          </Label>

          <Alert variant='destructive'>
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              This member will no longer have access to this team.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText='Revoke Access'
      destructive
    />
  )
}
