'use client'

import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import { useRouter } from '@shared/hooks/useRouter'

import PaginationPage from '@/@core/components/jTable/pagination'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { resolveRowInteractionMode, RowInteractionTip } from '@/shared/components/table'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import { usePermission } from '@shared/permissions/usePermission'
import SwalAlert from '@shared/utils/SwalAlert'

import { useResidentList } from '../hooks/useResidentList'
import type { ResidentFilterModel, ResidentListResponse } from '../types'
import ResidentFilterBar from './resident-list/ResidentFilterBar'
import ResidentListTour from './resident-list/ResidentListTour'
import {
    commonText,
    residentText,
    type ResidentDictionary
} from './resident-list/residentListHelpers'
import ResidentSummaryBar from './resident-list/ResidentSummaryBar'
import ResidentTable from './resident-list/ResidentTable'

type Props = {
    dictionary: ResidentDictionary
    session?: any
    locale?: any
    initial_filter: ResidentFilterModel
    initial_data: ResidentListResponse
    initial_residents_error?: string | null
}

const ResidentListContent = ({
    dictionary,
    session,
    locale,
    initial_filter,
    initial_data,
    initial_residents_error = null
}: Props) => {
    const router = useRouter()
    const sessiontoken = session?.user?.token ?? undefined
    const permission = usePermission({ href: '/resident/list' })
    const resident_list = useResidentList({
        dictionary,
        sessiontoken,
        language: locale,
        initial_filter,
        initial_data,
        initial_residents_error
    })
    const selectedProject = resident_list.selectedProject

    const handleAddResident = () => {
        if (!selectedProject) return

        if (!permission.canAdd) {
            SwalAlert('warning', dictionary['common'].nopermissionview, 'center')

            return
        }

        const createPath = locale ? `/${locale}/resident/create` : '/resident/create'

        router.push(`${createPath}?project_id=${selectedProject.id}`)
    }

    const handleOpenResidentDetail = (rowId?: number | null) => {
        if (!rowId) return

        const detailPath = locale ? `/${locale}/resident/detail/${rowId}` : `/resident/detail/${rowId}`

        router.push(detailPath)
    }

    return (
        <ContentWrapper
            title={residentText(dictionary, 'list_title', 'Danh sách cư dân')}
            description={residentText(dictionary, 'list_subtitle', 'Chọn dự án để xem cư dân, chủ hộ, người thuê và thành viên trong từng căn hộ.')}
            icon={<PeopleAltIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            dictionary={dictionary}
            issearch
            actions={
                <ResidentListTour
                    dictionary={dictionary}
                    userCode={session?.user?.email}
                    canAddResident={permission.resolved && permission.canAdd}
                    permissionResolved={permission.resolved}
                    hasSelectedProject={Boolean(selectedProject)}
                    isLoading={resident_list.loadingResidents}
                />
            }
        >
            <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
                {selectedProject && (
                    <Stack spacing={3} sx={{ mt: 3 }}>
                        <ResidentSummaryBar
                            dictionary={dictionary}
                            total_residents={resident_list.total_items}
                            page_index={resident_list.filter.page_index}
                            total_pages={resident_list.total_pages}
                            on_add={handleAddResident}
                            add_disabled={!selectedProject}
                            on_export={() => void resident_list.handleExport()}
                            export_disabled={!selectedProject}
                            exporting={resident_list.exporting}
                        />

                        <ResidentFilterBar
                            dictionary={dictionary}
                            language={locale}
                            draft_filter={resident_list.draft_filter}
                            building_options={resident_list.building_options}
                            building_options_loading={resident_list.buildingOptionsLoading}
                            on_filter_change={resident_list.updateDraftFilter}
                            on_select_filter_change={resident_list.handleFilterSelectChange}
                            on_search={resident_list.handleSearch}
                            on_reset={resident_list.resetFilter}
                        />

                        <RowInteractionTip mode={resolveRowInteractionMode()} dictionary={dictionary} />

                        {resident_list.error && (
                            <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void resident_list.loadData()}>{commonText(dictionary, 'retry', 'Thử lại')}</Button>}>
                                {resident_list.error}
                            </Alert>
                        )}

                        <Box data-tour="resident-table">
                            <ResidentTable
                                dictionary={dictionary}
                                locale={locale}
                                rows={resident_list.rows}
                                loading={resident_list.loadingResidents}
                                page_size={resident_list.filter.page_size}
                                on_row_double_click={row => handleOpenResidentDetail(row.id)}
                                emptyTitle={residentText(dictionary, 'empty_residents_title', 'Không có cư dân')}
                                emptyDescription={residentText(dictionary, 'empty_residents_description', 'Dự án này chưa có dữ liệu cư dân.')}
                            />
                        </Box>

                        {resident_list.total_items > 0 && (
                            <PaginationPage
                                page={resident_list.filter.page_index}
                                pageSize={resident_list.filter.page_size}
                                totalResults={resident_list.total_items}
                                jumpPage={resident_list.filter.page_index}
                                handlePageSizeChange={resident_list.handlePageSizeChange}
                                handlePageChange={resident_list.handlePageChange}
                                handleJumpPage={resident_list.handleJumpPage}
                                dictionary={dictionary}
                            />
                        )}
                    </Stack>
                )}
            </RequireWorkingProject>
        </ContentWrapper>
    )
}

export default ResidentListContent
