import PropertyManagementTabs from '@/features/properties/PropertyManagementTabs'
import type { Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import ProjectManagementPage from '@/features/properties/project/ProjectManagementPage'
import { PROJECT_MANAGEMENT_BASE_PATH } from '@/features/properties/project/projectListHelpers'

type Params = Promise<{
  locale: Locale
}>

// System Settings > Project Management: the full project catalog (search, filters, grid/list, create...).
// Guarded like the other admin-only System Settings routes: AuthorizedLayout + the static super-admin
// policy of this path (configs/staticRouteAccess); non-admins get the Forbidden page, even by direct URL.
const SystemSettingsProjectsPage = async ({ params }: { params: Params }) => {
  const resolvedParams = await params

  return (
    <AuthorizedLayout requiredPath={PROJECT_MANAGEMENT_BASE_PATH} params={resolvedParams}>
      {({ dictionary, locale }) => (
        <>
          <PropertyManagementTabs admin locale={locale} labels={dictionary.propertyManagement} ariaLabel={dictionary.propertyManagement.project} />
          <ProjectManagementPage dictionary={dictionary} basePath={PROJECT_MANAGEMENT_BASE_PATH} />
        </>
      )}
    </AuthorizedLayout>
  )
}

export default SystemSettingsProjectsPage
