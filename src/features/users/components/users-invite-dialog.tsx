import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { IconMailPlus, IconSend } from '@tabler/icons-react'
import { toast } from 'sonner'
import { sendInvitationEmail } from '@/utils/send-invitation-email'
import { useInviteTeamMember } from '@/hooks/use-team'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SelectDropdown } from '@/components/select-dropdown'
import { userTypes } from '../data/data'

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required.' })
    .email({ message: 'Email is invalid.' }),
  role: z.string().min(1, { message: 'Role is required.' }),
  desc: z.string().optional(),
})
type UserInviteForm = z.infer<typeof formSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersInviteDialog({ open, onOpenChange }: Props) {
  const form = useForm<UserInviteForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', role: '', desc: '' },
  })
  const { inviteMember } = useInviteTeamMember()
  const queryClient = useQueryClient()
  const [isInviting, setIsInviting] = useState(false)

  const onSubmit = async (values: UserInviteForm) => {
    setIsInviting(true)
    try {
      const invitation = await inviteMember(
        values.email.trim().toLowerCase(),
        values.role
      )

      // Invalidate queries to refresh member list
      queryClient.invalidateQueries({ queryKey: ['team-members'] })

      try {
        await sendInvitationEmail(invitation.email, invitation.id)
        toast.success(`Đã gửi email mời tới ${invitation.email}`)
      } catch {
        toast.error('Đã tạo lời mời nhưng chưa gửi được email', {
          description: 'Bạn có thể gửi lại từ danh sách thành viên đang chờ.',
        })
      }

      handleClose()
    } catch (error: unknown) {
      toast.error('Failed to invite member', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      })
    } finally {
      setIsInviting(false)
    }
  }

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-left'>
          <DialogTitle className='flex items-center gap-2'>
            <IconMailPlus /> Gửi lời mời
          </DialogTitle>
          <DialogDescription>
            Thành viên sẽ nhận email chứa liên kết xác minh, đặt mật khẩu và
            tham gia nhóm.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id='user-invite-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='eg: john.doe@gmail.com'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='role'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Vai trò</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder='Chọn vai trò'
                    items={userTypes
                      .filter(({ value }) => value !== 'owner')
                      .map(({ label, value }) => ({
                        label,
                        value,
                      }))}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter className='gap-y-2'>
          <DialogClose asChild>
            <Button variant='outline'>Hủy bỏ</Button>
          </DialogClose>
          <Button type='submit' form='user-invite-form' disabled={isInviting}>
            {isInviting ? 'đang gửi...' : 'Gửi lời mời'} <IconSend />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
