import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import VendorEditPage from '@/features/contracts/VendorEditPage'
import { formatVendorError, vendorsText } from '@/features/contracts/components/vendorHelpers'
import { vendorService } from '@/features/contracts/services/vendorService'
import type { VendorItem } from '@/features/contracts/vendorTypes'
import { VendorWorkflowError } from '@/features/contracts/vendorTypes'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { getDictionary } from '@utils/getDictionary'
import { toClientSessionToken } from '@utils/safeSessionToken'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import logger from '@lib/logger'

type Params = Promise<{
  locale: Locale
  id: string
}>

const VendorEditRoute = async ({ params }: { params: Params }) => {
  const { locale, id } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const vendorId = Number(id)
  const resolvedVendorId = Number.isInteger(vendorId) && vendorId > 0 ? vendorId : 0
  let vendor: VendorItem | null = null
  let initialError: string | null = null

  if (!resolvedVendorId) {
    initialError = vendorsText(dictionary, 'vendor_detail_not_found', 'Vendor detail was not found.')
  } else {
    try {
      vendor = await vendorService.getVendorById({
        sessiontoken: (await getServerBackendToken()) ?? undefined,
        language: locale,
        id: resolvedVendorId
      })
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : vendorsText(dictionary, 'vendor_detail_load_failed', 'Unable to load vendor detail.')
      const execution_id = error instanceof VendorWorkflowError ? error.execution_id : undefined

      initialError = formatVendorError(dictionary, message, execution_id)
      logger.error('[vendors] Unable to load edit detail', error)
    }
  }

  return (
    <AuthorizedLayout requiredPath="/contracts/company" requiredAction="MODIFY" params={{ locale }}>
      {() => (
        <VendorEditPage
          dictionary={dictionary}
          locale={locale}
          sessiontoken={toClientSessionToken(session) ?? ''}
          vendor={vendor}
          error={initialError}
        />
      )}
    </AuthorizedLayout>
  )
}

export default VendorEditRoute
