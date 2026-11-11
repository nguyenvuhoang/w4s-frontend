import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import { loadFeeManagementInitialData } from '@/features/fees/feeManagementPage.server'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import FeeInvoiceManagementPage from '@/features/fees/FeeInvoiceManagementPage'
import { getDictionary } from '@utils/getDictionary'
import { i18n } from '@/configs/i18n'
import { parseFeeInvoiceFilter, type SearchParams } from '../pageRouteHelpers'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'

type Params = Promise<{
    locale: Locale
}>

export async function generateStaticParams() {
    return i18n.locales.map((l) => ({ locale: l }))
}

const FeeManagementListPage = async ({ params, searchParams }: { params: Params; searchParams?: Promise<SearchParams> }) => {
    const { locale } = await params
    const search_params = await searchParams ?? {}
    const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
    const initialFilter = parseFeeInvoiceFilter(search_params)
    const serverToken = await getServerBackendToken()
    const initial = await loadFeeManagementInitialData({ sessiontoken: serverToken ?? undefined, language: locale, filter: initialFilter })

    return (
        <AuthorizedLayout requiredPath="/fee-management" params={{ locale }}>
            {() => (
                <FeeInvoiceManagementPage
                    dictionary={dictionary}
                    session={session}
                    locale={locale}
                    initialFilter={initialFilter}
                    initialData={initial.invoiceData}
                    initialError={initial.invoiceError}
                    initialPeriods={initial.periods}
                    initialPeriodId={initial.selectedPeriodId}
                    initialOverview={initial.overview}
                    initialOverviewError={initial.overviewError}
                />
            )}
        </AuthorizedLayout>
    )
}

export default FeeManagementListPage
