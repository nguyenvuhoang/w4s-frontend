import { auth } from '@/auth'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import WaterMeterReadingContent from '@/features/meter-reading/water/components/WaterMeterReadingContent'
import { waterMeterReadingService } from '@/features/meter-reading/water/services/waterMeterReadingService'
import { getDictionary } from '@utils/getDictionary'
import { i18n, Locale } from '@/configs/i18n'
import { parseWaterMeterSearchFilter } from '../../pageRouteHelpers'
import type { SearchParams } from '../../pageRouteHelpers'
import type { WaterMeterSearchResponse } from '@/features/meter-reading/water/types'

export async function generateStaticParams() {
  return i18n.locales.map((l) => ({ locale: l }))
}

const WaterMeterReadingPage = async ({ params, searchParams }: { params: Promise<{ locale: Locale }>; searchParams?: Promise<SearchParams> }) => {
  const { locale } = await params
  const search_params = await searchParams ?? {}
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])

  const initial_filter = parseWaterMeterSearchFilter(search_params)
  const initial_data: WaterMeterSearchResponse = waterMeterReadingService.getDefaultSearchResponse(initial_filter)

  return (
    <AuthorizedLayout requiredPath="/meter-reading/water" params={{ locale }}>
      {() => (
        <WaterMeterReadingContent
          dictionary={dictionary}
          session={session}
          locale={locale}
          initial_filter={initial_filter}
          initial_data={initial_data}
        />
      )}
    </AuthorizedLayout>
  )
}

export default WaterMeterReadingPage
