import ResolvedProps from '@/@core/components/ResolvedProps'
import { generateAuthMetadata } from '@components/layout/AuthLayout'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { Locale } from '@/configs/i18n'
import { Metadata } from 'next'
import CreateResidentProfileContent from '@/features/resident/components/CreateResidentProfileContent'

export const metadata: Metadata = generateAuthMetadata('Create Resident Profile')

const CreateResidentProfilePage = async (props: { params: Promise<{ locale: Locale }> }) => {
    const params = await props.params

    return (
        <AuthorizedLayout
            requiredPath="/resident/create"
            permissionHref="/resident/list"
            requiredAction="ADD"
            params={params}
            unauthorizedBehavior='forbidden'
        >
            {(p) => (
                <ResolvedProps
                    Component={CreateResidentProfileContent}
                    props={p}
                />
            )}
        </AuthorizedLayout>
    )
}

export default CreateResidentProfilePage
