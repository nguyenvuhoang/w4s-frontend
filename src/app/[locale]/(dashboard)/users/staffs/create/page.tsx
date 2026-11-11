import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import { generateAuthMetadata } from '@components/layout/AuthLayout'
import { getDictionary } from '@utils/getDictionary'
import type { Metadata } from 'next'

import StaffCreateContent from '@/features/staffs/components/StaffCreateContent'

export const metadata: Metadata = generateAuthMetadata('Create Staff')

const StaffCreatePage = async (props: {
    params: Promise<{ locale: Locale }>
}) => {
    const { locale } = await props.params
    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ])

    return (
        <StaffCreateContent
            dictionary={dictionary}
            session={session}
            locale={locale}
        />
    )
}

export default StaffCreatePage
