import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import { feeText } from '@/features/fees/components/feeTypeHelpers'
import FeeTypeEditPage from '@/features/fees/FeeTypeEditPage'
import { feeService } from '@/features/fees/service'
import { getDictionary } from '@utils/getDictionary'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { toClientSessionToken } from '@utils/safeSessionToken'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import logger from '@lib/logger'

type Params = Promise<{
  locale: Locale
  id: string
}>

const FeeTypeEditRoute = async ({ params }: { params: Params }) => {
  const { locale, id } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const feeTypeId = Number(id)
  let detail = null
  let initialError: string | null = null

  try {
    detail = await feeService.getFeeTypeById({
      sessiontoken: (await getServerBackendToken()) ?? undefined,
      language: locale,
      id: feeTypeId
    })
  } catch (error) {
    initialError = error instanceof Error ? error.message : feeText(dictionary, 'fee_type_detail_load_failed', 'Unable to load fee type detail.')
    logger.error('[fee-types] Unable to load edit detail', error)
  }

  return (
    <AuthorizedLayout requiredPath="/fees/fee-type" requiredAction="MODIFY" params={{ locale }}>
      {() => (
        <FeeTypeEditPage
          dictionary={dictionary}
          locale={locale}
          sessiontoken={toClientSessionToken(session) ?? ''}
          feeType={detail}
          error={initialError}
        />
      )}
    </AuthorizedLayout>
  )
}

export default FeeTypeEditRoute
