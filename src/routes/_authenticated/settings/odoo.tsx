import { createFileRoute } from '@tanstack/react-router'
import OdooConfigPage from '@/features/settings/integrations/odoo-config'

export const Route = createFileRoute('/_authenticated/settings/odoo')({
  component: OdooConfigPage,
})
