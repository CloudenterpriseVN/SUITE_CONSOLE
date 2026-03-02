import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  IconDatabase,
  IconPlugConnected,
  IconTrash,
} from '@tabler/icons-react'
import { Loader2, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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
import { Badge } from '@/components/ui/badge'
import { useActiveTeam } from '@/hooks/use-team'
import {
  useOdooConfig,
  useSaveOdooConfig,
  useDeleteOdooConfig,
  useTestOdooConnection,
} from '@/hooks/use-integration-config'

const odooFormSchema = z.object({
  url: z.string().url('URL không hợp lệ').min(1, 'Bắt buộc'),
  db: z.string().min(1, 'Bắt buộc'),
  username: z.string().min(1, 'Bắt buộc'),
  password: z.string().min(1, 'Bắt buộc'),
  company_id: z.coerce.number().int().positive().optional().or(z.literal('')),
  timeout: z.coerce.number().int().min(5).max(120),
})

type OdooFormValues = z.infer<typeof odooFormSchema>

export default function OdooConfigPage() {
  const { role } = useActiveTeam()
  const { data: config, isLoading, isError } = useOdooConfig()
  const saveConfig = useSaveOdooConfig()
  const deleteConfig = useDeleteOdooConfig()
  const testConnection = useTestOdooConnection()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const hasPermission = role === 'owner' || role === 'admin'

  const form = useForm<OdooFormValues>({
    resolver: zodResolver(odooFormSchema),
    defaultValues: {
      url: '',
      db: '',
      username: '',
      password: '',
      company_id: '',
      timeout: 30,
    },
  })

  useEffect(() => {
    if (config) {
      form.reset({
        url: config.url || '',
        db: config.db || '',
        username: config.username || '',
        password: config.password || '',
        company_id: config.company_id ?? '',
        timeout: config.timeout || 30,
      })
    }
  }, [config, form])

  const onSubmit = async (values: OdooFormValues) => {
    try {
      await saveConfig.mutateAsync({
        enabled: true,
        url: values.url,
        db: values.db,
        username: values.username,
        password: values.password,
        company_id: values.company_id ? Number(values.company_id) : undefined,
        timeout: values.timeout,
      })
      toast.success('Cấu hình Odoo đã được lưu')
    } catch (error: any) {
      toast.error('Lưu cấu hình thất bại', {
        description: error.message || 'Đã xảy ra lỗi',
      })
    }
  }

  const handleTestConnection = async () => {
    const values = form.getValues()
    if (!values.url || !values.db || !values.username || !values.password) {
      toast.error('Vui lòng điền đầy đủ thông tin kết nối')
      return
    }

    try {
      const result = await testConnection.mutateAsync({
        url: values.url,
        db: values.db,
        username: values.username,
        password: values.password,
        company_id: values.company_id ? Number(values.company_id) : undefined,
        timeout: values.timeout,
      })
      if (result.success) {
        toast.success('Kết nối thành công', {
          description: result.version
            ? `Odoo version: ${result.version}`
            : result.message,
        })
      } else {
        toast.error('Kết nối thất bại', { description: result.message })
      }
    } catch (error: any) {
      toast.error('Kết nối thất bại', {
        description: error.message || 'Không thể kết nối đến Odoo',
      })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteConfig.mutateAsync()
      form.reset({
        url: '',
        db: '',
        username: '',
        password: '',
        company_id: '',
        timeout: 30,
      })
      toast.success('Đã xóa cấu hình Odoo')
    } catch (error: any) {
      toast.error('Xóa cấu hình thất bại', {
        description: error.message || 'Đã xảy ra lỗi',
      })
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  if (!hasPermission) {
    return (
      <div className="flex-1 w-full">
        <div className="mb-2">
          <h2 className="text-2xl font-bold tracking-tight">Odoo Integration</h2>
          <p className="text-muted-foreground">
            Cấu hình kết nối đến Odoo instance
          </p>
        </div>
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center h-48 text-center">
            <ShieldAlert className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Bạn không có quyền quản lý tích hợp
            </p>
            <p className="text-sm text-muted-foreground">
              Liên hệ owner hoặc admin của team
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 w-full">
        <div className="mb-2">
          <h2 className="text-2xl font-bold tracking-tight">Odoo Integration</h2>
          <p className="text-muted-foreground">
            Cấu hình kết nối đến Odoo instance
          </p>
        </div>
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 w-full">
      <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Odoo Integration</h2>
          <p className="text-muted-foreground">
            Cấu hình kết nối đến Odoo instance cho team
          </p>
        </div>
        {config && !isError && (
          <Badge variant="outline" className="gap-1">
            <IconDatabase className="h-3 w-3" />
            Đã cấu hình
          </Badge>
        )}
      </div>

      <div className="py-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconDatabase className="h-5 w-5" />
              Odoo Connection
            </CardTitle>
            <CardDescription>
              Thông tin kết nối đến Odoo instance. Password sẽ được mã hóa khi lưu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://odoo.example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          URL của Odoo server
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="db"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Database</FormLabel>
                        <FormControl>
                          <Input placeholder="production" {...field} />
                        </FormControl>
                        <FormDescription>
                          Tên database Odoo
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="api@company.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Email hoặc username đăng nhập Odoo
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password / API Key</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="Odoo password hoặc API key"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Khuyến nghị dùng API key thay password
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="company_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company ID (tùy chọn)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Dùng cho multi-company Odoo
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeout"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timeout (giây)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Thời gian chờ tối đa cho mỗi request (5-120s)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {testConnection.data && (
                  <Alert
                    variant={
                      testConnection.data.success ? 'default' : 'destructive'
                    }
                  >
                    {testConnection.data.success ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>
                      {testConnection.data.success
                        ? `Kết nối thành công${testConnection.data.version ? ` — Odoo ${testConnection.data.version}` : ''}`
                        : testConnection.data.message}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" disabled={saveConfig.isPending}>
                    {saveConfig.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      'Lưu cấu hình'
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testConnection.isPending}
                  >
                    {testConnection.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang kiểm tra...
                      </>
                    ) : (
                      <>
                        <IconPlugConnected className="mr-2 h-4 w-4" />
                        Kiểm tra kết nối
                      </>
                    )}
                  </Button>

                  {config && !isError && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <IconTrash className="mr-2 h-4 w-4" />
                      Xóa cấu hình
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa cấu hình Odoo</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa cấu hình Odoo? Các service đang sử dụng kết
              nối này sẽ không thể truy cập Odoo nữa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteConfig.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Xóa'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
