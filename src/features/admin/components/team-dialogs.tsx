import { useState } from 'react'
import { toast } from 'sonner'
import {
  type AdminApp,
  type NewTeam,
  SUGGESTED_STATUSES,
  useCreateTeam,
  useOnpremServers,
  useSetTeamServer,
  useSetRetention,
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

export function RetentionDialog({
  teamId,
  teamName,
  current,
  effective,
  onClose,
}: {
  teamId: string
  teamName: string
  current: number | null | undefined
  effective: number | undefined
  onClose: () => void
}) {
  const set = useSetRetention()
  const [useDefault, setUseDefault] = useState(current == null)
  const [days, setDays] = useState(String(current ?? effective ?? 90))
  const [reason, setReason] = useState('')
  const n = Number(days)
  const valid = useDefault || (Number.isInteger(n) && n >= 7 && n <= 730)
  const value = useDefault ? null : n
  const same = value === (current ?? null)

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thời hạn lưu giao dịch — {teamName}</DialogTitle>
          <DialogDescription>
            Giao dịch đã hoàn thành (ca đã đóng / ERP đã nhận, đơn DMS xong,
            phiếu WMS đã nhập) bị xoá khỏi mọi ứng dụng sau số ngày này. Chỉ áp
            cho giao dịch hoàn thành từ nay; dữ liệu đã có cần chạy backfill.
          </DialogDescription>
        </DialogHeader>
        <Select
          value={useDefault ? 'default' : 'custom'}
          onValueChange={(v) => setUseDefault(v === 'default')}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='default'>
              Mặc định nền tảng ({effective ?? 90} ngày)
            </SelectItem>
            <SelectItem value='custom'>Riêng cho team</SelectItem>
          </SelectContent>
        </Select>
        {!useDefault && (
          <div className='grid gap-1.5'>
            <Label htmlFor='retention-days'>Số ngày (7–730)</Label>
            <Input
              id='retention-days'
              type='number'
              min={7}
              max={730}
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </div>
        )}
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
            disabled={!valid || same || set.isPending}
            onClick={() =>
              attempt(
                () =>
                  set.mutateAsync({ teamId, retention_days: value, reason }),
                value == null
                  ? 'Đã dùng mặc định nền tảng'
                  : `Đã đặt ${value} ngày`,
                onClose
              )
            }
          >
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const CLOUD = '__cloud__'

/** Server on-premise của team (Bước 35): chọn trong danh sách máy chủ (Quản trị › Máy chủ) hoặc cloud CEV. */
export function OnPremDialog({
  teamId,
  teamName,
  current,
  onClose,
}: {
  teamId: string
  teamName: string
  current: string | null | undefined
  onClose: () => void
}) {
  const setServer = useSetTeamServer()
  const { data: servers, isLoading } = useOnpremServers()
  const [serverId, setServerId] = useState(current || CLOUD)
  const [reason, setReason] = useState('')
  const value = serverId === CLOUD ? null : serverId
  const chosen = servers?.find((s) => s.id === value)

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Máy chủ — {teamName}</DialogTitle>
          <DialogDescription>
            Team chạy Suite Shop, Suite WMS, Suite DMS trên máy chủ riêng hoặc
            trên cloud CEV. Đăng nhập, gói dịch vụ và cập nhật ứng dụng luôn ở
            cloud CEV. Đổi máy chủ thì ứng dụng của team chuyển ngay, dữ liệu
            phải đồng bộ lại từ Odoo.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-1.5'>
          <Label>Máy chủ</Label>
          <Select value={serverId} onValueChange={setServerId}>
            <SelectTrigger>
              <SelectValue placeholder={isLoading ? 'Đang tải…' : undefined} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CLOUD}>Cloud CEV</SelectItem>
              {(servers ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {chosen && (
            <p className='text-muted-foreground text-xs break-all'>
              {chosen.api_root}
            </p>
          )}
          {!isLoading && !servers?.length && (
            <p className='text-muted-foreground text-xs'>
              Chưa có máy chủ nào: thêm ở Quản trị › Máy chủ.
            </p>
          )}
        </div>
        <Textarea
          placeholder='Lý do (không bắt buộc)'
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Đóng
          </Button>
          <Button
            disabled={value === (current || null) || setServer.isPending}
            onClick={() =>
              attempt(
                () =>
                  setServer.mutateAsync({ teamId, server_id: value, reason }),
                chosen
                  ? `Team dùng máy chủ ${chosen.name}`
                  : 'Team dùng cloud CEV',
                onClose
              )
            }
          >
            Lưu
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
