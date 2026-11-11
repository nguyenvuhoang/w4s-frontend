'use client'

import { useCallback, useEffect } from 'react'

import GroupIcon from '@mui/icons-material/Group'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined'
import { Alert, Button, CircularProgress, Stack } from '@mui/material'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@shared/hooks/useRouter'

import PaginationPage from '@/@core/components/jTable/pagination'
import { useMenuScope, useWorkingProjectIsSuperAdmin } from '@/@core/stores/useWorkingProjectStore'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import { resolveRowInteractionMode } from '@/shared/components/table'
import RowInteractionTip from '@/shared/components/table/RowInteractionTip'

import { useStaffList } from '../hooks/useStaffList'
import { useStaffRowActions } from '../hooks/useStaffRowActions'
import type { StaffFilterModel, StaffListResponse, StaffPageProps } from '../types'
import StaffFilterBar from './staff-list/StaffFilterBar'
import { commonText, staffText } from './staff-list/staffListHelpers'
import StaffTable from './staff-list/StaffTable'
import StaffChangePasswordDialog from './StaffChangePasswordDialog'
import StaffDeleteDialog from './StaffDeleteDialog'
import StaffModifyDialog from './StaffModifyDialog'
import { getStaffBulkImportHref } from '../utils/staffRoutes'

type Props = StaffPageProps & {
    initial_filter: StaffFilterModel
    initial_data: StaffListResponse
    route_base?: string
    empty_filter?: StaffFilterModel
    text_namespace?: 'staffs' | 'residents_tenants'
    show_create_action?: boolean
}

// This component only mounts after RequireWorkingProject renders its children. It is therefore
// safe to start the list request here: the framework scope header is already synchronized, but
// the working project is never copied to the workflow's fields.project_code.
const StaffListInitialLoader = ({ load_data }: {
    load_data: (filter?: StaffFilterModel) => Promise<void>
}) => {
    const scope = useMenuScope()

    useEffect(() => {
        if (scope === null) return

        void load_data()
        // Reload when the scope changes, never by injecting its value into the search fields.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scope])

    return null
}

const StaffListContent = ({
    dictionary,
    session,
    locale,
    initial_filter,
    initial_data,
    route_base = '/users/staffs',
    empty_filter,
    text_namespace = 'staffs',
    show_create_action = true
}: Props) => {
    const router = useRouter()
    const search_params = useSearchParams()
    const list_query = search_params.toString()
    const sessiontoken = session?.user?.token ?? undefined
    // Staff management moved out of the old top-menu (entry point is now the Quan ly nhan su
    // card in System Settings). ADD/MODIFY here intentionally no longer depend on the retired
    // menu's usercommand tree — see StaffDetailContent's MODIFY gate for the matching change.
    const isSuperAdmin = useWorkingProjectIsSuperAdmin()
    const staff_list = useStaffList({
        dictionary,
        sessiontoken,
        language: locale,
        initial_filter,
        initial_data,
        empty_filter,
        text_namespace
    })

    const handleViewDetail = useCallback((row: StaffListResponse['items'][number]) => {
        const usercode = row.user_code || row.user_id

        if (usercode) router.push(`/${locale}${route_base}/${encodeURIComponent(usercode)}${list_query ? `?${list_query}` : ''}`)
    }, [router, locale, route_base, list_query])

    // Same isSuperAdmin gate StaffDetailContent already uses for Modify/Delete/Status toggle —
    // resolved once here, centrally, and reused for every row in the list.
    const row_actions = useStaffRowActions({
        dictionary,
        locale,
        sessiontoken,
        text_namespace,
        canModify: isSuperAdmin,
        onNavigateToDetail: handleViewDetail,
        onOpenModify: (row, status) => void staff_list.openModifyDialog(row, status),
        onReloaded: () => staff_list.loadData()
    })

    const handleOpenCreate = useCallback(() => {
        router.push(`/${locale}${route_base}/create${list_query ? `?${list_query}` : ''}`)
    }, [router, locale, route_base, list_query])

    const handleOpenBulkImport = useCallback(() => {
        router.push(getStaffBulkImportHref(locale, route_base, list_query))
    }, [router, locale, route_base, list_query])

    const listBody = (
        <Stack spacing={3} sx={{ mt: 3 }}>
            <StaffListInitialLoader load_data={staff_list.loadData} />
            {show_create_action && (
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" gap={1} flexWrap="wrap">
                    {isSuperAdmin && (
                        <>
                            <Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />} onClick={() => void staff_list.handleExport()} disabled={staff_list.exporting}>
                                {staff_list.exporting ? <CircularProgress size={16} color="inherit" /> : staffText(dictionary, 'action_export', 'Export staff list', text_namespace)}
                            </Button>
                            <Button variant="outlined" startIcon={<GroupAddOutlinedIcon />} onClick={handleOpenBulkImport}>
                                {staffText(dictionary, 'action_bulk_import_staff', 'Thêm/Cập nhật nhiều nhân viên', text_namespace)}
                            </Button>
                            <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleOpenCreate}>
                                {staffText(dictionary, 'action_create', 'Create user', text_namespace)}
                            </Button>
                        </>
                    )}
                </Stack>
            )}

            <StaffFilterBar
                dictionary={dictionary}
                draft_filter={staff_list.draft_filter}
                text_namespace={text_namespace}
                sessiontoken={sessiontoken}
                language={locale}
                on_filter_change={staff_list.updateDraftFilter}
                on_select_filter_change={staff_list.handleFilterSelectChange}
                on_search={staff_list.handleSearch}
                on_reset={staff_list.resetFilter}
            />

            {staff_list.error && (
                <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void staff_list.loadData()}>{commonText(dictionary, 'retry', 'Retry')}</Button>}>
                    {staff_list.error}
                </Alert>
            )}

            <RowInteractionTip mode={resolveRowInteractionMode()} dictionary={dictionary} />

            <StaffTable
                dictionary={dictionary}
                rows={staff_list.rows}
                loading={staff_list.loading}
                page_size={staff_list.filter.page_size}
                text_namespace={text_namespace}
                selected_id={staff_list.selected_staff?.id}
                on_select={staff_list.selectStaff}
                on_view_detail={handleViewDetail}
                row_actions={row_actions.getRowActions}
            />

            {staff_list.total_count > 0 && (
                <PaginationPage
                    page={staff_list.filter.page_index}
                    pageSize={staff_list.filter.page_size}
                    totalResults={staff_list.total_count}
                    jumpPage={staff_list.filter.page_index}
                    handlePageSizeChange={staff_list.handlePageSizeChange}
                    handlePageChange={staff_list.handlePageChange}
                    handleJumpPage={staff_list.handleJumpPage}
                    dictionary={dictionary}
                />
            )}
        </Stack>
    )

    return (
        <ContentWrapper
            title={staffText(dictionary, 'list_title', 'Staff management', text_namespace)}
            description={staffText(dictionary, 'list_subtitle', 'Search and manage BO users and staff accounts.', text_namespace)}
            icon={<GroupIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            dictionary={dictionary}
            issearch
        >
            <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
                {listBody}
            </RequireWorkingProject>

            <StaffModifyDialog
                dictionary={dictionary}
                locale={locale}
                open={staff_list.modify_open}
                form_values={staff_list.modify_form}
                form_errors={staff_list.modify_errors}
                modal_error={staff_list.modify_modal_error}
                saving={staff_list.saving_modify}
                on_close={() => void staff_list.cancelModifyDialog()}
                on_save={() => void staff_list.handleModify()}
                on_update_form={staff_list.updateModifyForm} on_update_avatar_file={function (file: File | null): void {
                    throw new Error('Function not implemented.')
                } }            />

            <StaffChangePasswordDialog
                dictionary={dictionary}
                open={row_actions.password_dialog_open}
                loading={row_actions.changingPassword}
                error={row_actions.passwordError}
                target_label={row_actions.password_target_label}
                on_close={row_actions.closeChangePasswordDialog}
                on_confirm={password => void row_actions.confirmChangePassword(password)}
            />

            <StaffDeleteDialog
                dictionary={dictionary}
                open={row_actions.delete_dialog_open}
                loading={row_actions.deleting}
                error={row_actions.deleteError}
                target_name={row_actions.delete_target_name}
                target_code={row_actions.delete_target_code}
                on_close={row_actions.closeDeleteDialog}
                on_confirm={() => void row_actions.confirmDelete()}
            />
        </ContentWrapper>
    )
}

export default StaffListContent
