import { auth } from '@/auth'
import { i18n, Locale } from '@/configs/i18n'
import VendorsContent from '@/features/contracts/components/VendorsContent'
import { vendorService } from '@/features/contracts/services/vendorService'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { getDictionary } from '@utils/getDictionary'

import { parseVendorsFilter } from '../../pageRouteHelpers'
import type { SearchParams } from '../../pageRouteHelpers'

export async function generateStaticParams() {
  return i18n.locales.map((l) => ({ locale: l }))
}

const VendorsPage = async ({ params, searchParams }: { params: Promise<{ locale: Locale }>; searchParams?: Promise<SearchParams> }) => {
  const { locale } = await params
  const search_params = await searchParams ?? {}
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const initialFilter = parseVendorsFilter(search_params)
  const initialData = vendorService.getDefaultResponse(initialFilter)

  return (
    <AuthorizedLayout requiredPath="/contracts/company" params={{ locale }}>
      {() => (
        <VendorsContent
          dictionary={dictionary}
          session={session}
          locale={locale}
          initialFilter={initialFilter}
          initialData={initialData}
        />
      )}
    </AuthorizedLayout>
  )
}

export default VendorsPage
