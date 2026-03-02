import { useEffect, useRef, useState } from 'react'
import QRCode from 'react-qr-code'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useActiveTeam } from '@/hooks/use-team'
import { useCreatePublicInvite } from '@/hooks/use-app-subscription'
import { useActiveSubscription } from '@/hooks/use-api-keys'

const TTL_OPTIONS = [
  { label: '24 giờ', value: 24 * 60 * 60 },
  { label: '7 ngày', value: 7 * 24 * 60 * 60 },
  { label: '30 ngày', value: 30 * 24 * 60 * 60 },
]

interface PublicInviteQRDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PublicInviteQRDialog({ open, onOpenChange }: PublicInviteQRDialogProps) {
  const { data: activeTeam } = useActiveTeam()
  const { subscriptionId } = useActiveSubscription()
  const createPublicInvite = useCreatePublicInvite()

  const [ttlSeconds, setTtlSeconds] = useState(TTL_OPTIONS[0].value)
  const [qrData, setQrData] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const qrContainerRef = useRef<HTMLDivElement>(null)

  // Gọi API khi dialog mở hoặc TTL thay đổi
  useEffect(() => {
    if (!open || !subscriptionId) return

    let cancelled = false
    setIsGenerating(true)
    setQrData(null)

    createPublicInvite.mutateAsync({
      subscriptionId,
      ttl_seconds: ttlSeconds,
    })
      .then((res) => {
        if (!cancelled) {
          setQrData(res.token)
          setExpiresAt(res.expires_at * 1000)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) toast.error('Không thể tạo QR', { description: err.message })
      })
      .finally(() => {
        if (!cancelled) setIsGenerating(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, ttlSeconds, subscriptionId])

  const handleDownload = () => {
    const svgEl = qrContainerRef.current?.querySelector('svg')
    if (!svgEl) return

    const svgData = new XMLSerializer().serializeToString(svgEl)
    const canvas = document.createElement('canvas')
    const size = 300
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    img.onload = () => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
      URL.revokeObjectURL(url)
      canvas.toBlob((blob) => {
        if (!blob) return
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `qr-team-${activeTeam?.id ?? 'unknown'}.png`
        link.click()
      }, 'image/png')
    }
    img.src = url
  }

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleString('vi-VN')
    : '—'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Mã QR công khai</DialogTitle>
          <DialogDescription>
            Trao QR này cho nhân viên để kết nối với dữ liệu của nhóm
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* TTL selector */}
          <div className="space-y-1.5">
            <Label htmlFor="ttl">Thời hạn hiệu lực</Label>
            <Select
              value={String(ttlSeconds)}
              onValueChange={(v) => setTtlSeconds(Number(v))}
            >
              <SelectTrigger id="ttl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TTL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-3">
            <div
              ref={qrContainerRef}
              className="flex items-center justify-center bg-white p-3 rounded-lg border"
              style={{ width: 264, height: 264 }}
            >
              {isGenerating ? (
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              ) : qrData ? (
                <QRCode value={qrData} size={240} />
              ) : (
                <span className="text-xs text-muted-foreground">Chưa có dữ liệu</span>
              )}
            </div>

            {/* Credential info */}
            {activeTeam && (
              <div className="w-full text-xs text-muted-foreground space-y-0.5">
                <div className="flex justify-between">
                  <span>Team:</span>
                  <span className="font-medium text-foreground">{activeTeam.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hết hạn:</span>
                  <span>{expiryLabel}</span>
                </div>
              </div>
            )}
          </div>

          {/* Download button */}
          <Button
            variant="outline"
            className="w-full"
            disabled={!qrData || isGenerating}
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            Tải ảnh QR
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
