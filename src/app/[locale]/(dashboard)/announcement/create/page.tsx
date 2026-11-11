import ResolvedProps from '@/@core/components/ResolvedProps'
import AuthorizedLayout, { generateAuthMetadata } from '@/shared/components/layout/AuthorizedLayout'
import type { Locale } from '@/configs/i18n'
import type { Metadata } from 'next'
import CreateAnnouncementContent from '@/features/announcement/components/CreateAnnouncementContent'
import { announcementText } from '@/features/announcement/components/announcementListHelpers'
import { announcementService } from '@/features/announcement/services/announcementService'
import { getDictionary } from '@/shared/utils/getDictionary'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
    const { locale } = await params
    const dictionary = await getDictionary(locale)

    return generateAuthMetadata(announcementText(dictionary, 'create_title', 'Create Announcement'))
}

const loadInitialData = (sessiontoken?: string, language?: string) => (
    announcementService.loadInitialData({ sessiontoken, language })
)

const CreateAnnouncementPage = async (props: { params: Promise<{ locale: Locale }> }) => {
    const params = await props.params
    // Real backend token, server-only — resolved once here (outside the synchronous render-prop
    // below) since loadInitialData is a genuine server-to-backend call, not a value that ends up
    // in a Client Component prop. p.session (from AuthorizedLayout) stays the safe, browser-shape
    // session throughout.
    const backendToken = await getServerBackendToken()

    return (
        <AuthorizedLayout requiredPath="/announcement" requiredAction="ADD" params={params}>
            {p => (
                <ResolvedProps
                    Component={CreateAnnouncementContent}
                    props={{
                        ...p,
                        initial_data: loadInitialData(backendToken ?? undefined, p.locale) as any
                    }}
                />
            )}
        </AuthorizedLayout>
    )
}

export default CreateAnnouncementPage
