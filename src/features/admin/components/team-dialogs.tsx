import { useState } from 'react'
import { toast } from 'sonner'
import {
  type AdminApp,
  type NewTeam,
  SUGGESTED_STATUSES,
  useCreateTeam,
  useSubscribeForTeam,
  useTransferOwner,
} from '@/hooks/use-admin'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { statusLabel } from './status'

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

async function attempt(
  fn: () => Promise<unknown>,
  ok: string,
  done: () => void
) {
  try {
    await fn()
    toast.success(ok)
    done()
  } catch (e) {
    toast.error((e as Error).message)
  }
}

export function CreateTeamDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated?: (teamId: string) => void
}) {
  const create = useCreateTeam()
  const [form, setForm] = useState<NewTeam>({
    name: '',
    owner: '',
    full_name: '',
    tax_id: '',
    billing_address: '',
  })
  const set = (k: keyof NewTeam) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))
  const valid = form.name.trim() && isEmail(form.owner)

  const field = (label: string, k: keyof NewTeam, placeholder = '') => (
    <div className='grid gap-1.5'>
      <Label htmlFor={`nt-${k}`}>{label}</Label>
      <Input
        id={`nt-${k}`}
        value={form[k] ?? ''}
        placeholder={placeholder}
        onChange={set(k)}
      />
    </div>
  )

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo team</DialogTitle>
          <DialogDescription>
            Chủ team chưa cần có tài khoản — đăng nhập Suite bằng đúng email này
            là thành chủ team.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-3'>
          {field('Tên team', 'name', 'Cửa hàng ABC')}
          {field('Email chủ team', 'owner', 'chu@congty.vn')}
          {field('Tên đầy đủ (pháp nhân)', 'full_name')}
          {field('Mã số thuế', 'tax_id')}
          {field('Địa chỉ', 'billing_address')}
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Huỷ
          </Button>
          <Button
            disabled={!valid || create.isPending}
            onClick={() =>
              attempt(
                async () => {
                  const team = await create.mutateAsync(form)
                  onCreated?.(team.id)
                },
                `Đã tạo team ${form.name}`,
                onClose
              )
            }
          >
            Tạo team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function TransferOwnerDialog({
  teamId,
  teamName,
  currentOwner,
  onClose,
}: {
  teamId: string
  teamName: string
  currentOwner?: string
  onClose: () => void
}) {
  const transfer = useTransferOwner()
  const [owner, setOwner] = useState('')
  const [reason, setReason] = useState('')
  const same = owner.trim().toLowerCase() === (currentOwner ?? '').toLowerCase()

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chuyển chủ team {teamName}</DialogTitle>
          <DialogDescription>
            Chủ hiện tại: {currentOwner ?? '—'}. Chủ mới có toàn quyền team và
            mọi ứng dụng của team; chủ cũ mất quyền chủ (hiệu lực trong tối đa 5
            phút).
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-1.5'>
          <Label htmlFor='to-owner'>Email chủ mới</Label>
          <Input
            id='to-owner'
            value={owner}
            placeholder='chu.moi@congty.vn'
            onChange={(e) => setOwner(e.target.value)}
          />
        </div>
        <Textarea
          placeholder='Lý do (không bắt buộc)'
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Huỷ
          </Button>
          <Button
            variant='destructive'
            disabled={!isEmail(owner) || same || transfer.isPending}
            onClick={() =>
              attempt(
                () => transfer.mutateAsync({ teamId, owner, reason }),
                `Đã chuyển chủ sang ${owner}`,
                onClose
              )
            }
          >
            Chuyển chủ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function SubscribeForTeamDialog({
  teamId,
  teamName,
  apps,
  subscribedAppIds,
  onClose,
}: {
  teamId: string
  teamName: string
  apps: AdminApp[]
  subscribedAppIds: string[]
  onClose: () => void
}) {
  const subscribe = useSubscribeForTeam()
  const available = apps.filter((a) => !subscribedAppIds.includes(a.id))
  const [appId, setAppId] = useState(available[0]?.id ?? '')
  const [status, setStatus] = useState('active')

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đăng ký dịch vụ cho {teamName}</DialogTitle>
          <DialogDescription>
            Subscription đứng tên chủ team. Đặt "Đang hoạt động" để team dùng
            được ngay.
          </DialogDescription>
        </DialogHeader>
        {available.length === 0 ? (
          <p className='text-muted-foreground text-sm'>
            Team đã đăng ký mọi ứng dụng.
          </p>
        ) : (
          <div className='grid gap-3'>
            <div className='grid gap-1.5'>
              <Label>Ứng dụng</Label>
              <Select value={appId} onValueChange={setAppId}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Chọn ứng dụng' />
                </SelectTrigger>
                <SelectContent>
                  {available.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name ?? a.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-1.5'>
              <Label>Trạng thái ban đầu</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUGGESTED_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Huỷ
          </Button>
          <Button
            disabled={!appId || subscribe.isPending}
            onClick={() =>
              attempt(
                () => subscribe.mutateAsync({ teamId, appId, status }),
                `Đã đăng ký ${available.find((a) => a.id === appId)?.name ?? ''}`,
                onClose
              )
            }
          >
            Đăng ký
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
