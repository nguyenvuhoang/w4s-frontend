import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import { generateAuthMetadata } from '@components/layout/AuthLayout'
import { getDictionary } from '@utils/getDictionary'
import type { Metadata } from 'next'

import StaffDetailContent from '@/features/staffs/components/StaffDetailContent'
import { staffService } from '@/features/staffs/services/staffService'
import type { UserDetailResponse } from '@/features/staffs/types'
import { toClientSessionToken } from '@utils/safeSessionToken'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'

export const metadata: Metadata = generateAuthMetadata('Staff Detail')

const empty_detail: UserDetailResponse = {
    account: null,
    user_roles: [],
    commands: []
}

const StaffDetailPage = async (props: {
    params: Promise<{ locale: Locale; usercode: string }>
}) => {
    const { locale, usercode } = await props.params
    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ])

    let detail = empty_detail
    let error: string | null = null

    try {
        detail = await staffService.get_staff_detail({
            sessiontoken: (await getServerBackendToken()) ?? undefined,
            language: locale,
            usercode: decodeURIComponent(usercode)
        })
    } catch (err) {
        error = err instanceof Error ? err.message : 'Unable to load user detail.'
    }

    return (
        <StaffDetailContent
            dictionary={dictionary}
            locale={locale}
            usercode={decodeURIComponent(usercode)}
            detail={detail}
            sessiontoken={toClientSessionToken(session) ?? ''}
            error={error}
        />
    )
}

export default StaffDetailPage
