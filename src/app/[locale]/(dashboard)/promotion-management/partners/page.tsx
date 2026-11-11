import { auth } from '@/auth'
import { i18n, type Locale } from '@/configs/i18n'
import PartnerManagementPage from '@/features/partners/PartnerManagementPage'
import { partnerService } from '@/features/partners/service'
import { normalizeWorkflowErrorDetail } from '@/shared/utils/workflowError'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { getDictionary } from '@utils/getDictionary'

import { parsePartnerFilter, type SearchParams } from '../../pageRouteHelpers'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import logger from '@lib/logger'

type Params = Promise<{ locale: Locale }>

export async function generateStaticParams() {
  return i18n.locales.map(locale => ({ locale }))
}

const PartnerManagementRoute = async ({ params, searchParams }: { params: Params; searchParams?: Promise<SearchParams> }) => {
  const { locale } = await params
  const searchParamsValue = await searchParams ?? {}
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const initialFilter = parsePartnerFilter(searchParamsValue)
  let initialData = partnerService.getDefaultPartnerResponse(initialFilter)
  let initialError: { message: string; executionId?: string } | null = null

  try {
    initialData = await partnerService.simpleSearchPartners({ sessiontoken: (await getServerBackendToken()) ?? undefined, language: locale, filter: initialFilter })
  } catch (error) {
    const detail = normalizeWorkflowErrorDetail(error, { fallback: 'Unable to load partners.' })
    initialError = { message: detail.message, executionId: detail.executionId }
    logger.error('[promotion-management/partners] Unable to load initial data', error)
  }

  return <AuthorizedLayout requiredPath="/promotion-management" params={{ locale }}>{() => <PartnerManagementPage dictionary={dictionary} session={session} locale={locale} initialFilter={{ ...initialFilter, page_index: initialData.page_index, page_size: initialData.page_size }} initialData={initialData} initialError={initialError} />}</AuthorizedLayout>
}

export default PartnerManagementRoute
