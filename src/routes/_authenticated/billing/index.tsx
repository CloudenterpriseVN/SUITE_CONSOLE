import { createFileRoute } from '@tanstack/react-router'
import { InvoiceTable } from '@/features/billing/components/invoice-table'
import { Receipt } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppSelector } from '@/components/app-selector'

function BillingPage() {
  return (
    <div className="flex h-full flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Receipt className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Hoá đơn</h1>
            <p className="text-muted-foreground">Quản lý hoá đơn và thanh toán</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AppSelector />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách hoá đơn</CardTitle>
          <CardDescription>
            Tất cả hoá đơn của các team bạn tham gia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceTable />
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/billing/')({
  component: BillingPage,
})
