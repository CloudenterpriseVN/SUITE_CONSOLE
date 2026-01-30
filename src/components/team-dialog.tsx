import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import type { Team } from '@/types/team'

interface TeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team?: Team | null // null = add mode, Team = edit mode
  onSave: (team: Partial<Team>) => void | Promise<void>
  isSaving?: boolean
}

export function TeamDialog({ open, onOpenChange, team, onSave, isSaving }: TeamDialogProps) {
  const isEditMode = !!team

  const [formData, setFormData] = useState({
    name: '',
    fullName: '',
    billingAddress: '',
    taxId: '',
  })

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name || '',
        fullName: team.fullName || '',
        billingAddress: team.billingAddress || '',
        taxId: team.taxId || '',
      })
    } else {
      setFormData({
        name: '',
        fullName: '',
        billingAddress: '',
        taxId: '',
      })
    }
  }, [team, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave({
      ...(team ? { id: team.id } : {}),
      name: formData.name,
      fullName: formData.fullName,
      billingAddress: formData.billingAddress,
      taxId: formData.taxId,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Chỉnh sửa Team' : 'Thêm Team mới'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Cập nhật thông tin team.'
                : 'Tạo team mới để bắt đầu sử dụng.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Tên Team *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Tên ngắn gọn để hiển thị"
                required
                disabled={isSaving}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fullName">Tên đầy đủ *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Tên đầy đủ (xuất hoá đơn)"
                required
                disabled={isSaving}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="billingAddress">Địa chỉ xuất hoá đơn *</Label>
              <Input
                id="billingAddress"
                value={formData.billingAddress}
                onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                placeholder="Địa chỉ đầy đủ"
                required
                disabled={isSaving}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="taxId">Mã số thuế</Label>
              <Input
                id="taxId"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="Nhập mã số thuế (nếu có)"
                disabled={isSaving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Lưu thay đổi' : 'Tạo Team'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
