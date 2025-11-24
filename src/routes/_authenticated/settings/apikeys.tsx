import { createFileRoute } from '@tanstack/react-router'
import APIKeys from '@/features/settings/apikeys'

export const Route = createFileRoute('/_authenticated/settings/apikeys')({
  component: APIKeys,
})
