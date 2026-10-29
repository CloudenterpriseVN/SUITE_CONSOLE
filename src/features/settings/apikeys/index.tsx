import { useState } from 'react'
import { useAtomValue } from 'jotai'
import { IconKey, IconPlus, IconTrash, IconRefresh, IconCopy, IconCheck, IconAlertTriangle, IconPencil } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { activeTeamIdAtom } from '@/stores/applicationStore'
import {
  useTeamAPIKeys,
  useCreateAPIKey,
  useUpdateAPIKey,
  useDeleteAPIKey,
  useRegenerateAPIKey,
} from '@/hooks/use-api-keys'
import { toast } from 'sonner'
import { Loader2, AlertCircle } from 'lucide-react'
import type { APIKey, APIKeyRole, CreateAPIKeyResponse } from '@/types/api-key'

const ROLE_LABELS: Record<APIKeyRole, string> = { admin: 'Quản trị', member: 'Thành viên' }

export default function APIKeys() {
  const activeTeamId = useAtomValue(activeTeamIdAtom)
  const { data, isLoading, error: keysError } = useTeamAPIKeys()
  const apiKeys = data?.keys
  const teamApps = data?.apps ?? []

  // Dialog states: key đang sửa (null = tạo mới)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<APIKey | null>(null)
  const [keyApps, setKeyApps] = useState<string[]>([])
  const [keyRole, setKeyRole] = useState<APIKeyRole>('admin')
  const [createdKey, setCreatedKey] = useState<CreateAPIKeyResponse | null>(null)
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null)
  const [regenerateKeyId, setRegenerateKeyId] = useState<string | null>(null)
  const [regeneratedKey, setRegeneratedKey] = useState<CreateAPIKeyResponse | null>(null)
  const [keyName, setKeyName] = useState('')
  const [copied, setCopied] = useState(false)

  // Mutations
  const createAPIKey = useCreateAPIKey()
  const updateAPIKey = useUpdateAPIKey()
  const deleteAPIKey = useDeleteAPIKey()
  const regenerateAPIKey = useRegenerateAPIKey()

  const openKeyDialog = (key: APIKey | null) => {
    setEditingKey(key)
    setKeyName(key?.name ?? '')
    setKeyApps(key ? key.apps : teamApps.map((a) => a.app))
    setKeyRole(key?.role ?? 'admin')
    setCreateDialogOpen(true)
  }

  const toggleApp = (app: string, checked: boolean) =>
    setKeyApps((apps) => (checked ? [...apps, app] : apps.filter((a) => a !== app)))

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyName.trim()) {
      toast.error('Please enter a name for the API key')
      return
    }
    if (!keyApps.length) {
      toast.error('Chọn ít nhất một ứng dụng')
      return
    }

    const values = { name: keyName.trim(), apps: keyApps, role: keyRole }
    try {
      if (editingKey) {
        await updateAPIKey.mutateAsync({ id: editingKey.id, ...values })
        toast.success('Đã lưu API key')
      } else {
        setCreatedKey(await createAPIKey.mutateAsync(values))
        toast.success('API key created successfully')
      }
      setKeyName('')
      setCreateDialogOpen(false)
    } catch (error: any) {
      toast.error(editingKey ? 'Không lưu được API key' : 'Failed to create API key', {
        description: error.message || 'An error occurred',
      })
    }
  }

  const handleDeleteKey = async () => {
    if (!deleteKeyId) return
    try {
      await deleteAPIKey.mutateAsync(deleteKeyId)
      toast.success('API key deleted successfully')
    } catch (error: any) {
      toast.error('Failed to delete API key', {
        description: error.message || 'An error occurred',
      })
    } finally {
      setDeleteKeyId(null)
    }
  }

  const handleRegenerateKey = async () => {
    if (!regenerateKeyId) return
    try {
      const response = await regenerateAPIKey.mutateAsync(regenerateKeyId)
      setRegeneratedKey(response)
      toast.success('API key regenerated successfully')
    } catch (error: any) {
      toast.error('Failed to regenerate API key', {
        description: error.message || 'An error occurred',
      })
    } finally {
      setRegenerateKeyId(null)
    }
  }

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key)
      setCopied(true)
      toast.success('API key copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleCopyPrefix = (prefix: string) => {
    navigator.clipboard.writeText(prefix)
    toast.success('Key prefix copied to clipboard')
  }

  // No active team selected
  if (!activeTeamId) {
    return (
      <div className='flex-1 w-full'>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>API Keys</h2>
            <p className='text-muted-foreground'>
              Một key của team dùng cho mọi ứng dụng được chọn (vd Odoo kết nối Suite Shop và Suite WMS)
            </p>
          </div>
        </div>
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center h-48 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chọn team trước</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Không quản lý được app nào của team (không phải chủ team / admin, hoặc team chưa đăng ký app)
  if (!isLoading && (keysError || !teamApps.length)) {
    return (
      <div className='flex-1 w-full'>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>API Keys</h2>
            <p className='text-muted-foreground'>
              Một key của team dùng cho mọi ứng dụng được chọn (vd Odoo kết nối Suite Shop và Suite WMS)
            </p>
          </div>
        </div>
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center h-48 text-center">
            <AlertCircle className="h-10 w-10 text-yellow-500 mb-4" />
            <p className="text-muted-foreground">Không có ứng dụng nào để cấp API key</p>
            <p className="text-sm text-muted-foreground">
              Cần là chủ team hoặc quản trị của ít nhất một ứng dụng team đã đăng ký
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='flex-1 w-full flex flex-col'>
      <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>API Keys</h2>
          <p className='text-muted-foreground'>
            Sử dụng các key này để tích hợp với ứng dụng qua REST API
          </p>
        </div>
        <Button onClick={() => openKeyDialog(null)}>
          <IconPlus className="mr-2 h-4 w-4" />
          Tạo API Key
        </Button>
      </div>

      <div className='flex-1 overflow-auto py-4'>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : apiKeys && apiKeys.length > 0 ? (
          <Card>
            {/* <CardHeader>
              <div className="flex items-center gap-2">
                <IconKey className="h-5 w-5" />
                <CardTitle>Active API Keys</CardTitle>
              </div>
              <CardDescription>
                These keys can be used to authenticate API requests for this app.
              </CardDescription>
            </CardHeader> */}
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Ứng dụng</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {key.key_prefix}...
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopyPrefix(key.key_prefix)}
                          >
                            <IconCopy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {key.apps.map((app) => (
                            <Badge key={app} variant="outline" className="uppercase">{app}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{ROLE_LABELS[key.role] ?? key.role}</TableCell>
                      <TableCell>
                        <Badge variant={key.status === 'active' ? 'default' : 'destructive'}>
                          {key.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {key.create_at || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openKeyDialog(key)}
                            title="Sửa phạm vi"
                          >
                            <IconPencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setRegenerateKeyId(key.id)}
                            disabled={regenerateAPIKey.isPending}
                            title="Regenerate key"
                          >
                            <IconRefresh className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteKeyId(key.id)}
                            disabled={deleteAPIKey.isPending}
                            title="Delete key"
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-48 text-center">
              <IconKey className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Chưa có API Key nào</p>
              <p className="text-sm text-muted-foreground mb-4">Hãy khởi tạo API Key đầu tiên của bạn</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create API Key Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        setCreateDialogOpen(open)
        if (!open) {
          setKeyName('')
          setEditingKey(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingKey ? 'Sửa API Key' : 'Tạo API Key'}</DialogTitle>
            <DialogDescription>
              {editingKey
                ? 'Đổi tên, ứng dụng và vai trò của key. Key không đổi.'
                : 'Key của team, dùng cho các ứng dụng được chọn. Key chỉ hiện một lần nên hãy lưu cẩn thận.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateKey}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Tên gợi nhớ</Label>
                <Input
                  id="name"
                  placeholder="e.g., Production Server, Development"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  autoFocus
                />
                <p className="text-sm text-muted-foreground">
                  Đăt tên để dễ nhớ về sau.
                </p>
              </div>
              <div className="grid gap-2">
                <Label>Ứng dụng</Label>
                <div className="flex flex-wrap gap-4">
                  {teamApps.map(({ app, status }) => (
                    <label key={app} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={keyApps.includes(app)}
                        onCheckedChange={(checked) => toggleApp(app, checked === true)}
                      />
                      <span className="uppercase">{app}</span>
                      {status !== 'active' && <span className="text-muted-foreground">({status})</span>}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Vai trò</Label>
                <RadioGroup value={keyRole} onValueChange={(v) => setKeyRole(v as APIKeyRole)} className="flex gap-4">
                  {(Object.keys(ROLE_LABELS) as APIKeyRole[]).map((role) => (
                    <label key={role} className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value={role} />
                      {ROLE_LABELS[role]}
                    </label>
                  ))}
                </RadioGroup>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={createAPIKey.isPending || updateAPIKey.isPending}>
                {createAPIKey.isPending || updateAPIKey.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang khởi tạo...
                  </>
                ) : (
                  editingKey ? 'Lưu' : 'Tạo khóa mới'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* API Key Created Dialog */}
      <Dialog open={!!createdKey} onOpenChange={() => setCreatedKey(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tạo thành công API Key</DialogTitle>
            <DialogDescription>
              API key mới"{createdKey?.name}" đã được tạo thành công.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive" className="border-yellow-500 bg-yellow-50 text-yellow-900">
              <IconAlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Important:</strong> This is the only time you will see this key.
                Please copy it now and store it securely.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <label className="text-sm font-medium">Your API Key</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted p-3 rounded-md text-sm font-mono break-all">
                  {createdKey?.key}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => createdKey && handleCopyKey(createdKey.key)}
                  className="shrink-0"
                >
                  {copied ? (
                    <IconCheck className="h-4 w-4 text-green-600" />
                  ) : (
                    <IconCopy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreatedKey(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerated Key Dialog */}
      <Dialog open={!!regeneratedKey} onOpenChange={() => setRegeneratedKey(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>API Key Regenerated</DialogTitle>
            <DialogDescription>
              Your API key "{regeneratedKey?.name}" has been regenerated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive" className="border-yellow-500 bg-yellow-50 text-yellow-900">
              <IconAlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Important:</strong> The old key is now invalid. Copy and save this new key immediately.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <label className="text-sm font-medium">New API Key</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted p-3 rounded-md text-sm font-mono break-all">
                  {regeneratedKey?.key}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => regeneratedKey && handleCopyKey(regeneratedKey.key)}
                  className="shrink-0"
                >
                  {copied ? (
                    <IconCheck className="h-4 w-4 text-green-600" />
                  ) : (
                    <IconCopy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setRegeneratedKey(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteKeyId} onOpenChange={() => setDeleteKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this API key? This action cannot be undone.
              Any applications using this key will no longer be able to authenticate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteKey}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAPIKey.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Regenerate Confirmation Dialog */}
      <AlertDialog open={!!regenerateKeyId} onOpenChange={() => setRegenerateKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to regenerate this API key? The old key will be invalidated
              immediately. Make sure to update your applications with the new key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerateKey}>
              {regenerateAPIKey.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Regenerate'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
