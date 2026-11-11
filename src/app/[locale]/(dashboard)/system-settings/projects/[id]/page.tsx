import type { Locale } from '@/configs/i18n'
import { renderProjectDetailRoute } from '@/features/properties/project/projectDetailRoute.server'

type Params = Promise<{
  locale: Locale
  id: string
}>

// System Settings > Project Management: project detail ("Back to list" returns to the management list).
const SystemSettingsProjectDetailPage = async ({ params }: { params: Params }) => {
  const { locale, id } = await params

  return renderProjectDetailRoute({ locale, id, scope: 'admin' })
}

export default SystemSettingsProjectDetailPage
