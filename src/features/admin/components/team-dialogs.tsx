import { useState } from 'react'
import { toast } from 'sonner'
import {
  type AdminApp,
  type NewTeam,
  SUGGESTED_STATUSES,
  useCreateServerKey,
  useCreateTeam,
  useRevokeServerKey,
  useServerKeys,
  useSetApiRoot,
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

const isApiRoot = (v: string) => /^https?:\/\/[^\s/?#]+(\/[^\s?#]*)?$/.test(v)

/** Server on-premise của team (Bước 33): địa chỉ API + khoá server dán vào `.env` của server. */
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
  const setRoot = useSetApiRoot()
  const { data: keys, isLoading } = useServerKeys(teamId)
  const createKey = useCreateServerKey()
  const revokeKey = useRevokeServerKey()
  const [root, setRootText] = useState(current ?? '')
  const [reason, setReason] = useState('')
  const [keyName, setKeyName] = useState('')
  const [created, setCreated] = useState<string | null>(null)
  const value = root.trim().replace(/\/+$/, '') || null
  const valid = value == null || isApiRoot(value)
  const same = value === (current ?? null)

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Máy chủ riêng — {teamName}</DialogTitle>
          <DialogDescription>
            Team chạy Suite Shop, Suite WMS, Suite DMS trên máy chủ của mình.
            Đăng nhập, gói dịch vụ và cập nhật ứng dụng vẫn ở cloud CEV. Để
            trống địa chỉ để dùng cloud CEV.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-1.5'>
          <Label htmlFor='api-root'>Địa chỉ máy chủ</Label>
          <Input
            id='api-root'
            placeholder='https://suite.congty.vn'
            value={root}
            onChange={(e) => setRootText(e.target.value)}
          />
          {!valid && (
            <p className='text-destructive text-xs'>
              Cần dạng http(s)://tên-máy[/đường-dẫn], không có ? hoặc #.
            </p>
          )}
        </div>
        <Textarea
          placeholder='Lý do (không bắt buộc)'
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className='flex justify-end'>
          <Button
            size='sm'
            disabled={!valid || same || setRoot.isPending}
            onClick={() =>
              attempt(
                () => setRoot.mutateAsync({ teamId, api_root: value, reason }),
                value ? `Team dùng máy chủ ${value}` : 'Team dùng cloud CEV',
                () => setReason('')
              )
            }
          >
            Lưu địa chỉ
          </Button>
        </div>

        <div className='space-y-2 border-t pt-4'>
          <p className='font-medium'>Khoá máy chủ</p>
          <p className='text-muted-foreground text-xs'>
            Dán vào biến SUITE_SERVER_KEY của máy chủ. Khoá chỉ dùng được cho
            team này và chỉ hiện một lần.
          </p>
          {created && (
            <div className='rounded-md border border-amber-500/50 bg-amber-500/10 p-2'>
              <p className='mb-1 text-xs'>Chép khoá ngay, sẽ không hiện lại:</p>
              <code className='block font-mono text-xs break-all select-all'>
                {created}
              </code>
            </div>
          )}
          {isLoading ? (
            <p className='text-muted-foreground text-xs'>Đang tải…</p>
          ) : (
            (keys ?? []).map((k) => (
              <div
                key={k.id}
                className='flex items-center gap-2 rounded-md border p-2 text-xs'
              >
                <span className='font-medium'>{k.name}</span>
                <code className='text-muted-foreground'>{k.key_prefix}…</code>
                <span className='text-muted-foreground'>
                  {k.status === 'active' ? 'Đang dùng' : 'Đã thu hồi'}
                </span>
                {k.status === 'active' && (
                  <Button
                    size='sm'
                    variant='link'
                    className='text-destructive ml-auto h-auto p-0'
                    disabled={revokeKey.isPending}
                    onClick={() =>
                      attempt(
                        () => revokeKey.mutateAsync({ teamId, keyId: k.id }),
                        `Đã thu hồi khoá ${k.name}`,
                        () => setCreated(null)
                      )
                    }
                  >
                    Thu hồi
                  </Button>
                )}
              </div>
            ))
          )}
          <div className='flex gap-2'>
            <Input
              placeholder='Tên khoá, vd. Máy chủ văn phòng'
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
            />
            <Button
              size='sm'
              variant='outline'
              disabled={!keyName.trim() || createKey.isPending}
              onClick={async () => {
                try {
                  const res = await createKey.mutateAsync({
                    teamId,
                    name: keyName.trim(),
                  })
                  setCreated(res.key ?? null)
                  setKeyName('')
                  toast.success('Đã tạo khoá máy chủ')
                } catch (e) {
                  toast.error((e as Error).message)
                }
              }}
            >
              Tạo khoá
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Đóng
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
