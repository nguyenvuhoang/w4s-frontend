import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import { generateAuthMetadata } from '@components/layout/AuthLayout'
import { getDictionary } from '@utils/getDictionary'
import type { Metadata } from 'next'

import StaffBulkImportPage from '@/features/staffs/components/StaffBulkImportPage'

export const metadata: Metadata = generateAuthMetadata('Add/Update Multiple Staffs')

const StaffBulkImportRoutePage = async (props: { params: Promise<{ locale: Locale }> }) => {
    const { locale } = await props.params
    const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])

    return <StaffBulkImportPage dictionary={dictionary} session={session} locale={locale} />
}

export default StaffBulkImportRoutePage
