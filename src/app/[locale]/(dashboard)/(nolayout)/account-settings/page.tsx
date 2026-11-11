import { auth } from '@/auth'
import Spinner from '@components/spinners'
import { Locale } from '@/configs/i18n'
import { getStaffAvatarUrl, staffService } from '@features/staffs/services/staffService'
import { userSessionService } from '@features/user/services/userSessionService'
import type { UserSessionFilterModel } from '@features/user/types'
import { getDictionary } from '@utils/getDictionary'
import AccountSettingContent from '@/views/nolayout/account-settings/account-setting-content'
import Logout from '@features/auth/hooks/useLogout'
import { Suspense } from 'react'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import { toClientSessionToken } from '@utils/safeSessionToken'

type Params = Promise<{
    locale: Locale
}>

const AccountSettingPage = async ({ params }: { params: Params }) => {
    const { locale } = await params

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    if (!session) {
        return <Logout locale={locale} dictionary={dictionary} />;
    }

    // Real backend token, server-only — never pass this into a Client Component prop (it's not
    // sent to the browser via session/auth() itself, but a raw prop assignment here would leak
    // it through the RSC payload). Use clientSessionToken below for anything JSX-facing.
    const token = (await getServerBackendToken()) ?? undefined
    const clientSessionToken = toClientSessionToken(session) ?? ''
    // Already decoded server-side in the session() callback (src/auth.ts) — no need to
    // jwt.decode() the real token again just to read usercode.
    const usercode = session?.user?.usercode ?? undefined

    let account = null as Awaited<ReturnType<typeof staffService.get_staff_detail>>['account']
    let avatarUrl = ''
    let roles: Awaited<ReturnType<typeof staffService.get_staff_detail>>['user_roles'] = []
    let profileError: string | null = null

    if (!usercode) {
        profileError = dictionary['staffs']?.detail_empty ?? 'Unable to determine the current user code.'
    } else {
        try {
            const detail = await staffService.get_staff_detail({
                sessiontoken: token,
                language: locale,
                usercode
            })

            account = detail.account
            avatarUrl = getStaffAvatarUrl(detail)
            roles = detail.user_roles

            if (!account) {
                profileError = dictionary['staffs']?.detail_empty ?? 'User detail not found.'
            }
        } catch (error) {
            profileError = error instanceof Error ? error.message : 'Unable to load user detail.'
        }
    }

    if (profileError) {
        return (
            <AccountSettingContent
                account={null}
                avatarUrl=''
                roles={[]}
                sessions={userSessionService.getDefaultSearchResponse()}
                sessionsFilter={{ search_text: usercode ?? '', channel_code: 'BO', page_index: 1, page_size: 10 }}
                sessionsError={null}
                sessiontoken={clientSessionToken}
                dictionary={dictionary}
                locale={locale}
                session={session}
                error={profileError}
            />
        )
    }

    const sessionsFilter: UserSessionFilterModel = {
        search_text: usercode as string,
        channel_code: 'BO',
        page_index: 1,
        page_size: 10
    }

    let sessions = userSessionService.getDefaultSearchResponse(sessionsFilter)
    let sessionsError: string | null = null

    try {
        sessions = await userSessionService.searchUserSessions({
            sessiontoken: token,
            language: locale,
            filter: sessionsFilter
        })
    } catch (error) {
        sessionsError = error instanceof Error ? error.message : 'Unable to load session activity.'
    }

    return (
        <Suspense fallback={<Spinner />}>
            <AccountSettingContent
                account={account}
                avatarUrl={avatarUrl}
                roles={roles}
                sessions={sessions}
                sessionsFilter={sessionsFilter}
                sessionsError={sessionsError}
                sessiontoken={clientSessionToken}
                dictionary={dictionary}
                locale={locale}
                session={session}
                error={null}
            />
        </Suspense>
    )
}

export default AccountSettingPage
