import { useState } from 'react'
import { toast } from 'sonner'
import {
  type AdminApp,
  type NewAppVersion,
  useAdminApps,
  useAppVersions,
  useCreateAppVersion,
  useDeleteAppVersion,
  useSetDefaultAppVersion,
  useUpdateApp,
} from '@/hooks/use-admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AdminPage } from './components/admin-page'
import { formatTime } from './components/status'

export default function AdminApps() {
  const [appId, setAppId] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingApp, setEditingApp] = useState<AdminApp | null>(null)
  const { data: apps } = useAdminApps()
  const { data: rows, isLoading, error } = useAppVersions(appId || undefined)
  const setDefault = useSetDefaultAppVersion()
  const create = useCreateAppVersion()
  const remove = useDeleteAppVersion()
  const selectedApp = apps?.find((a) => a.id === appId)

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn()
      toast.success(ok)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <AdminPage
      title='Quản trị nền tảng'
      description='Các phiên bản OTA của từng ứng dụng. Phiên bản mặc định dùng cho mọi subscription không ghim phiên bản riêng.'
    >
      <div className='mb-4 flex flex-wrap items-center gap-2'>
        <Button
          size='sm'
          variant={appId === '' ? 'default' : 'outline'}
          onClick={() => setAppId('')}
        >
          Tất cả
        </Button>
        {apps?.map((a) => (
          <Button
            key={a.id}
            size='sm'
            variant={appId === a.id ? 'default' : 'outline'}
            onClick={() => setAppId(a.id)}
          >
            {a.name ?? a.code}
          </Button>
        ))}
        <div className='ml-auto flex gap-2'>
          {selectedApp && (
            <Button
              size='sm'
              variant='outline'
              onClick={() => setEditingApp(selectedApp)}
            >
              Thông tin app
            </Button>
          )}
          <Button size='sm' onClick={() => setAdding(true)}>
            Thêm phiên bản
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ứng dụng</TableHead>
                <TableHead>Phiên bản</TableHead>
                <TableHead>Gói OTA</TableHead>
                <TableHead>Ghi chú</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Đang ghim</TableHead>
                <TableHead className='text-right'>Mặc định</TableHead>
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
                    Chưa có phiên bản nào.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((v) => (
                  <TableRow key={v.id ?? `${v.app_id}-default`}>
                    <TableCell>
                      <div className='font-medium'>
                        {v.app_name ?? v.app_code}
                      </div>
                      <div className='text-muted-foreground font-mono text-xs'>
                        {v.app_code}
                      </div>
                    </TableCell>
                    <TableCell className='font-mono'>{v.version}</TableCell>
                    <TableCell className='max-w-64'>
                      {v.bundle_url ? (
                        <a
                          href={v.bundle_url}
                          target='_blank'
                          rel='noreferrer'
                          className='block truncate text-xs underline'
                          title={v.bundle_url}
                        >
                          {v.bundle_url}
                        </a>
                      ) : (
                        <span className='text-muted-foreground text-xs'>—</span>
                      )}
                      <div
                        className='text-muted-foreground truncate font-mono text-xs'
                        title={v.checksum}
                      >
                        {v.checksum ? `${v.checksum.slice(0, 19)}…` : ''}
                        {v.remote_url ? ' · fallback remote URL' : ''}
                      </div>
                    </TableCell>
                    <TableCell
                      className='max-w-48 truncate text-sm'
                      title={v.notes}
                    >
                      {v.saved ? (
                        v.notes || '—'
                      ) : (
                        <span className='text-muted-foreground'>
                          Chưa lưu thành dòng
                        </span>
                      )}
                    </TableCell>
                    <TableCell className='whitespace-nowrap'>
                      {formatTime(v.create_at)}
                    </TableCell>
                    <TableCell>{v.pinned_count || '—'}</TableCell>
                    <TableCell className='space-x-2 text-right whitespace-nowrap'>
                      {!v.saved &&
                        v.bundle_url &&
                        v.checksum?.startsWith('sha256:') && (
                          <Button
                            size='sm'
                            variant='outline'
                            disabled={create.isPending}
                            onClick={() =>
                              act(
                                () =>
                                  create.mutateAsync({
                                    app_id: v.app_id,
                                    version: v.version,
                                    bundle_url: v.bundle_url!,
                                    checksum: v.checksum!,
                                    remote_url: !!v.remote_url,
                                    notes: 'Lưu từ mặc định hiện tại',
                                  }),
                                `Đã lưu ${v.app_name} ${v.version}`
                              )
                            }
                          >
                            Lưu thành dòng
                          </Button>
                        )}
                      {v.is_default ? (
                        <Badge>Mặc định</Badge>
                      ) : (
                        <>
                          <Button
                            size='sm'
                            disabled={setDefault.isPending}
                            onClick={() =>
                              act(
                                () => setDefault.mutateAsync(v.id!),
                                `${v.app_name}: mặc định ${v.version}`
                              )
                            }
                          >
                            Đặt mặc định
                          </Button>
                          {!v.pinned_count && (
                            <Button
                              size='sm'
                              variant='outline'
                              disabled={remove.isPending}
                              onClick={() =>
                                confirm(
                                  `Xoá phiên bản ${v.version} của ${v.app_name}?`
                                ) &&
                                act(
                                  () => remove.mutateAsync(v.id!),
                                  `Đã xoá ${v.version}`
                                )
                              }
                            >
                              Xoá
                            </Button>
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {adding && apps && (
        <NewVersionDialog
          apps={apps}
          defaultAppId={appId}
          onClose={() => setAdding(false)}
        />
      )}
      {editingApp && (
        <AppInfoDialog app={editingApp} onClose={() => setEditingApp(null)} />
      )}
    </AdminPage>
  )
}

function NewVersionDialog({
  apps,
  defaultAppId,
  onClose,
}: {
  apps: AdminApp[]
  defaultAppId: string
  onClose: () => void
}) {
  const create = useCreateAppVersion()
  const [form, setForm] = useState<NewAppVersion>({
    app_id: defaultAppId,
    version: '',
    bundle_url: '',
    checksum: '',
    remote_url: false,
    notes: '',
    set_default: false,
  })
  const set =
    <K extends keyof NewAppVersion>(k: K) =>
    (v: NewAppVersion[K]) =>
      setForm((f) => ({ ...f, [k]: v }))
  const valid =
    form.app_id &&
    form.version.trim() &&
    form.bundle_url.trim() &&
    form.checksum.trim().startsWith('sha256:')

  const save = async () => {
    try {
      await create.mutateAsync(form)
      toast.success(`Đã thêm phiên bản ${form.version}`)
      onClose()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const text = (
    label: string,
    key: 'version' | 'bundle_url' | 'checksum' | 'notes',
    placeholder = ''
  ) => (
    <div className='grid gap-1.5'>
      <Label htmlFor={`nv-${key}`}>{label}</Label>
      <Input
        id={`nv-${key}`}
        value={form[key] ?? ''}
        placeholder={placeholder}
        onChange={(e) => set(key)(e.target.value)}
      />
    </div>
  )

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm phiên bản OTA</DialogTitle>
          <DialogDescription>
            Gói zip đã tải lên nơi lưu trữ (vd. Firebase Storage) và checksum
            sha256 của nó.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-3'>
          <div className='grid gap-1.5'>
            <Label>Ứng dụng</Label>
            <Select value={form.app_id} onValueChange={set('app_id')}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Chọn ứng dụng' />
              </SelectTrigger>
              <SelectContent>
                {apps.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name ?? a.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {text('Phiên bản', 'version', '1.1.4')}
          {text('URL gói OTA', 'bundle_url', 'https://…/pos-ota.zip')}
          {text('Checksum', 'checksum', 'sha256:…')}
          {text('Ghi chú', 'notes')}
          <label className='flex items-center gap-2 text-sm'>
            <Checkbox
              checked={!!form.remote_url}
              onCheckedChange={(c) => set('remote_url')(c === true)}
            />
            Chưa tải gói thì mở Remote URL của app
          </label>
          <label className='flex items-center gap-2 text-sm'>
            <Checkbox
              checked={!!form.set_default}
              onCheckedChange={(c) => set('set_default')(c === true)}
            />
            Đặt làm phiên bản mặc định
          </label>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Huỷ
          </Button>
          <Button disabled={!valid || create.isPending} onClick={save}>
            Thêm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AppInfoDialog({
  app,
  onClose,
}: {
  app: AdminApp
  onClose: () => void
}) {
  const update = useUpdateApp()
  const [name, setName] = useState(app.name ?? '')
  const [loadType, setLoadType] = useState<string>(app.load_type ?? '')
  const [remoteUrl, setRemoteUrl] = useState(app.remote_url ?? '')

  const save = async () => {
    const values: Partial<AdminApp> = { name, remote_url: remoteUrl }
    if (loadType) values.load_type = loadType as AdminApp['load_type']
    try {
      await update.mutateAsync({ id: app.id, values })
      toast.success(`Đã lưu ${name || app.code}`)
      onClose()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{app.name ?? app.code}</DialogTitle>
          <DialogDescription className='font-mono text-xs'>
            {app.code} · {app.id}
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-3'>
          <div className='grid gap-1.5'>
            <Label htmlFor='app-name'>Tên hiển thị</Label>
            <Input
              id='app-name'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className='grid gap-1.5'>
            <Label>Cách tải</Label>
            <Select value={loadType} onValueChange={setLoadType}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Chưa đặt' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ota'>OTA (gói zip)</SelectItem>
                <SelectItem value='remote_url'>Remote URL (WebView)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='grid gap-1.5'>
            <Label htmlFor='app-remote'>Remote URL</Label>
            <Input
              id='app-remote'
              value={remoteUrl}
              placeholder='https://…'
              onChange={(e) => setRemoteUrl(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Huỷ
          </Button>
          <Button disabled={update.isPending} onClick={save}>
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
