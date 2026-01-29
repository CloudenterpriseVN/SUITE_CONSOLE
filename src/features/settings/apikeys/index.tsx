import { useState } from 'react'
import { useAtomValue } from 'jotai'
import { IconKey, IconPlus, IconTrash, IconRefresh, IconCopy, IconCheck, IconAlertTriangle } from '@tabler/icons-react'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { savedAppState } from '@/stores/applicationStore'
import {
  useActiveSubscription,
  useActiveSubscriptionAPIKeys,
  useCreateAPIKey,
  useDeleteAPIKey,
  useRegenerateAPIKey,
} from '@/hooks/use-api-keys'
import { toast } from 'sonner'
import { Loader2, AlertCircle } from 'lucide-react'
import type { CreateAPIKeyResponse } from '@/types/api-key'

export default function APIKeys() {
  const activeAppCode = useAtomValue(savedAppState)
  const { subscription, subscriptionId, isLoading: subscriptionLoading, hasSubscription } = useActiveSubscription()
  const { data: apiKeys, isLoading: keysLoading } = useActiveSubscriptionAPIKeys()

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createdKey, setCreatedKey] = useState<CreateAPIKeyResponse | null>(null)
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null)
  const [regenerateKeyId, setRegenerateKeyId] = useState<string | null>(null)
  const [regeneratedKey, setRegeneratedKey] = useState<CreateAPIKeyResponse | null>(null)
  const [keyName, setKeyName] = useState('')
  const [copied, setCopied] = useState(false)

  // Mutations
  const createAPIKey = useCreateAPIKey(subscriptionId)
  const deleteAPIKey = useDeleteAPIKey(subscriptionId)
  const regenerateAPIKey = useRegenerateAPIKey(subscriptionId)

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyName.trim()) {
      toast.error('Please enter a name for the API key')
      return
    }

    try {
      const response = await createAPIKey.mutateAsync({ name: keyName.trim() })
      setKeyName('')
      setCreateDialogOpen(false)
      setCreatedKey(response)
      toast.success('API key created successfully')
    } catch (error: any) {
      toast.error('Failed to create API key', {
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

  const isLoading = subscriptionLoading || keysLoading

  // No active app selected
  if (!activeAppCode) {
    return (
      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>API Keys</h2>
            <p className='text-muted-foreground'>
              Manage your API keys for integration
            </p>
          </div>
        </div>
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center h-48 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Please select an app first</p>
            <p className="text-sm text-muted-foreground">Use the app selector in the header to choose an app</p>
          </CardContent>
        </Card>
      </Main>
    )
  }

  // No subscription for this app
  if (!isLoading && !hasSubscription) {
    return (
      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>API Keys</h2>
            <p className='text-muted-foreground'>
              Manage your API keys for integration
            </p>
          </div>
        </div>
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center h-48 text-center">
            <AlertCircle className="h-10 w-10 text-yellow-500 mb-4" />
            <p className="text-muted-foreground">No subscription found for this app</p>
            <p className="text-sm text-muted-foreground">Subscribe to the app first to manage API keys</p>
          </CardContent>
        </Card>
      </Main>
    )
  }

  return (
    <Main>
      <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>API Keys</h2>
          <p className='text-muted-foreground'>
            Manage your API keys for {subscription?.app_code || activeAppCode}
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} disabled={!hasSubscription}>
          <IconPlus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </div>

      <div className='-mx-4 flex-1 overflow-auto px-4 py-4'>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : apiKeys && apiKeys.length > 0 ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <IconKey className="h-5 w-5" />
                <CardTitle>Active API Keys</CardTitle>
              </div>
              <CardDescription>
                These keys can be used to authenticate API requests for this app.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key</TableHead>
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
              <p className="text-muted-foreground">No API keys yet</p>
              <p className="text-sm text-muted-foreground mb-4">Create your first API key to get started</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <IconPlus className="mr-2 h-4 w-4" />
                Create API Key
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create API Key Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        setCreateDialogOpen(open)
        if (!open) setKeyName('')
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for {subscription?.app_code || activeAppCode}. The key will only be shown once.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateKey}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Key Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Production Server, Development"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  autoFocus
                />
                <p className="text-sm text-muted-foreground">
                  Give your key a descriptive name to help you identify it later.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createAPIKey.isPending}>
                {createAPIKey.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Key'
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
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Your new API key "{createdKey?.name}" has been created successfully.
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
    </Main>
  )
}
