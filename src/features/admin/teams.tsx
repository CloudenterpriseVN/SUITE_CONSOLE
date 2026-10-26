import { useState } from 'react'
import { toast } from 'sonner'
import {
  type AdminSubscription,
  useAdminApps,
  useAdminTeam,
  useAdminTeams,
  useSetSubscriptionStatus,
} from '@/hooks/use-admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import {
  formatTime,
  StatusBadge,
  StatusDialog,
  statusLabel,
} from './components/status'
import {
  CreateTeamDialog,
  SubscribeForTeamDialog,
  TransferOwnerDialog,
} from './components/team-dialogs'

// Lọc team có ít nhất một subscription ở trạng thái này.
const FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'registered', label: 'Có chờ duyệt' },
  { value: 'active', label: 'Có đang hoạt động' },
  { value: 'suspended', label: 'Có tạm ngưng' },
]

export default function AdminTeams() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const { data: teams, isLoading, error } = useAdminTeams({ q, status })
  const { data: apps } = useAdminApps()
  const appName = (code?: string) =>
    apps?.find((a) => a.code === code)?.name ?? code ?? '—'

  return (
    <AdminPage
      title='Quản trị nền tảng'
      description='Các team (khách hàng) và subscription. Bấm vào team để đổi trạng thái, ghim OTA, chuyển chủ, đăng ký dịch vụ.'
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
          placeholder='Tìm tên, chủ, MST…'
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button size='sm' onClick={() => setCreating(true)}>
          Tạo team
        </Button>
      </div>
      <Card>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Chủ sở hữu</TableHead>
                <TableHead>Subscriptions</TableHead>
                <TableHead>Ngày tạo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='text-muted-foreground text-center'
                  >
                    Đang tải…
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='text-destructive text-center'
                  >
                    {(error as Error).message}
                  </TableCell>
                </TableRow>
              ) : !teams?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='text-muted-foreground text-center'
                  >
                    Không có team nào.
                  </TableCell>
                </TableRow>
              ) : (
                teams.map((t) => (
                  <TableRow
                    key={t.id}
                    className='cursor-pointer'
                    onClick={() => setSelected(t.id)}
                  >
                    <TableCell>
                      <div className='font-medium'>
                        {t.name ?? t.id}
                        {t.status === 'closed' && (
                          <span className='text-muted-foreground'>
                            {' '}
                            · đã đóng
                          </span>
                        )}
                      </div>
                      {t.full_name && (
                        <div className='text-muted-foreground text-xs'>
                          {t.full_name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{t.owner ?? '—'}</TableCell>
                    <TableCell>
                      <div className='flex flex-wrap gap-1'>
                        {t.subscriptions?.length ? (
                          t.subscriptions.map((s) => (
                            <StatusBadge key={s.id} status={s.status}>
                              <span
                                title={`${appName(s.app_code)}: ${statusLabel(s.status)}`}
                              >
                                {appName(s.app_code)}
                                {s.ota_version && (
                                  <span className='opacity-80'>
                                    {' '}
                                    · {s.ota_version}
                                  </span>
                                )}
                              </span>
                            </StatusBadge>
                          ))
                        ) : (
                          <span className='text-muted-foreground text-sm'>
                            —
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className='whitespace-nowrap'>
                      {formatTime(t.create_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className='text-muted-foreground mt-2 flex flex-wrap gap-3 text-xs'>
        <span>
          <StatusBadge status='active'>Xanh lá</StatusBadge> đang hoạt động
        </span>
        <span>
          <StatusBadge status='registered'>Xanh biển</StatusBadge> chờ duyệt
        </span>
        <span>
          <StatusBadge status='suspended'>Đỏ</StatusBadge> dừng (tạm ngưng / từ
          chối / đã đóng)
        </span>
        <span>
          <StatusBadge status='other'>Xám</StatusBadge> trạng thái khác
        </span>
      </div>
      <TeamSheet
        teamId={selected}
        onClose={() => setSelected(null)}
        appName={appName}
      />
      {creating && (
        <CreateTeamDialog
          onClose={() => setCreating(false)}
          onCreated={setSelected}
        />
      )}
    </AdminPage>
  )
}

function TeamSheet({
  teamId,
  onClose,
  appName,
}: {
  teamId: string | null
  onClose: () => void
  appName: (code?: string) => string
}) {
  const { data: team, isLoading } = useAdminTeam(teamId)
  const setStatus = useSetSubscriptionStatus()
  const [editing, setEditing] = useState<{
    sub: AdminSubscription
    status: string
  } | null>(null)
  const [pinning, setPinning] = useState<AdminSubscription | null>(null)
  const [transferring, setTransferring] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const { data: apps } = useAdminApps()

  const run = async (status: string, reason: string) => {
    if (!editing) return
    try {
      await setStatus.mutateAsync({ id: editing.sub.id, status, reason })
      toast.success(`${appName(editing.sub.app_code)}: ${statusLabel(status)}`)
      setEditing(null)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <Sheet open={!!teamId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle>{team?.name ?? 'Team'}</SheetTitle>
          <SheetDescription>{team?.full_name}</SheetDescription>
        </SheetHeader>
        {isLoading || !team ? (
          <p className='text-muted-foreground px-4'>Đang tải…</p>
        ) : (
          <div className='space-y-6 px-4 pb-6 text-sm'>
            <dl className='grid grid-cols-[8rem_1fr] gap-y-1'>
              <dt className='text-muted-foreground'>Chủ sở hữu</dt>
              <dd>{team.owner ?? '—'}</dd>
              <dt className='text-muted-foreground'>Mã số thuế</dt>
              <dd>{team.tax_id || '—'}</dd>
              <dt className='text-muted-foreground'>Địa chỉ</dt>
              <dd>{team.billing_address || '—'}</dd>
              <dt className='text-muted-foreground'>Ngày tạo</dt>
              <dd>{formatTime(team.create_at)}</dd>
              <dt className='text-muted-foreground'>Mã team</dt>
              <dd className='font-mono text-xs'>{team.id}</dd>
            </dl>
            {team.status === 'closed' && <StatusBadge status='closed' />}
            <div className='flex flex-wrap gap-2'>
              <Button
                size='sm'
                variant='outline'
                onClick={() => setTransferring(true)}
              >
                Chuyển chủ team
              </Button>
              <Button size='sm' onClick={() => setSubscribing(true)}>
                Đăng ký dịch vụ
              </Button>
            </div>

            {team.subscriptions.map((s) => (
              <div key={s.id} className='rounded-lg border p-3'>
                <div className='mb-1 flex items-center gap-2'>
                  <span className='font-medium'>{appName(s.app_code)}</span>
                  <StatusBadge status={s.status} />
                  <span className='text-muted-foreground ml-auto text-xs'>
                    {formatTime(s.create_at)}
                  </span>
                </div>
                {s.status_reason && (
                  <p className='text-muted-foreground mb-1 text-xs'>
                    Lý do: {s.status_reason}
                    {s.status_changed_by ? ` — ${s.status_changed_by}` : ''}
                  </p>
                )}
                <div className='flex flex-wrap items-center gap-2'>
                  {s.status !== 'active' && (
                    <Button
                      size='sm'
                      onClick={() => setEditing({ sub: s, status: 'active' })}
                    >
                      Kích hoạt
                    </Button>
                  )}
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() =>
                      setEditing({
                        sub: s,
                        status:
                          s.status === 'active'
                            ? 'suspended'
                            : (s.status ?? ''),
                      })
                    }
                  >
                    Đổi trạng thái
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => setPinning(s)}
                  >
                    OTA: {s.ota_version ?? 'Mặc định'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {editing && (
          <StatusDialog
            open
            onOpenChange={(o) => !o && setEditing(null)}
            title={`${team?.name ?? ''} — ${appName(editing.sub.app_code)}`}
            currentStatus={editing.sub.status}
            initialStatus={editing.status}
            pending={setStatus.isPending}
            onConfirm={run}
          />
        )}
        {transferring && team && (
          <TransferOwnerDialog
            teamId={team.id}
            teamName={team.name ?? team.id}
            currentOwner={team.owner}
            onClose={() => setTransferring(false)}
          />
        )}
        {subscribing && team && apps && (
          <SubscribeForTeamDialog
            teamId={team.id}
            teamName={team.name ?? team.id}
            apps={apps}
            subscribedAppIds={team.subscriptions.map((s) => s.app_id)}
            onClose={() => setSubscribing(false)}
          />
        )}
        {pinning && (
          <PinOtaDialog
            sub={pinning}
            title={`${team?.name ?? ''} — ${appName(pinning.app_code)}`}
            onClose={() => setPinning(null)}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
