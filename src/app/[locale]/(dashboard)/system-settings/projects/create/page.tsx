import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import ProjectCreatePage from '@/features/properties/project/ProjectCreatePage'
import { PROJECT_MANAGEMENT_BASE_PATH } from '@/features/properties/project/projectListHelpers'
import { getDictionary } from '@utils/getDictionary'
import { toClientSessionToken } from '@utils/safeSessionToken'

type Params = Promise<{
  locale: Locale
}>

// System Settings > Project Management: create project (System Settings admin boundary, not a business right).
const SystemSettingsProjectCreatePage = async ({ params }: { params: Params }) => {
  const { locale } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])

  return (
    <AuthorizedLayout requiredPath={PROJECT_MANAGEMENT_BASE_PATH} requiredAction="ADD" params={{ locale }}>
      {() => (
        <ProjectCreatePage
          dictionary={dictionary}
          locale={locale}
          sessiontoken={toClientSessionToken(session) ?? ''}
          basePath={PROJECT_MANAGEMENT_BASE_PATH}
        />
      )}
    </AuthorizedLayout>
  )
}

export default SystemSettingsProjectCreatePage
