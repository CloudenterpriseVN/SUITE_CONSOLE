import { useState } from 'react'
import { toast } from 'sonner'
import {
  type AdminSubscription,
  useAdminApps,
  useAdminSubscriptions,
  useSetSubscriptionStatus,
} from '@/hooks/use-admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AdminPage } from './components/admin-page'
import { PinOtaDialog } from './components/pin-ota-dialog'
import { formatTime, StatusBadge, StatusDialog } from './components/status'

const FILTERS = [
  { value: 'registered', label: 'Chờ duyệt' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'suspended', label: 'Tạm ngưng' },
  { value: 'rejected', label: 'Từ chối' },
  { value: 'trial', label: 'Dùng thử' },
  { value: 'closed', label: 'Khách đã đóng' },
  { value: '', label: 'Tất cả' },
]

export default function AdminSubscriptions() {
  const [status, setStatus] = useState('registered')
  const [q, setQ] = useState('')
  const { data: rows, isLoading, error } = useAdminSubscriptions({ status, q })
  const { data: apps } = useAdminApps()
  const mutation = useSetSubscriptionStatus()
  const [editing, setEditing] = useState<{
    sub: AdminSubscription
    status: string
  } | null>(null)
  const [pinning, setPinning] = useState<AdminSubscription | null>(null)

  const appName = (code?: string) =>
    apps?.find((a) => a.code === code)?.name ?? code ?? '—'
  const teamName = (sub: AdminSubscription) =>
    sub.team?.name ?? sub.team_name ?? sub.team_id

  const run = async (status: string, reason: string) => {
    if (!editing) return
    try {
      await mutation.mutateAsync({ id: editing.sub.id, status, reason })
      toast.success(
        `${teamName(editing.sub)} — ${appName(editing.sub.app_code)}: ${status}`
      )
      setEditing(null)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <AdminPage
      title='Quản trị nền tảng'
      description='Đặt trạng thái đăng ký dịch vụ của các team. Chỉ subscription active mới dùng được ứng dụng.'
    >
      <div className='mb-4 flex flex-wrap items-center gap-2'>
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            size='sm'
            variant={status === f.value ? 'default' : 'outline'}
            onClick={() => setStatus(f.value)}
          >
            {f.label}
          </Button>
        ))}
        <Input
          className='ml-auto w-full sm:w-64'
          placeholder='Tìm team, email…'
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Ứng dụng</TableHead>
                <TableHead>Đăng ký bởi</TableHead>
                <TableHead>Ngày đăng ký</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>OTA</TableHead>
                <TableHead className='text-right'>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className='text-muted-foreground text-center'
                  >
                    Đang tải…
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className='text-destructive text-center'
                  >
                    {(error as Error).message}
                  </TableCell>
                </TableRow>
              ) : !rows?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className='text-muted-foreground text-center'
                  >
                    Không có subscription nào.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div className='font-medium'>
                        {sub.team?.name ?? sub.team_name ?? sub.team_id}
                      </div>
                      <div className='text-muted-foreground text-xs'>
                        {sub.team?.owner}
                        {sub.team?.status === 'suspended' &&
                          ' · team đang bị khoá'}
                      </div>
                    </TableCell>
                    <TableCell>{appName(sub.app_code)}</TableCell>
                    <TableCell>{sub.registered_by ?? '—'}</TableCell>
                    <TableCell>{formatTime(sub.create_at)}</TableCell>
                    <TableCell>
                      <StatusBadge status={sub.status} />
                      {sub.status_reason && (
                        <div
                          className='text-muted-foreground mt-1 max-w-48 truncate text-xs'
                          title={sub.status_reason}
                        >
                          {sub.status_reason}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size='sm'
                        variant='ghost'
                        className='h-7 px-2 font-mono'
                        onClick={() => setPinning(sub)}
                      >
                        {sub.ota_version ?? (
                          <span className='text-muted-foreground font-sans'>
                            Mặc định
                          </span>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className='space-x-2 text-right whitespace-nowrap'>
                      {sub.status !== 'active' && (
                        <Button
                          size='sm'
                          onClick={() => setEditing({ sub, status: 'active' })}
                        >
                          Kích hoạt
                        </Button>
                      )}
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() =>
                          setEditing({
                            sub,
                            status:
                              sub.status === 'active'
                                ? 'suspended'
                                : (sub.status ?? ''),
                          })
                        }
                      >
                        Đổi trạng thái
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editing && (
        <StatusDialog
          open
          onOpenChange={(o) => !o && setEditing(null)}
          title={`${teamName(editing.sub)} — ${appName(editing.sub.app_code)}`}
          currentStatus={editing.sub.status}
          initialStatus={editing.status}
          pending={mutation.isPending}
          onConfirm={run}
        />
      )}
      {pinning && (
        <PinOtaDialog
          sub={pinning}
          title={`${teamName(pinning)} — ${appName(pinning.app_code)}`}
          onClose={() => setPinning(null)}
        />
      )}
    </AdminPage>
  )
}
