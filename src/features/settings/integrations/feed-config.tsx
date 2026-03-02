import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { IconApi, IconTrash } from '@tabler/icons-react'
import { Loader2, ShieldAlert } from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Badge } from '@/components/ui/badge'
import { useActiveTeam } from '@/hooks/use-team'
import {
  useFeedConfig,
  useSaveFeedConfig,
  useDeleteFeedConfig,
} from '@/hooks/use-integration-config'

const feedFormSchema = z.object({
  source: z.string().min(1, 'Bắt buộc'),
  base_url: z.string().url('URL không hợp lệ').min(1, 'Bắt buộc'),
  auth_type: z.enum(['token', 'api_key']),
  auth_value: z.string().min(1, 'Bắt buộc'),
  resources: z.string().min(1, 'Bắt buộc'),
  cache_ttl_minutes: z.coerce.number().int().min(0).max(1440),
})

type FeedFormValues = z.infer<typeof feedFormSchema>

export default function FeedConfigPage() {
  const { role } = useActiveTeam()
  const { data: config, isLoading, isError } = useFeedConfig()
  const saveConfig = useSaveFeedConfig()
  const deleteConfig = useDeleteFeedConfig()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const hasPermission = role === 'owner' || role === 'admin'

  const form = useForm<FeedFormValues>({
    resolver: zodResolver(feedFormSchema),
    defaultValues: {
      source: '',
      base_url: '',
      auth_type: 'token',
      auth_value: '',
      resources: '',
      cache_ttl_minutes: 30,
    },
  })

  useEffect(() => {
    if (config) {
      form.reset({
        source: config.source || '',
        base_url: config.base_url || '',
        auth_type: config.auth_type || 'token',
        auth_value: config.auth_value || '',
        resources: config.resources?.join(', ') || '',
        cache_ttl_minutes: config.cache_ttl_minutes ?? 30,
      })
    }
  }, [config, form])

  const onSubmit = async (values: FeedFormValues) => {
    const resources = values.resources
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean)

    if (resources.length === 0) {
      toast.error('Cần ít nhất 1 resource')
      return
    }

    try {
      await saveConfig.mutateAsync({
        source: values.source,
        base_url: values.base_url,
        auth_type: values.auth_type,
        auth_value: values.auth_value,
        resources,
        cache_ttl_minutes: values.cache_ttl_minutes,
      })
      toast.success('Cấu hình Feeding API đã được lưu')
    } catch (error: any) {
      toast.error('Lưu cấu hình thất bại', {
        description: error.message || 'Đã xảy ra lỗi',
      })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteConfig.mutateAsync()
      form.reset({
        source: '',
        base_url: '',
        auth_type: 'token',
        auth_value: '',
        resources: '',
        cache_ttl_minutes: 30,
      })
      toast.success('Đã xóa cấu hình Feeding API')
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
          <h2 className="text-2xl font-bold tracking-tight">Feeding API</h2>
          <p className="text-muted-foreground">
            Cấu hình data source cho master data
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
          <h2 className="text-2xl font-bold tracking-tight">Feeding API</h2>
          <p className="text-muted-foreground">
            Cấu hình data source cho master data
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
          <h2 className="text-2xl font-bold tracking-tight">Feeding API</h2>
          <p className="text-muted-foreground">
            Cấu hình data source cho master data (khách hàng, sản phẩm, ...)
          </p>
        </div>
        {config && !isError && (
          <Badge variant="outline" className="gap-1">
            <IconApi className="h-3 w-3" />
            {config.source || 'Đã cấu hình'}
          </Badge>
        )}
      </div>

      <div className="py-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconApi className="h-5 w-5" />
              Feeding API Configuration
            </CardTitle>
            <CardDescription>
              Cấu hình kết nối đến backend data source. Backend cần implement
              theo Feeding Contract (xem tài liệu).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="netsuite, odoo, ..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Tên backend (hiển thị, logging)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="base_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://api.example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          URL gốc của feeding API trên backend
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="auth_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Auth Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn kiểu xác thực" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="token">
                              Bearer Token (Authorization header)
                            </SelectItem>
                            <SelectItem value="api_key">
                              API Key (X-API-Key header)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Cách gửi credentials đến backend
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="auth_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Auth Value</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder={
                              form.watch('auth_type') === 'token'
                                ? 'Bearer xxx-yyy-zzz'
                                : 'your-api-key'
                            }
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Token hoặc API key gửi kèm mỗi request
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="resources"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resources</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="customers, items, lots"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Danh sách resource được phép query, phân cách bằng dấu
                        phẩy
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cache_ttl_minutes"
                  render={({ field }) => (
                    <FormItem className="max-w-xs">
                      <FormLabel>Cache TTL (phút)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Thời gian cache response (0 = không cache, tối đa 1440
                        phút)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
            <AlertDialogTitle>Xóa cấu hình Feeding API</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa cấu hình Feeding API? Các app đang sử dụng
              data source này sẽ không thể truy vấn master data nữa.
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
