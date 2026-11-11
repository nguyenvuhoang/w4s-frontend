import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import FeeTypeDetailPage from '@/features/fees/FeeTypeDetailPage'
import { feeText } from '@/features/fees/components/feeTypeHelpers'
import { SETTINGS_FEE_TYPE_ROUTES } from '@/features/fees/feeTypeRoutes'
import { feeService } from '@/features/fees/service'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import { getDictionary } from '@utils/getDictionary'
import { toClientSessionToken } from '@utils/safeSessionToken'
import logger from '@lib/logger'

type Params = Promise<{
  locale: Locale
  id: string
}>

const SettingsFeeTypeDetailPage = async ({ params }: { params: Params }) => {
  const { locale, id } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  let detail = null
  let initialError: string | null = null

  try {
    detail = await feeService.getFeeTypeById({
      sessiontoken: (await getServerBackendToken()) ?? undefined,
      language: locale,
      id: Number(id)
    })
  } catch (error) {
    initialError = error instanceof Error ? error.message : feeText(dictionary, 'fee_type_detail_load_failed', 'Unable to load fee type detail.')
    logger.error('[fee-settings] Unable to load fee type detail', error)
  }

  return (
    <FeeTypeDetailPage
      dictionary={dictionary}
      locale={locale}
      sessiontoken={toClientSessionToken(session) ?? ''}
      feeType={detail}
      error={initialError}
      routes={SETTINGS_FEE_TYPE_ROUTES}
    />
  )
}

export default SettingsFeeTypeDetailPage
