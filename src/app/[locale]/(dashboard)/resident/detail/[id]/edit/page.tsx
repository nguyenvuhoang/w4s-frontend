import type { Locale } from '@/configs/i18n'
import ResidentEditPage from '@/features/resident/components/ResidentEditPage'
import { residentService } from '@/features/resident/services/residentService'
import type { ResidentContext, ResidentDetail } from '@/features/resident/types'
import AuthorizedLayout, { generateAuthMetadata } from '@components/layout/AuthorizedLayout'
import { getDictionary } from '@utils/getDictionary'
import type { Metadata } from 'next'
import { auth } from '@/auth'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import { getWorkflowErrorPresentation, type WorkflowErrorPresentation } from '@/shared/utils/workflowError'

export const metadata: Metadata = generateAuthMetadata('Resident Edit')

type DataResult<T> = {
    data: T | null
    error: WorkflowErrorPresentation | null
}

type Params = Promise<{ locale: Locale; id: string }>

const ResidentEditRoutePage = async ({ params }: { params: Params }) => {
    const { locale, id } = await params
    const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])

    const residentId = (() => {
        const n = Number(id)

        return Number.isInteger(n) && n > 0 ? n : 0
    })()

    let contextResult: DataResult<ResidentContext> = { data: null, error: null }
    let residentDetailResult: DataResult<ResidentDetail> = { data: null, error: null }

    if (!residentId) {
        contextResult = { data: null, error: { message: 'Invalid resident id.' } }
        residentDetailResult = { data: null, error: { message: 'Invalid resident id.' } }
    } else {
        const token = (await getServerBackendToken()) ?? undefined
        const [contextOutcome, detailOutcome] = await Promise.all([
            residentService.get_resident_context({ sessiontoken: token, language: locale, resident_id: residentId }).then(
                data => ({ data, error: null } as DataResult<ResidentContext>),
                error => ({ data: null, error: getWorkflowErrorPresentation(error, 'Unable to load resident context.') } as DataResult<ResidentContext>)
            ),
            residentService.get_resident_by_id({ sessiontoken: token, language: locale, id: residentId }).then(
                data => ({ data, error: null } as DataResult<ResidentDetail>),
                error => ({ data: null, error: getWorkflowErrorPresentation(error, 'Unable to load resident detail.') } as DataResult<ResidentDetail>)
            )
        ])

        contextResult = contextOutcome
        residentDetailResult = detailOutcome
    }

    return (
        <AuthorizedLayout
            requiredPath="/resident/detail"
            requiredAction="MODIFY"
            params={{ locale }}>
            {() => (
                <ResidentEditPage
                    dictionary={dictionary}
                    locale={locale}
                    sessiontoken={session?.user?.token as string | undefined}
                    residentId={residentId}
                    residentDetail={residentDetailResult.data}
                    detailError={residentDetailResult.error}
                    contextResult={contextResult}
                    residentStatus={residentDetailResult.data?.status ?? null}
                    account={residentDetailResult.data?.account ?? null}
                    accountError={residentDetailResult.error?.message ?? null}
                />
            )}
        </AuthorizedLayout>
    )
}

export default ResidentEditRoutePage
