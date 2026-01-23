import { useState, useMemo } from 'react'
import { useAllInvoices } from '@/hooks/use-app-subscription'
import { useTeams } from '@/hooks/use-team'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Download, Eye, CheckCircle2, Clock, XCircle, AlertTriangle, Filter } from 'lucide-react'
import { toast } from 'sonner'

export function InvoiceTable() {
  const { data: invoices } = useAllInvoices()
  const { data: teams } = useTeams()

  // Filters
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [appFilter, setAppFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Get unique apps from invoices
  const uniqueApps = useMemo(() => {
    if (!invoices) return []
    const apps = new Map<string, string>()
    invoices.forEach(inv => {
      if (!apps.has(inv.appCode)) {
        apps.set(inv.appCode, inv.appName)
      }
    })
    return Array.from(apps.entries()).map(([code, name]) => ({ code, name }))
  }, [invoices])

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    if (!invoices) return []
    return invoices.filter(inv => {
      // Team filter
      if (teamFilter !== 'all' && inv.teamId !== teamFilter) return false
      // App filter
      if (appFilter !== 'all' && inv.appCode !== appFilter) return false
      // Status filter
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false
      return true
    })
  }, [invoices, teamFilter, appFilter, statusFilter])

  const getTeamName = (teamId: string) => {
    const team = teams?.find(t => t.id === teamId)
    return team?.name || teamId
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; icon: React.ReactNode; className?: string }> = {
      paid: {
        variant: 'default',
        label: 'Đã thanh toán',
        icon: <CheckCircle2 className="h-3 w-3" />,
        className: 'bg-green-600 hover:bg-green-700',
      },
      pending: {
        variant: 'secondary',
        label: 'Chưa thanh toán',
        icon: <Clock className="h-3 w-3" />,
        className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      },
      failed: {
        variant: 'destructive',
        label: 'Thanh toán thất bại',
        icon: <XCircle className="h-3 w-3" />,
      },
      cancelled: {
        variant: 'outline',
        label: 'Đã huỷ',
        icon: <AlertTriangle className="h-3 w-3" />,
      },
      draft: {
        variant: 'outline',
        label: 'Nháp',
        icon: <Clock className="h-3 w-3" />,
      },
    }
    return configs[status] || { variant: 'outline' as const, label: status, icon: null }
  }

  const handlePayInvoice = (_invoiceId: string) => {
    toast.success('Đang chuyển đến trang thanh toán...')
  }

  const handleViewInvoice = (_invoiceId: string) => {
    toast.info('Xem chi tiết hóa đơn')
  }

  const handleDownloadInvoice = (_invoiceId: string) => {
    toast.success('Đang tải xuống hóa đơn...')
  }

  const clearFilters = () => {
    setTeamFilter('all')
    setAppFilter('all')
    setStatusFilter('all')
  }

  const hasActiveFilters = teamFilter !== 'all' || appFilter !== 'all' || statusFilter !== 'all'

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/50 rounded-lg">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Bộ lọc:</span>

        <Select value={teamFilter} onValueChange={setTeamFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tất cả team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả team</SelectItem>
            {teams?.map(team => (
              <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={appFilter} onValueChange={setAppFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tất cả app" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả app</SelectItem>
            {uniqueApps.map(app => (
              <SelectItem key={app.code} value={app.code}>{app.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="paid">Đã thanh toán</SelectItem>
            <SelectItem value="pending">Chưa thanh toán</SelectItem>
            <SelectItem value="failed">Thất bại</SelectItem>
            <SelectItem value="cancelled">Đã huỷ</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Xoá bộ lọc
          </Button>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Hiển thị {filteredInvoices.length} / {invoices?.length || 0} hoá đơn
      </div>

      {/* Table */}
      {filteredInvoices.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {invoices?.length === 0 ? 'Chưa có hóa đơn nào' : 'Không tìm thấy hoá đơn phù hợp'}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Số hóa đơn</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>App</TableHead>
              <TableHead>Kỳ thanh toán</TableHead>
              <TableHead>Số tiền</TableHead>
              <TableHead>Hạn thanh toán</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => {
              const statusConfig = getStatusConfig(invoice.status)
              const isOverdue = invoice.status === 'pending' && new Date(invoice.dueDate) < new Date()

              return (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getTeamName(invoice.teamId)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{invoice.appName}</Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(invoice.periodStart), 'dd/MM/yyyy', { locale: vi })}
                    {' - '}
                    {format(new Date(invoice.periodEnd), 'dd/MM/yyyy', { locale: vi })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(invoice.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                      {format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: vi })}
                      {isOverdue && ' (Quá hạn)'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={statusConfig.variant}
                      className={`flex w-fit items-center gap-1 ${statusConfig.className || ''}`}
                    >
                      {statusConfig.icon}
                      {statusConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewInvoice(invoice.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {invoice.status === 'paid' && (
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoice(invoice.id)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {(invoice.status === 'pending' || invoice.status === 'failed') && (
                        <Button size="sm" onClick={() => handlePayInvoice(invoice.id)}>
                          Thanh toán
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
