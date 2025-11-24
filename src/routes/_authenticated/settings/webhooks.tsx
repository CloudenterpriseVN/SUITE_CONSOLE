import { createFileRoute } from '@tanstack/react-router'
import Webhooks from '@/features/settings/webhooks'

export const Route = createFileRoute('/_authenticated/settings/webhooks')({
  component: Webhooks,
})
