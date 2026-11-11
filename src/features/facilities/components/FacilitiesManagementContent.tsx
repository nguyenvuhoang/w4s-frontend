'use client'

import ApartmentIcon from '@mui/icons-material/Apartment'
import { Box, Tab, Tabs } from '@mui/material'
import { usePathname, useSearchParams } from 'next/navigation'
import { useRouter } from '@shared/hooks/useRouter'
import type { SyntheticEvent } from 'react'
import { useState } from 'react'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'

import type {
    FacilitiesFilterModel,
    FacilitiesPageProps,
    FacilitiesSearchResponse,
    FacilitiesTabKey,
    FacilityCategoriesFilterModel,
    FacilityCategorySearchResponse
} from '../types'
import FacilitiesListContent from './FacilitiesListContent'
import FacilityCategoriesListContent from './FacilityCategoriesListContent'
import { facilitiesText } from './facility-list/facilityListHelpers'

type Props = FacilitiesPageProps & {
    initial_tab: FacilitiesTabKey
    initial_facilities_filter: FacilitiesFilterModel
    initial_facilities_data: FacilitiesSearchResponse
    initial_facilities_loaded: boolean
    initial_categories_filter: FacilityCategoriesFilterModel
    initial_categories_data: FacilityCategorySearchResponse
    initial_categories_loaded: boolean
}

const FacilitiesManagementContent = ({
    dictionary,
    session,
    locale,
    initial_tab,
    initial_facilities_filter,
    initial_facilities_data,
    initial_facilities_loaded,
    initial_categories_filter,
    initial_categories_data,
    initial_categories_loaded
}: Props) => {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [active_tab, setActiveTab] = useState<FacilitiesTabKey>(initial_tab)
    const working_project = useWorkingProject()
    const sessiontoken = session?.user?.token ?? undefined

    const handleTabChange = (_: SyntheticEvent, value: FacilitiesTabKey) => {
        setActiveTab(value)

        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', value)
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }

    return (
        <ContentWrapper
            title={facilitiesText(dictionary, 'list_title', 'Facilities Management')}
            description={facilitiesText(dictionary, 'page_subtitle', 'Manage facilities and facility category groups by project.')}
            icon={<ApartmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            dictionary={dictionary}
            issearch
        >
            <Box sx={{ mt: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={active_tab} onChange={handleTabChange} aria-label={facilitiesText(dictionary, 'tabs_label', 'Facilities tabs')}>
                    <Tab value="facilities" label={facilitiesText(dictionary, 'facilities_tab', 'Facilities')} />
                    <Tab value="categories" label={facilitiesText(dictionary, 'categories_tab', 'Facility Categories')} />
                </Tabs>
            </Box>

            <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
                <Box role="tabpanel" hidden={active_tab !== 'facilities'}>
                    <FacilitiesListContent
                        dictionary={dictionary}
                        session={session}
                        locale={locale}
                        active={active_tab === 'facilities'}
                        initial_loaded={initial_facilities_loaded}
                        initial_filter={{ ...initial_facilities_filter, project_id: working_project?.id ?? 0 }}
                        initial_data={initial_facilities_data}
                        initial_categories_data={initial_categories_data}
                        project_id={working_project?.id ?? 0}
                    />
                </Box>

                <Box role="tabpanel" hidden={active_tab !== 'categories'}>
                    <FacilityCategoriesListContent
                        dictionary={dictionary}
                        session={session}
                        locale={locale}
                        active={active_tab === 'categories'}
                        initial_loaded={initial_categories_loaded}
                        initial_filter={{ ...initial_categories_filter, project_id: working_project?.id ?? 0 }}
                        initial_data={initial_categories_data}
                        project_id={working_project?.id ?? 0}
                    />
                </Box>
            </RequireWorkingProject>
        </ContentWrapper>
    )
}

export default FacilitiesManagementContent
