'use client'

import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Alert, Button, Stack, Tooltip, Typography } from '@mui/material'
import { useEffect } from 'react'

import PaginationPage from '@/@core/components/jTable/pagination'

import { useFacilityCategoriesList } from '../hooks/useFacilityCategoriesList'
import type {
    FacilitiesPageProps,
    FacilityCategoriesFilterModel,
    FacilityCategorySearchResponse
} from '../types'
import FacilityCategoriesFilterBar from './facility-list/FacilityCategoriesFilterBar'
import FacilityCategoriesTable from './facility-list/FacilityCategoriesTable'
import FacilityCategoryDetailDialog from './facility-list/FacilityCategoryDetailDialog'
import { commonText, facilitiesText } from './facility-list/facilityListHelpers'

type Props = FacilitiesPageProps & {
    active: boolean
    initial_loaded: boolean
    initial_filter: FacilityCategoriesFilterModel
    initial_data: FacilityCategorySearchResponse
    project_id: number
}

const action_button_sx = {
    minWidth: 116,
    height: 36
}

const FacilityCategoriesListContent = ({
    dictionary,
    session,
    locale,
    active,
    initial_loaded,
    initial_filter,
    initial_data,
    project_id
}: Props) => {
    const categories_list = useFacilityCategoriesList({
        dictionary,
        sessiontoken: session?.user?.token ?? undefined,
        language: locale,
        initial_filter,
        initial_data,
        initial_loaded
    })
    const { draft_filter, ensureLoaded, filter, loadData } = categories_list

    useEffect(() => {
        if (active) ensureLoaded()
    }, [active, ensureLoaded])

    useEffect(() => {
        if (active && project_id > 0 && filter.project_id !== project_id) {
            void loadData({ ...draft_filter, project_id, page_index: 1 })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, project_id])

    return (
        <Stack spacing={3} sx={{ mt: 3 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                <Stack>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#225087' }}>
                        {facilitiesText(dictionary, 'categories_title', 'Facility Categories')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {facilitiesText(dictionary, 'categories_subtitle', 'Manage facility category groups by project.')}
                    </Typography>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" gap={1}>
                    <Tooltip title={facilitiesText(dictionary, 'action_not_available', 'Workflow is not configured yet')}>
                        <span>
                            <Button variant="contained" startIcon={<AddIcon />} disabled sx={action_button_sx}>
                                {commonText(dictionary, 'add', 'Add')}
                            </Button>
                        </span>
                    </Tooltip>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={categories_list.handleRefresh} sx={action_button_sx}>
                        {commonText(dictionary, 'refresh', 'Refresh')}
                    </Button>
                </Stack>
            </Stack>

            <FacilityCategoriesFilterBar
                dictionary={dictionary}
                draft_filter={categories_list.draft_filter}
                on_filter_change={categories_list.updateDraftFilter}
                on_search={categories_list.handleSearch}
                on_reset={categories_list.resetFilter}
            />

            {categories_list.error && (
                <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void categories_list.loadData()}>{commonText(dictionary, 'retry', 'Retry')}</Button>}>
                    {categories_list.error}
                </Alert>
            )}

            <FacilityCategoriesTable
                dictionary={dictionary}
                rows={categories_list.rows}
                loading={categories_list.loading}
                page_index={categories_list.filter.page_index}
                page_size={categories_list.filter.page_size}
                on_view={categories_list.handleViewCategory}
            />

            {categories_list.total_count > 0 && (
                <PaginationPage
                    page={categories_list.filter.page_index}
                    pageSize={categories_list.filter.page_size}
                    totalResults={categories_list.total_count}
                    jumpPage={categories_list.filter.page_index}
                    handlePageSizeChange={categories_list.handlePageSizeChange}
                    handlePageChange={categories_list.handlePageChange}
                    handleJumpPage={categories_list.handleJumpPage}
                    dictionary={dictionary}
                />
            )}

            <FacilityCategoryDetailDialog
                dictionary={dictionary}
                open={categories_list.detail_open}
                loading={categories_list.detail_loading}
                error={categories_list.detail_error}
                detail={categories_list.selected_category}
                on_close={categories_list.closeDetail}
            />
        </Stack>
    )
}

export default FacilityCategoriesListContent
