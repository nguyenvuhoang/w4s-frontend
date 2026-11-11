import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import FeeDetailViewPage from '@/features/fees/FeeDetailViewPage'
import { feeService } from '@/features/fees/service'
import type { FeeWorkflowError } from '@/features/fees/types'
import { getDictionary } from '@utils/getDictionary'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { normalizeWorkflowErrorDetail } from '@/shared/utils/workflowError'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import logger from '@lib/logger'

type Params = Promise<{
  locale: Locale
  id: string
}>

const FeeManagementDetailRoute = async ({ params }: { params: Params }) => {
  const { locale, id } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const feeDetailId = Number(id)
  const isValidId = Number.isInteger(feeDetailId) && feeDetailId > 0
  let detail = null
  let initialError: FeeWorkflowError | null = null

  if (isValidId) {
    try {
      detail = await feeService.getFeeDetailById({
        sessiontoken: (await getServerBackendToken()) ?? undefined,
        language: locale,
        id: feeDetailId
      })
    } catch (error) {
      initialError = normalizeWorkflowErrorDetail(error, {
        fallback: 'Unable to load fee detail.'
      })
      logger.error('[fee-management] Unable to load detail', error)
    }
  }

  return (
    <AuthorizedLayout requiredPath="/fee-management" params={{ locale }}>
      {() => (
        <FeeDetailViewPage
          dictionary={dictionary}
          locale={locale}
          id={isValidId ? feeDetailId : 0}
          detail={detail}
          error={initialError}
          sessiontoken={session?.user?.token ?? undefined}
        />
      )}
    </AuthorizedLayout>
  )
}

export default FeeManagementDetailRoute
