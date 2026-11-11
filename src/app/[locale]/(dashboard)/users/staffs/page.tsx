import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import { generateAuthMetadata } from '@components/layout/AuthLayout'
import { getDictionary } from '@utils/getDictionary'
import type { Metadata } from 'next'

import StaffListContent from '@/features/staffs/components/StaffListContent'
import { empty_staff_filter } from '@/features/staffs/components/staff-list/staffListHelpers'
import { staffService } from '@/features/staffs/services/staffService'
import type { StaffFilterModel } from '@/features/staffs/types'

export const metadata: Metadata = generateAuthMetadata('Staff Management')

type SearchParams = Record<string, string | string[] | undefined>

const getSearchValue = (search_params: SearchParams, key: string) => {
    const value = search_params[key]

    return Array.isArray(value) ? value[0] : value
}

const parseStaffFilter = (search_params: SearchParams): StaffFilterModel => {
    const page_index = Number(getSearchValue(search_params, 'page_index'))
    const page_size = Number(getSearchValue(search_params, 'page_size'))
    const status = getSearchValue(search_params, 'status')
    const is_login = getSearchValue(search_params, 'is_login')
    const project_code = getSearchValue(search_params, 'project_code')
    const department_code = getSearchValue(search_params, 'department_code')

    return {
        search_text: getSearchValue(search_params, 'search_text') ?? empty_staff_filter.search_text,
        channel_code: 'BO',
        project_code: project_code?.trim() ?? empty_staff_filter.project_code,
        department_code: department_code?.trim() ?? empty_staff_filter.department_code,
        // Status values are the USER_STATUS CodeList codes (A/B/I/D/…) plus the 'ALL' sentinel;
        // accept any non-empty code so a filtered URL round-trips instead of resetting.
        status: status?.trim() ? status.trim() : empty_staff_filter.status,
        is_login: (['ALL', 'Y', 'N'] as const).includes(is_login as any) ? (is_login as StaffFilterModel['is_login']) : empty_staff_filter.is_login,
        page_index: Number.isFinite(page_index) && page_index > 0 ? page_index : empty_staff_filter.page_index,
        page_size: [5, 10, 20, 50].includes(page_size) ? page_size : empty_staff_filter.page_size
    }
}

const StaffsPage = async (props: {
    params: Promise<{ locale: Locale }>
    searchParams?: Promise<SearchParams>
}) => {
    const { locale } = await props.params
    const search_params = await props.searchParams ?? {}
    const initial_filter = parseStaffFilter(search_params)
    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ])

    // RequireWorkingProject loads the selected project on the client before this list mounts.
    // That preserves the framework's scope header for the first workflow call, while the staff
    // search service independently omits fields.project_code until the screen filter is chosen.
    const initial_data = staffService.get_default_response(initial_filter)

    return (
        <StaffListContent
            dictionary={dictionary}
            session={session}
            locale={locale}
            initial_filter={{ ...initial_filter, page_index: initial_data.page_index, page_size: initial_data.page_size }}
            initial_data={initial_data}
        />
    )
}

export default StaffsPage
