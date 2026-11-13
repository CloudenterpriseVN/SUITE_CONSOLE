// Chi phí hạ tầng theo team — dữ liệu pilot để chốt chính sách giá (SERVERLESS/DevOps/billing/README.md).
import { useEffect, useMemo, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import {
  type CostReport,
  type TeamCost,
  useCostMonths,
  useCostReport,
  useRebuildCostReport,
} from '@/hooks/use-infra-cost'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

type OverheadMode = 'equal' | 'usage'
type UnitKey = 'team' | 'active_devices' | 'active_users' | 'transactions'

const UNITS: { key: UnitKey; label: string; per: string }[] = [
  { key: 'team', label: 'Team / tháng', per: 'team' },
  { key: 'active_devices', label: 'Thiết bị hoạt động', per: 'thiết bị' },
  { key: 'active_users', label: 'User hoạt động', per: 'user' },
  { key: 'transactions', label: 'Giao dịch', per: 'giao dịch' },
]

const DRIVER_LABELS: Record<string, string> = {
  compute: 'Máy chủ (Functions)',
  egress: 'Băng thông ra',
  fs_read: 'Firestore đọc',
  fs_write: 'Firestore ghi',
  fs_delete: 'Firestore xoá',
  fs_storage: 'Firestore lưu trữ',
  gcs: 'Lưu file',
  tasks: 'Hàng đợi',
  overhead: 'Khác (dùng chung)',
}

const thisMonth = () => {
  const d = new Date()
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
const monthLabel = (m: string) => `${m.slice(4)}/${m.slice(0, 4)}`
const usd = (v: number | undefined, digits = 2) =>
  v === undefined || Number.isNaN(v)
    ? '—'
    : `$${v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: Math.max(digits, 4) })}`
const pct = (v: number | undefined) =>
  v === undefined || v === null ? '—' : `${(v * 100).toFixed(1)}%`
const num = (v: number | undefined) => (v ? v.toLocaleString('vi-VN') : '0')

function unitCount(t: TeamCost, key: UnitKey) {
  return key === 'team' ? 1 : (t.units[key] ?? 0)
}

function totalCost(t: TeamCost, mode: OverheadMode) {
  return t.gross + (mode === 'equal' ? t.overhead_equal : t.overhead_usage)
}

/** Chi phí / đơn vị giữa các team: trung bình + hệ số biến thiên (CV). CV thấp = đơn vị phản ánh chi phí tốt. */
function unitStats(teams: TeamCost[], key: UnitKey, mode: OverheadMode) {
  const values = teams
    .filter((t) => unitCount(t, key) > 0)
    .map((t) => totalCost(t, mode) / unitCount(t, key))
  if (!values.length) return { n: 0, mean: undefined, cv: undefined }
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const sd = Math.sqrt(
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
  )
  return { n: values.length, mean, cv: values.length > 1 && mean ? sd / mean : undefined }
}

function exportCsv(report: CostReport, mode: OverheadMode) {
  const head = [
    'month', 'team_id', 'team_name', 'direct_gross_usd', 'direct_net_usd', 'overhead_usd', 'total_gross_usd',
    'requests', 'active_users', 'active_devices', 'transactions', ...Object.keys(DRIVER_LABELS).map((d) => `driver_${d}`),
  ]
  const rows = report.teams.map((t) => [
    report.month, t.team_id, `"${(t.team_name ?? '').replace(/"/g, '""')}"`, t.gross, t.net,
    mode === 'equal' ? t.overhead_equal : t.overhead_usage, totalCost(t, mode),
    t.units.requests ?? 0, t.units.active_users ?? 0, t.units.active_devices ?? 0, t.units.transactions ?? 0,
    ...Object.keys(DRIVER_LABELS).map((d) => t.drivers[d] ?? 0),
  ])
  const csv = [head, ...rows].map((r) => r.join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = `infra-cost-${report.month}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function AdminInfraCost() {
  const { data: months } = useCostMonths()
  const [month, setMonth] = useState<string>()
  const [mode, setMode] = useState<OverheadMode>('equal')
  const [rate, setRate] = useState(26000)
  const [prices, setPrices] = useState<Record<UnitKey, number>>({
    team: 0, active_devices: 0, active_users: 0, transactions: 0,
  })
  const rebuild = useRebuildCostReport()

  useEffect(() => {
    if (!month && months) setMonth(months[0] ?? thisMonth())
  }, [month, months])

  const { data: report, isLoading, error } = useCostReport(month)
  const teams = useMemo(() => report?.teams ?? [], [report])
  const stats = useMemo(
    () => UNITS.map((u) => ({ ...u, ...unitStats(teams, u.key, mode) })),
    [teams, mode]
  )
  const bestUnit = stats
    .filter((s) => s.cv !== undefined)
    .sort((a, b) => (a.cv ?? 0) - (b.cv ?? 0))[0]
  const recon = report?.reconciliation ?? {}
  const vnd = (v: number) => `${Math.round(v * rate).toLocaleString('vi-VN')} ₫`

  const onBuild = () => {
    if (!month) return
    rebuild.mutate(month, {
      onSuccess: () => toast.success(`Đã dựng lại báo cáo ${monthLabel(month)}`),
      onError: (e) => toast.error((e as Error).message),
    })
  }

  return (
    <AdminPage
      title='Quản trị nền tảng'
      description='Chi phí hạ tầng Google Cloud chia theo team. Gross = trước credit/free tier (dùng để định giá), net = thực trả. Đơn vị USD.'
    >
      <div className='mb-4 flex flex-wrap items-end gap-3'>
        <div className='grid gap-1'>
          <Label>Tháng</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className='w-36'>
              <SelectValue placeholder='Chọn tháng' />
            </SelectTrigger>
            <SelectContent>
              {Array.from(new Set([thisMonth(), ...(months ?? [])])).map((m) => (
                <SelectItem key={m} value={m}>
                  {monthLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='grid gap-1'>
          <Label>Chia chi phí dùng chung</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as OverheadMode)}>
            <SelectTrigger className='w-48'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='equal'>Đều cho mỗi team</SelectItem>
              <SelectItem value='usage'>Theo tỷ lệ sử dụng</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='grid gap-1'>
          <Label>Tỷ giá (₫/USD)</Label>
          <Input
            type='number'
            className='w-32'
            value={rate}
            onChange={(e) => setRate(Number(e.target.value) || 0)}
          />
        </div>
        <div className='ml-auto flex gap-2'>
          <Button variant='outline' onClick={onBuild} disabled={!month || rebuild.isPending}>
            <RefreshCw className={rebuild.isPending ? 'animate-spin' : ''} />
            Dựng lại
          </Button>
          <Button
            variant='outline'
            onClick={() => report && exportCsv(report, mode)}
            disabled={!report}
          >
            <Download />
            CSV
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className='text-muted-foreground'>Đang tải…</p>
      ) : error || !report ? (
        <Card>
          <CardContent className='text-muted-foreground py-10 text-center text-sm'>
            Chưa có báo cáo cho tháng này. Báo cáo tự dựng mỗi ngày khi đã bật Billing export và
            log sink (DevOps/billing/README.md); bấm “Dựng lại” để dựng ngay.
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4'>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <Kpi label='Tổng hóa đơn (gross)' value={usd(recon.gross_total)} sub={`Thực trả ${usd(recon.net_total)}`} />
            <Kpi label='Gán được cho team' value={pct(recon.attributed_ratio)} sub={`Dùng chung ${usd(report.overhead.gross)}`} />
            <Kpi
              label='Firestore đọc đo được'
              value={pct(recon.fs_read_coverage)}
              sub='So với số đọc Google tính tiền'
            />
            <Kpi label='Team có chi phí' value={String(teams.length)} sub={`Dựng lúc ${new Date(report.built_at).toLocaleString('vi-VN')}`} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Chi phí theo team</CardTitle>
            </CardHeader>
            <CardContent className='overflow-x-auto p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead className='text-right'>Trực tiếp</TableHead>
                    <TableHead className='text-right'>Dùng chung</TableHead>
                    <TableHead className='text-right'>Tổng</TableHead>
                    <TableHead>Theo app</TableHead>
                    <TableHead className='text-right'>User</TableHead>
                    <TableHead className='text-right'>Thiết bị</TableHead>
                    <TableHead className='text-right'>Giao dịch</TableHead>
                    <TableHead className='text-right'>/ user</TableHead>
                    <TableHead className='text-right'>/ giao dịch</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((t) => {
                    const total = totalCost(t, mode)
                    return (
                      <TableRow key={t.team_id}>
                        <TableCell>
                          <div className='font-medium'>{t.team_name}</div>
                          <div className='text-muted-foreground font-mono text-xs'>{t.team_id}</div>
                        </TableCell>
                        <TableCell className='text-right tabular-nums'>{usd(t.gross)}</TableCell>
                        <TableCell className='text-right tabular-nums'>
                          {usd(mode === 'equal' ? t.overhead_equal : t.overhead_usage)}
                        </TableCell>
                        <TableCell className='text-right font-medium tabular-nums' title={vnd(total)}>
                          {usd(total)}
                        </TableCell>
                        <TableCell className='text-xs'>
                          {Object.entries(t.apps)
                            .sort((a, b) => b[1].gross - a[1].gross)
                            .map(([app, c]) => `${app} ${usd(c.gross)}`)
                            .join(' · ')}
                        </TableCell>
                        <TableCell className='text-right tabular-nums'>{num(t.units.active_users)}</TableCell>
                        <TableCell className='text-right tabular-nums'>{num(t.units.active_devices)}</TableCell>
                        <TableCell className='text-right tabular-nums'>{num(t.units.transactions)}</TableCell>
                        <TableCell className='text-right tabular-nums'>
                          {t.units.active_users ? usd(total / t.units.active_users, 4) : '—'}
                        </TableCell>
                        <TableCell className='text-right tabular-nums'>
                          {t.units.transactions ? usd(total / t.units.transactions, 4) : '—'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className='grid gap-4 lg:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Đơn vị tính giá nào bám sát chi phí?</CardTitle>
              </CardHeader>
              <CardContent className='p-0'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Đơn vị</TableHead>
                      <TableHead className='text-right'>Chi phí TB / đơn vị</TableHead>
                      <TableHead className='text-right'>Độ lệch giữa team (CV)</TableHead>
                      <TableHead className='text-right'>Số team</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.map((s) => (
                      <TableRow key={s.key}>
                        <TableCell>
                          {s.label}
                          {bestUnit?.key === s.key && (
                            <span className='text-primary ml-2 text-xs font-medium'>ổn định nhất</span>
                          )}
                        </TableCell>
                        <TableCell className='text-right tabular-nums' title={s.mean !== undefined ? vnd(s.mean) : ''}>
                          {usd(s.mean, 4)}
                        </TableCell>
                        <TableCell className='text-right tabular-nums'>{pct(s.cv)}</TableCell>
                        <TableCell className='text-right tabular-nums'>{s.n}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className='text-muted-foreground px-4 py-3 text-xs'>
                  CV thấp: các team tốn gần như nhau trên mỗi đơn vị, nên tính giá theo đơn vị đó thì ít
                  team bị lỗ. Cần ít nhất 2 team có dữ liệu.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Thử giá (USD)</CardTitle>
              </CardHeader>
              <CardContent className='grid gap-3'>
                <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
                  {UNITS.map((u) => (
                    <div key={u.key} className='grid gap-1'>
                      <Label className='text-xs'>/ {u.per}</Label>
                      <Input
                        type='number'
                        step='0.01'
                        min={0}
                        value={prices[u.key] || ''}
                        placeholder='0'
                        onChange={(e) =>
                          setPrices((p) => ({ ...p, [u.key]: Number(e.target.value) || 0 }))
                        }
                      />
                    </div>
                  ))}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead className='text-right'>Doanh thu</TableHead>
                      <TableHead className='text-right'>Chi phí</TableHead>
                      <TableHead className='text-right'>Biên</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map((t) => {
                      const revenue = UNITS.reduce((s, u) => s + prices[u.key] * unitCount(t, u.key), 0)
                      const cost = totalCost(t, mode)
                      const margin = revenue - cost
                      return (
                        <TableRow key={t.team_id}>
                          <TableCell>{t.team_name}</TableCell>
                          <TableCell className='text-right tabular-nums'>{usd(revenue)}</TableCell>
                          <TableCell className='text-right tabular-nums'>{usd(cost)}</TableCell>
                          <TableCell
                            className={`text-right tabular-nums ${margin < 0 ? 'text-destructive' : ''}`}
                            title={vnd(margin)}
                          >
                            {usd(margin)} {revenue > 0 && `(${pct(margin / revenue)})`}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Cơ cấu chi phí (gross)</CardTitle>
            </CardHeader>
            <CardContent className='overflow-x-auto p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loại</TableHead>
                    {teams.map((t) => (
                      <TableHead key={t.team_id} className='text-right'>{t.team_name}</TableHead>
                    ))}
                    <TableHead className='text-right'>Dùng chung</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(DRIVER_LABELS).map(([d, label]) => (
                    <TableRow key={d}>
                      <TableCell>{label}</TableCell>
                      {teams.map((t) => (
                        <TableCell key={t.team_id} className='text-right tabular-nums'>
                          {t.drivers[d] ? usd(t.drivers[d], 4) : '—'}
                        </TableCell>
                      ))}
                      <TableCell className='text-right tabular-nums'>
                        {report.overhead.drivers[d] ? usd(report.overhead.drivers[d], 4) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminPage>
  )
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className='grid gap-1 py-4'>
        <span className='text-muted-foreground text-xs'>{label}</span>
        <span className='text-2xl font-semibold tabular-nums'>{value}</span>
        {sub && <span className='text-muted-foreground text-xs'>{sub}</span>}
      </CardContent>
    </Card>
  )
}
