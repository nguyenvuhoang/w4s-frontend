import { i18n, type Locale } from '@/configs/i18n'
import PartnerDetailPage from '@/features/partners/PartnerDetailPage'
import { partnerService } from '@/features/partners/service'
import type { PartnerItem } from '@/features/partners/types'
import { normalizeWorkflowErrorDetail } from '@/shared/utils/workflowError'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { getDictionary } from '@utils/getDictionary'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import logger from '@lib/logger'

type Params = Promise<{ locale: Locale; id: string }>

export async function generateStaticParams() {
  return i18n.locales.map(locale => ({ locale }))
}

const PartnerDetailRoute = async ({ params }: { params: Params }) => {
  const { locale, id } = await params
  const dictionary = await getDictionary(locale)
  const partnerId = Number(id)
  const validPartnerId = Number.isInteger(partnerId) && partnerId > 0 ? partnerId : 0
  let partner: PartnerItem | null = null
  let initialError: { message: string; executionId?: string } | null = null

  if (validPartnerId) {
    try {
      partner = await partnerService.getPartnerById({ sessiontoken: (await getServerBackendToken()) ?? undefined, language: locale, id: validPartnerId })
    } catch (error) {
      const detail = normalizeWorkflowErrorDetail(error, { fallback: 'Unable to load partner detail.' })
      initialError = { message: detail.message, executionId: detail.executionId }
      logger.error('[promotion-management/partners] Unable to load detail', error)
    }
  }

  return <AuthorizedLayout requiredPath="/promotion-management" params={{ locale }}>{() => <PartnerDetailPage dictionary={dictionary} locale={locale} partner={partner} error={initialError} />}</AuthorizedLayout>
}

export default PartnerDetailRoute
