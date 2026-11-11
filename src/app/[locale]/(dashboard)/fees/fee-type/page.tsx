import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import { feeService } from '@/features/fees/service'
import type { FeeWorkflowError } from '@/features/fees/types'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import FeeManagementPage from '@/features/fees/FeeManagementPage'
import { getDictionary } from '@utils/getDictionary'
import { i18n } from '@/configs/i18n'
import { normalizeWorkflowErrorDetail } from '@/shared/utils/workflowError'
import { parseFeeTypeFilter, type SearchParams } from '../../pageRouteHelpers'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import logger from '@lib/logger'

type Params = Promise<{
    locale: Locale
}>

export async function generateStaticParams() {
    return i18n.locales.map((l) => ({ locale: l }))
}

const FeeTypePage = async ({ params, searchParams }: { params: Params; searchParams?: Promise<SearchParams> }) => {
    const { locale } = await params
    const search_params = await searchParams ?? {}
    const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
    const initialFilter = parseFeeTypeFilter(search_params)
    let initialData = feeService.getDefaultFeeTypeResponse(initialFilter)
    let initialError: FeeWorkflowError | null = null

    try {
        initialData = await feeService.simpleSearchFeeTypes({
            sessiontoken: (await getServerBackendToken()) ?? undefined,
            language: locale,
            filter: initialFilter
        })
    } catch (error) {
        initialError = normalizeWorkflowErrorDetail(error, {
            fallback: 'Unable to load fee types.'
        })
        logger.error('[fee-types] Unable to load initial data', error)
    }

    return (
        <AuthorizedLayout requiredPath="/fees/fee-type" params={{ locale }}>
            {() => (
                <FeeManagementPage
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

export default FeeTypePage
