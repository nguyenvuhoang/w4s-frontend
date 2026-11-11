import ResolvedProps from '@/@core/components/ResolvedProps'
import { Locale, i18n } from '@/configs/i18n'
import { generateAuthMetadata } from '@components/layout/AuthLayout'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { Metadata } from 'next'

import ResidentListContent from '@/features/resident/components/ResidentListContent'
import {
    empty_resident_filter,
    normalizeResidentAppUsageFilter
} from '@/features/resident/components/resident-list/residentListHelpers'
import { residentService } from '@/features/resident/services/residentService'
import type { Gender, ResidentFilterModel, ResidentListResponse, ResidentListStatus } from '@/features/resident/types'

export const metadata: Metadata = generateAuthMetadata('Resident List')

type SearchParams = Record<string, string | string[] | undefined>

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ locale }))
}

const getSearchValue = (search_params: SearchParams, key: string) => {
    const value = search_params[key]

    return Array.isArray(value) ? value[0] : value
}

const parseResidentFilter = (search_params: SearchParams): ResidentFilterModel => {
    const status = getSearchValue(search_params, 'status')
    const gender = getSearchValue(search_params, 'gender')
    const role = getSearchValue(search_params, 'role')
    const app_usage = getSearchValue(search_params, 'app_usage')
    const page_index = Number(getSearchValue(search_params, 'page_index'))
    const page_size = Number(getSearchValue(search_params, 'page_size'))

    return {
        keyword: getSearchValue(search_params, 'keyword') ?? empty_resident_filter.keyword,
        status: status === 'A' || status === 'I' || status === 'L' ? status as ResidentListStatus : empty_resident_filter.status,
        gender: gender === 'M' || gender === 'F' || gender === 'O' ? gender as Gender : empty_resident_filter.gender,
        role: role ?? empty_resident_filter.role,
        app_usage: normalizeResidentAppUsageFilter(app_usage),
        project_id: empty_resident_filter.project_id,
        building_id: empty_resident_filter.building_id,
        page_index: Number.isFinite(page_index) && page_index > 0 ? page_index : empty_resident_filter.page_index,
        page_size: [10, 20, 50].includes(page_size) ? page_size : empty_resident_filter.page_size
    }
}

const ResidentListPage = async (props: {
    params: Promise<{ locale: Locale }>
    searchParams?: Promise<SearchParams>
}) => {
    const params = await props.params
    const search_params = await props.searchParams ?? {}
    const initial_filter = parseResidentFilter(search_params)
    const initial_data: ResidentListResponse = residentService.getDefaultResidentResponse(initial_filter)

    return (
        <AuthorizedLayout requiredPath="/resident/list" params={params}>
            {(p) => (
                <ResolvedProps
                    Component={ResidentListContent}
                    props={{
                        ...p,
                        initial_filter,
                        initial_data
                    }}
                />
            )}
        </AuthorizedLayout>
    )
}

export default ResidentListPage
