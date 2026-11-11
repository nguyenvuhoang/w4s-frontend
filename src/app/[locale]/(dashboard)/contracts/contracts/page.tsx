import { auth } from '@/auth'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import ContractsContent from '@/features/contracts/components/ContractsContent'
import { contractService } from '@/features/contracts/services/contractService'
import { getDictionary } from '@utils/getDictionary'
import { i18n, Locale } from '@/configs/i18n'
import { parseContractsFilter } from '../../pageRouteHelpers'
import type { SearchParams } from '../../pageRouteHelpers'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import logger from '@lib/logger'

export async function generateStaticParams() {
  return i18n.locales.map((l) => ({ locale: l }))
}

const ContractsPage = async ({ params, searchParams }: { params: Promise<{ locale: Locale }>; searchParams?: Promise<SearchParams> }) => {
  const { locale } = await params
  const search_params = await searchParams ?? {}
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const initialFilter = parseContractsFilter(search_params)

  let initialData = contractService.getDefaultResponse(initialFilter)
  let initialError: string | null = null

  try {
    initialData = await contractService.simpleSearchContracts({
      sessiontoken: (await getServerBackendToken()) ?? undefined,
      language: locale,
      filter: initialFilter
    })
  } catch (error) {
    initialError = error instanceof Error
      ? error.message
      : dictionary.contracts?.load_failed ?? dictionary.common?.servererror
    logger.error('[contracts] Unable to load initial data', error)
  }

  return (
    <AuthorizedLayout requiredPath="/contracts/contracts" params={{ locale }}>
      {() => (
        <ContractsContent
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
        />
      )}
    </AuthorizedLayout>
  )
}

export default ContractsPage
