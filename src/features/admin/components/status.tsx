import { useState } from 'react'
import { SUGGESTED_STATUSES } from '@/hooks/use-admin'
import { Badge } from '@/components/ui/badge'
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
import { Textarea } from '@/components/ui/textarea'

// Nhãn cho các giá trị hay dùng; giá trị khác hiện nguyên văn.
const STATUS_LABELS: Record<string, string> = {
  registered: 'Chờ duyệt',
  active: 'Đang hoạt động',
  rejected: 'Từ chối',
  suspended: 'Tạm ngưng',
  trial: 'Dùng thử',
  closed: 'Khách đã đóng',
}

const STATUS_RE = /^[a-z][a-z0-9_]{0,39}$/

export function statusLabel(status?: string | null) {
  if (!status) return '—'
  return STATUS_LABELS[status] ?? status
}

// Màu theo trạng thái: active xanh lá, chờ duyệt xanh biển, dừng (tạm ngưng / từ chối / đã đóng) đỏ,
// giá trị khác xám.
const STOPPED = new Set(['suspended', 'rejected', 'closed'])

export function statusColor(status?: string | null) {
  if (status === 'active') return 'border-transparent bg-green-600 text-white'
  if (status === 'registered')
    return 'border-transparent bg-blue-600 text-white'
  if (status && STOPPED.has(status))
    return 'border-transparent bg-red-600 text-white'
  return 'border-transparent bg-muted text-muted-foreground'
}

export function StatusBadge({
  status,
  children,
}: {
  status?: string | null
  children?: React.ReactNode
}) {
  return (
    <Badge className={statusColor(status)} title={statusLabel(status)}>
      {children ?? statusLabel(status)}
    </Badge>
  )
}

export function formatTime(value?: string) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString('vi-VN')
}

/** Đặt trạng thái subscription: giá trị tự do (gợi ý sẵn), lý do bắt buộc khi khác `active`. */
export function StatusDialog({
  open,
  onOpenChange,
  title,
  currentStatus,
  initialStatus,
  pending,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  currentStatus?: string
  initialStatus: string
  pending?: boolean
  onConfirm: (status: string, reason: string) => void
}) {
  const [status, setStatus] = useState(initialStatus)
  const [reason, setReason] = useState('')
  const value = status.trim()
  const valid = STATUS_RE.test(value)
  const needsReason = value !== 'active'
  const blocked =
    !valid || value === currentStatus || (needsReason && !reason.trim())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            API của ứng dụng chỉ chạy khi trạng thái là <b>active</b>; mọi giá
            trị khác đều chặn (hiệu lực trong tối đa 5 phút). Dữ liệu của team
            được giữ nguyên.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-1.5'>
          <Label htmlFor='status-value'>Trạng thái mới</Label>
          <Input
            id='status-value'
            list='status-suggestions'
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
          <datalist id='status-suggestions'>
            {SUGGESTED_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </datalist>
          <div className='flex flex-wrap gap-1'>
            {SUGGESTED_STATUSES.map((s) => (
              <Button
                key={s}
                type='button'
                size='sm'
                variant={value === s ? 'default' : 'outline'}
                onClick={() => setStatus(s)}
              >
                {statusLabel(s)}
              </Button>
            ))}
          </div>
          {!valid && value && (
            <p className='text-destructive text-xs'>
              Chỉ chữ thường không dấu, số và _ (tối đa 40 ký tự).
            </p>
          )}
        </div>
        <Textarea
          placeholder={
            needsReason ? 'Lý do (bắt buộc)' : 'Ghi chú (không bắt buộc)'
          }
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button
            variant={value === 'active' ? 'default' : 'destructive'}
            disabled={blocked || pending}
            onClick={() => onConfirm(value, reason.trim())}
          >
            Lưu trạng thái
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
