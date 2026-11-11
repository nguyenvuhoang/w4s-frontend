import { auth } from '@/auth'
import { Locale, i18n } from '@/configs/i18n'
import AssetManagementPage from '@/features/assets/AssetManagementPage'
import { assetService } from '@/features/assets/services/assetService'
import { AssetWorkflowError } from '@/features/assets/types'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { getDictionary } from '@utils/getDictionary'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import { BoContextError, boContextService } from '@/shared/services/boContextService'
import { getServerWorkingProjectScope } from '@/shared/services/workingProjectScope.server'

import { parseAssetFilter, type SearchParams } from '../../pageRouteHelpers'
import logger from '@lib/logger'

type Params = Promise<{
  locale: Locale
}>

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  return i18n.locales.map((l) => ({ locale: l }))
}

const AssetsPage = async ({ params, searchParams }: { params: Params; searchParams?: Promise<SearchParams> }) => {
  const { locale } = await params
  const search_params = await searchParams ?? {}
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const parsedInitialFilter = parseAssetFilter(search_params)
  let initialFilter = parsedInitialFilter
  let initialData = assetService.getDefaultAssetResponse(initialFilter)
  let initialError: string | null = null
  let initialErrorReference: string | null = null
  let initialScope: string | null = null

  try {
    const serverToken = await getServerBackendToken()
    const scope = await getServerWorkingProjectScope()

    if (!serverToken) throw new AssetWorkflowError('Session is required.')
    if (!scope) throw new AssetWorkflowError('Working project scope is required.')

    const projectContext = await boContextService.getContext({
      sessiontoken: serverToken,
      language: locale
    })
    const selectedProject = projectContext.projects.find(project => project.code === scope)

    if (!selectedProject) {
      throw new AssetWorkflowError('The selected project is not available.')
    }

    initialScope = selectedProject.code
    initialFilter = {
      ...parsedInitialFilter,
      project_id: selectedProject.id
    }
    initialData = assetService.getDefaultAssetResponse(initialFilter)

    if (process.env.NODE_ENV === 'development') {
      logger.info('[assets] SSR initial search', {
        scope: selectedProject.code,
        projectId: selectedProject.id,
        pageIndex: initialFilter.page_index
      })
    }

    initialData = await assetService.simpleSearchAssets({
      sessiontoken: serverToken,
      language: locale,
      filter: initialFilter,
      scope: selectedProject.code
    })
  } catch (error) {
    initialError = dictionary.assets?.load_failed ?? dictionary.common?.servererror ?? 'Unable to load assets.'
    initialErrorReference = error instanceof AssetWorkflowError
      ? error.execution_id ?? null
      : error instanceof BoContextError
        ? error.executionId ?? null
        : null

    logger.error('[assets] Unable to load initial data', {
      executionId: initialErrorReference,
      message: error instanceof Error ? error.message : initialError,
      error
    })
  }

  return (
    <AuthorizedLayout requiredPath="/assets/assets" params={{ locale }}>
      {() => (
        <AssetManagementPage
          dictionary={dictionary}
          session={session}
          locale={locale}
          initialFilter={{
            ...initialFilter,
            page_index: initialData.page_index,
            page_size: initialData.page_size
          }}
          initialData={initialData}
          initialError={initialError}
          initialErrorReference={initialErrorReference}
          initialScope={initialScope}
        />
      )}
    </AuthorizedLayout>
  )
}

export default AssetsPage
