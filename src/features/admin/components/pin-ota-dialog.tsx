import { useState } from 'react'
import { toast } from 'sonner'
import { useAppVersions, usePinSubscriptionOta } from '@/hooks/use-admin'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const DEFAULT = '__default__'

/** Ghim subscription vào một phiên bản OTA của app; "Mặc định" = bỏ ghim (theo mặc định của app). */
export function PinOtaDialog({
  sub,
  title,
  onClose,
}: {
  sub: { id: string; app_id: string; ota_version_id?: string | null }
  title: string
  onClose: () => void
}) {
  const { data: versions, isLoading } = useAppVersions(sub.app_id)
  const pin = usePinSubscriptionOta()
  const [value, setValue] = useState(sub.ota_version_id ?? DEFAULT)
  const current = versions?.find((v) => v.is_default)

  const save = async () => {
    try {
      await pin.mutateAsync({
        id: sub.id,
        versionId: value === DEFAULT ? null : value,
      })
      toast.success(
        value === DEFAULT ? 'Dùng phiên bản mặc định' : 'Đã ghim phiên bản'
      )
      onClose()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Phiên bản OTA mà SuperApp của team này tải. Để "Mặc định" thì theo
            phiên bản mặc định của ứng dụng.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-1.5'>
          <Label>Phiên bản OTA</Label>
          <Select value={value} onValueChange={setValue} disabled={isLoading}>
            <SelectTrigger className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DEFAULT}>
                Mặc định{current ? ` (hiện là ${current.version})` : ''}
              </SelectItem>
              {versions
                ?.filter((v) => v.saved && v.id)
                .map((v) => (
                  <SelectItem key={v.id!} value={v.id!}>
                    {v.version}
                    {v.notes ? ` — ${v.notes}` : ''}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {current && !current.saved && (
            <p className='text-muted-foreground text-xs'>
              Bản mặc định hiện tại chưa lưu thành dòng nên chưa ghim được —
              thêm nó ở trang Apps / OTA.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Huỷ
          </Button>
          <Button
            disabled={
              pin.isPending || value === (sub.ota_version_id ?? DEFAULT)
            }
            onClick={save}
          >
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
