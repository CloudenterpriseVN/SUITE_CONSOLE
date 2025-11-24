import ContentSection from '../components/content-section'
import { WebhookForm } from './webhook-form'

export default function Webhooks() {

  return (
    <ContentSection
      title='Webhooks'
      desc='Send event notifications to your integration system.'
    >
      <WebhookForm />
    </ContentSection>
  )
}