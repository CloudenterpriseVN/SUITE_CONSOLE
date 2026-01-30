import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppSubscriptionStatus } from '@/hooks/use-app-subscription'
import { useAppPricing } from '@/hooks/use-app-subscription'
import { useActiveTeam } from '@/hooks/use-team'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AppSubscriptionCardProps {
  appId: string
  appCode: string
  appName: string
  appLogo?: string
  onSubscribe: () => void
  onAccess: () => void
  isSubscribing?: boolean
}

export function AppSubscriptionCard({
  appId,
  appCode,
  appName,
  appLogo,
  onSubscribe,
  onAccess,
  isSubscribing = false,
}: AppSubscriptionCardProps) {
  const { data: pricingList } = useAppPricing()
  const { isSubscribed, subscription } = useAppSubscriptionStatus(appId)
  const { data: activeTeam } = useActiveTeam()

  const pricing = pricingList?.find(p => p.appCode === appCode)
  const [imgError, setImgError] = useState(false)

  const handleSubscribe = () => {
    if (!activeTeam) {
      toast.error('Vui lòng chọn team trước')
      return
    }

    // Permission check will be done on server side
    onSubscribe()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {appLogo && !imgError ? (
            <img
              src={appLogo}
              alt={appName}
              className="h-10 w-10 rounded-lg object-contain bg-muted"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium">
              {appName.charAt(0)}
            </div>
          )}
          <div>
            <CardTitle>{appName}</CardTitle>
            <CardDescription>{pricing?.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {pricing && (
          <div>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(pricing.pricing.monthly)}
              <span className="text-sm font-normal text-muted-foreground">/tháng</span>
            </p>
          </div>
        )}

        {pricing?.features && (
          <ul className="space-y-1">
            {pricing.features.map((feature, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {isSubscribed && subscription ? (
          <div className="space-y-2">
            <Badge variant={subscription.status === 'active' ? 'default' : subscription.status === 'registered' ? 'secondary' : 'destructive'}>
              {subscription.status === 'registered' && 'Đã đăng ký'}
              {subscription.status === 'active' && 'Đang hoạt động'}
              {subscription.status === 'suspended' && 'Đã tạm dừng'}
            </Badge>
            {subscription.updated_at && (
              <p className="text-sm text-muted-foreground">
                Cập nhật lúc: {subscription.updated_at}
              </p>
            )}
            {subscription.status === 'active' && (
              <Button size="sm" variant="outline" className="w-full" onClick={onAccess}>
                Truy cập
              </Button>
            )}
          </div>
        ) : (
          <Button
            size="sm"
            className="w-full"
            onClick={handleSubscribe}
            disabled={!activeTeam || isSubscribing}
          >
            {isSubscribing ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Đang đăng ký...
              </>
            ) : (
              'Đăng ký ngay'
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
