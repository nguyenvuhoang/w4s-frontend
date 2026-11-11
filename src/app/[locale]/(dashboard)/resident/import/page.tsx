import ResolvedProps from '@/@core/components/ResolvedProps'
import { generateAuthMetadata } from '@components/layout/AuthLayout'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { Locale } from '@/configs/i18n'
import ResidentImportPage from '@/features/resident/components/ResidentImportPage'
import { Metadata } from 'next'

export const metadata: Metadata = generateAuthMetadata('Resident Bulk Import')

const ResidentImportRoutePage = async (props: { params: Promise<{ locale: Locale }> }) => {
    const params = await props.params

    return (
        <AuthorizedLayout
            requiredPath="/resident/import"
            permissionHref="/resident/list"
            requiredAction="IMPORT"
            params={params}
        >
            {(p) => (
                <ResolvedProps
                    Component={ResidentImportPage}
                    props={p}
                />
            )}
        </AuthorizedLayout>
    )
}

export default ResidentImportRoutePage
