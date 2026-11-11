import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import ProjectCreatePage from '@/features/properties/project/ProjectCreatePage'
import { PROJECT_MANAGEMENT_BASE_PATH } from '@/features/properties/project/projectListHelpers'
import { getDictionary } from '@utils/getDictionary'
import { toClientSessionToken } from '@utils/safeSessionToken'

type Params = Promise<{
  locale: Locale
}>

// Compatibility link only: creating a project is a System Settings (admin) action now, so this old URL
// is guarded by the same admin boundary as /system-settings/projects/create and returns to that area.
const ProjectCreateRoute = async ({ params }: { params: Params }) => {
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

export default ProjectCreateRoute
