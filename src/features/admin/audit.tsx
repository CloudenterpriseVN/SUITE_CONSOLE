import { useAdminAudit } from '@/hooks/use-admin'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AdminPage } from './components/admin-page'
import { formatTime, statusLabel } from './components/status'

const ACTION_LABELS: Record<string, string> = {
  'subscription.status': 'Đổi trạng thái subscription',
  'subscription.create': 'Đăng ký dịch vụ hộ',
  'subscription.ota': 'Ghim phiên bản OTA',
  'team.create': 'Tạo team',
  'team.transfer_owner': 'Chuyển chủ team',
  'app.update': 'Sửa ứng dụng',
  'app.default_ota': 'Đặt OTA mặc định',
  'app_version.create': 'Thêm phiên bản OTA',
  'app_version.delete': 'Xoá phiên bản OTA',
}

const show = (v: unknown) =>
  v === null || v === undefined
    ? '—'
    : typeof v === 'string'
      ? statusLabel(v)
      : JSON.stringify(v)

export default function AdminAudit() {
  const { data: rows, isLoading, error } = useAdminAudit()

  return (
    <AdminPage
      title='Quản trị nền tảng'
      description='Nhật ký thao tác của quản trị viên (200 mục gần nhất).'
    >
      <Card>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Người làm</TableHead>
                <TableHead>Thao tác</TableHead>
                <TableHead>Đối tượng</TableHead>
                <TableHead>Thay đổi</TableHead>
                <TableHead>Lý do</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className='text-muted-foreground text-center'
                  >
                    Đang tải…
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className='text-destructive text-center'
                  >
                    {(error as Error).message}
                  </TableCell>
                </TableRow>
              ) : !rows?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className='text-muted-foreground text-center'
                  >
                    Chưa có thao tác nào.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className='whitespace-nowrap'>
                      {formatTime(r.create_at)}
                    </TableCell>
                    <TableCell>{r.actor}</TableCell>
                    <TableCell>
                      {ACTION_LABELS[r.action ?? ''] ?? r.action}
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {r.target_id}
                    </TableCell>
                    <TableCell
                      className='max-w-72 truncate text-xs'
                      title={`${show(r.before)} → ${show(r.after)}`}
                    >
                      {show(r.before)} → {show(r.after)}
                    </TableCell>
                    <TableCell>{r.reason || '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminPage>
  )
}
