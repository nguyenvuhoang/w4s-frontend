import type { Locale } from '@/configs/i18n'
import { renderProjectDetailRoute } from '@/features/properties/project/projectDetailRoute.server'

type Params = Promise<{
  locale: Locale
  id: string
}>

// System Settings > Project Management: project detail with the edit form opened (System Settings admin boundary).
const SystemSettingsProjectEditPage = async ({ params }: { params: Params }) => {
  const { locale, id } = await params

  return renderProjectDetailRoute({ locale, id, scope: 'admin', mode: 'edit' })
}

export default SystemSettingsProjectEditPage
