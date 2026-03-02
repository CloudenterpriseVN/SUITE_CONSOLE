import { createFileRoute } from '@tanstack/react-router'
import FeedConfigPage from '@/features/settings/integrations/feed-config'

export const Route = createFileRoute('/_authenticated/settings/feed')({
  component: FeedConfigPage,
})
