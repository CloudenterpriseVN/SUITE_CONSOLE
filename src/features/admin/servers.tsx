import { useState } from 'react'
import { toast } from 'sonner'
import {
  type OnpremServer,
  useCreateServerKey,
  useDeleteServer,
  useOnpremServers,
  useRevokeServerKey,
  useSaveServer,
  useServerKeys,
} from '@/hooks/use-admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AdminPage } from './components/admin-page'

const isApiRoot = (v: string) => /^https?:\/\/[^\s/?#]+(\/[^\s?#]*)?$/.test(v)

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

/** Máy chủ on-premise (Bước 35): một máy chủ phục vụ mọi team được gán vào (Teams › Máy chủ). */
export default function AdminServers() {
  const { data: servers, isLoading, error } = useOnpremServers()
  const remove = useDeleteServer()
  const [editing, setEditing] = useState<OnpremServer | 'new' | null>(null)
  const [keysOf, setKeysOf] = useState<OnpremServer | null>(null)

  return (
    <AdminPage
      title='Quản trị nền tảng'
      description='Máy chủ riêng của khách chạy Suite Shop, Suite WMS, Suite DMS. Một máy chủ dùng chung được cho nhiều team (vd các công ty trong tập đoàn); chọn máy chủ cho team ở tab Teams.'
    >
      <div className='mb-3 flex justify-end'>
        <Button size='sm' onClick={() => setEditing('new')}>
          Thêm máy chủ
        </Button>
      </div>
      <Card>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead>Team</TableHead>
                <TableHead />
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
              ) : !servers?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='text-muted-foreground text-center'
                  >
                    Chưa có máy chủ nào. Mọi team đang dùng cloud CEV.
                  </TableCell>
                </TableRow>
              ) : (
                servers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className='font-medium'>{s.name}</TableCell>
                    <TableCell className='break-all'>{s.api_root}</TableCell>
                    <TableCell>
                      {s.teams?.length
                        ? s.teams.map((t) => t.name || t.id).join(', ')
                        : '—'}
                    </TableCell>
                    <TableCell className='text-right whitespace-nowrap'>
                      <Button
                        size='sm'
                        variant='link'
                        onClick={() => setKeysOf(s)}
                      >
                        Khoá
                      </Button>
                      <Button
                        size='sm'
                        variant='link'
                        onClick={() => setEditing(s)}
                      >
                        Sửa
                      </Button>
                      <Button
                        size='sm'
                        variant='link'
                        className='text-destructive'
                        disabled={!!s.teams?.length || remove.isPending}
                        title={
                          s.teams?.length
                            ? 'Chuyển các team sang máy chủ khác hoặc cloud CEV trước'
                            : undefined
                        }
                        onClick={() =>
                          window.confirm(
                            `Xoá máy chủ ${s.name}? Mọi khoá của nó bị thu hồi.`
                          ) &&
                          attempt(
                            () => remove.mutateAsync(s.id),
                            `Đã xoá ${s.name}`,
                            () => {}
                          )
                        }
                      >
                        Xoá
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
        <ServerDialog
          server={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {keysOf && (
        <ServerKeysDialog server={keysOf} onClose={() => setKeysOf(null)} />
      )}
    </AdminPage>
  )
}

function ServerDialog({
  server,
  onClose,
}: {
  server: OnpremServer | null
  onClose: () => void
}) {
  const save = useSaveServer()
  const [name, setName] = useState(server?.name ?? '')
  const [root, setRoot] = useState(server?.api_root ?? '')
  const value = root.trim().replace(/\/+$/, '')
  const valid = isApiRoot(value)
  const moves = !!server?.teams?.length && value !== server.api_root

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            {server ? `Sửa ${server.name}` : 'Thêm máy chủ'}
          </DialogTitle>
          <DialogDescription>
            Địa chỉ là gốc chung của các app: ứng dụng gọi
            {' <địa chỉ>/pos, /wms, /dms'}. Odoo dùng cùng địa chỉ này làm API
            root.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-1.5'>
          <Label htmlFor='server-name'>Tên</Label>
          <Input
            id='server-name'
            placeholder='Máy chủ tập đoàn ABC'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className='grid gap-1.5'>
          <Label htmlFor='server-root'>Địa chỉ</Label>
          <Input
            id='server-root'
            placeholder='https://suite.congty.vn'
            value={root}
            onChange={(e) => setRoot(e.target.value)}
          />
          {!!value && !valid && (
            <p className='text-destructive text-xs'>
              Cần dạng http(s)://tên-máy[/đường-dẫn], không có ? hoặc #.
            </p>
          )}
          {moves && (
            <p className='text-xs text-amber-600'>
              Ứng dụng của {server?.teams?.length} team sẽ chuyển ngay sang địa
              chỉ mới.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Đóng
          </Button>
          <Button
            disabled={!name.trim() || !valid || save.isPending}
            onClick={() =>
              attempt(
                () =>
                  save.mutateAsync({
                    id: server?.id,
                    name: name.trim(),
                    api_root: value,
                  }),
                server ? 'Đã lưu máy chủ' : 'Đã thêm máy chủ',
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

function ServerKeysDialog({
  server,
  onClose,
}: {
  server: OnpremServer
  onClose: () => void
}) {
  const { data: keys, isLoading } = useServerKeys(server.id)
  const createKey = useCreateServerKey()
  const revokeKey = useRevokeServerKey()
  const [keyName, setKeyName] = useState('')
  const [created, setCreated] = useState<string | null>(null)

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Khoá — {server.name}</DialogTitle>
          <DialogDescription>
            Dán vào biến SUITE_SERVER_KEY của máy chủ. Khoá dùng được cho mọi
            team đang chọn máy chủ này và chỉ hiện một lần. Đổi khoá: tạo khoá
            mới, thay trên máy chủ, rồi thu hồi khoá cũ.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-2'>
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
          ) : !keys?.length ? (
            <p className='text-muted-foreground text-xs'>Chưa có khoá.</p>
          ) : (
            keys.map((k) => (
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
                        () =>
                          revokeKey.mutateAsync({
                            serverId: server.id,
                            keyId: k.id,
                          }),
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
              placeholder='Tên khoá, vd. Khoá 2026'
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
                    serverId: server.id,
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
