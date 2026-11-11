'use client'

import AddIcon from '@mui/icons-material/Add'
import { Alert, Button, Stack, Typography } from '@mui/material'
import { useRouter } from '@shared/hooks/useRouter'
import { useEffect } from 'react'

import PaginationPage from '@/@core/components/jTable/pagination'
import { PermissionGuard } from '@shared/permissions/PermissionGuard'

import { useFacilitiesList } from '../hooks/useFacilitiesList'
import type {
    FacilitiesFilterModel,
    FacilitiesPageProps,
    FacilitiesSearchResponse,
    FacilityCategorySearchResponse,
    FacilityItem
} from '../types'
import FacilitiesFilterBar from './facility-list/FacilitiesFilterBar'
import FacilitiesTable from './facility-list/FacilitiesTable'
import { commonText, facilitiesText } from './facility-list/facilityListHelpers'

type Props = FacilitiesPageProps & {
    active: boolean
    initial_loaded: boolean
    initial_filter: FacilitiesFilterModel
    initial_data: FacilitiesSearchResponse
    initial_categories_data?: FacilityCategorySearchResponse
    project_id: number
}

const FacilitiesListContent = ({
    dictionary,
    session,
    locale,
    active,
    initial_loaded,
    initial_filter,
    initial_data,
    initial_categories_data,
    project_id
}: Props) => {
    const router = useRouter()
    const facilities_list = useFacilitiesList({
        dictionary,
        sessiontoken: session?.user?.token ?? undefined,
        language: locale,
        initial_filter,
        initial_data,
        initial_category_options: initial_categories_data?.items ?? [],
        initial_loaded
    })
    const {
        categories_project_id,
        draft_filter,
        ensureLoaded,
        filter: facilities_filter,
        loadCategoryOptions,
        loadData
    } = facilities_list

    useEffect(() => {
        if (active) ensureLoaded()
    }, [active, ensureLoaded])

    useEffect(() => {
        if (active && project_id > 0 && facilities_filter.project_id !== project_id) {
            void loadData({ ...draft_filter, project_id, page_index: 1 })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, project_id])

    useEffect(() => {
        if (active && project_id > 0 && categories_project_id !== project_id) {
            void loadCategoryOptions(project_id)
        }
    }, [active, categories_project_id, project_id, loadCategoryOptions])

    const handleAddFacility = () => {
        router.push(`/${locale}/facilities/facilities/create`)
    }

    const handleRowOpen = (row: FacilityItem) => {
        if (!row.id) return

        const search_params = new URLSearchParams({
            project_id: String(row.project_id),
            code: row.facility_code
        })

        router.push(`/${locale}/facilities/facilities/${row.id}?${search_params.toString()}`)
    }

    return (
        <Stack spacing={3} sx={{ mt: 3 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} gap={2}>
                <Stack>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#225087' }}>
                        {facilitiesText(dictionary, 'facilities_title', 'Facilities')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {facilitiesText(dictionary, 'list_subtitle', 'Manage facilities belonging to the project.')}
                    </Typography>
                </Stack>

                <PermissionGuard href="/facilities/facilities" action="ADD">
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddFacility}
                        sx={{ alignSelf: { xs: 'stretch', md: 'center' } }}
                    >
                        {facilitiesText(dictionary, 'add_facility', 'Add Facility')}
                    </Button>
                </PermissionGuard>
            </Stack>

            <FacilitiesFilterBar
                dictionary={dictionary}
                draft_filter={facilities_list.draft_filter}
                on_filter_change={facilities_list.updateDraftFilter}
                on_search={facilities_list.handleSearch}
                on_reset={facilities_list.resetFilter}
            />

            {facilities_list.error && (
                <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void facilities_list.loadData()}>{commonText(dictionary, 'retry', 'Retry')}</Button>}>
                    {facilities_list.error}
                </Alert>
            )}

            <FacilitiesTable
                dictionary={dictionary}
                locale={locale}
                rows={facilities_list.rows}
                category_options={facilities_list.category_options}
                loading={facilities_list.loading}
                page_index={facilities_list.filter.page_index}
                page_size={facilities_list.filter.page_size}
                on_row_open={handleRowOpen}
            />

            {facilities_list.total_count > 0 && (
                <PaginationPage
                    page={facilities_list.filter.page_index}
                    pageSize={facilities_list.filter.page_size}
                    totalResults={facilities_list.total_count}
                    jumpPage={facilities_list.filter.page_index}
                    handlePageSizeChange={facilities_list.handlePageSizeChange}
                    handlePageChange={facilities_list.handlePageChange}
                    handleJumpPage={facilities_list.handleJumpPage}
                    dictionary={dictionary}
                />
            )}
        </Stack>
    )
}

export default FacilitiesListContent
