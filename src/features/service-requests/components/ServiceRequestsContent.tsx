'use client'

import AddIcon from '@mui/icons-material/Add'
import AssignmentIcon from '@mui/icons-material/Assignment'
import { Alert, Button, Paper, Snackbar, Stack, Typography } from '@mui/material'

import PaginationPage from '@/@core/components/jTable/pagination'
import { PermissionGuard } from '@shared/permissions/PermissionGuard'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'

import { useServiceRequests } from '../hooks/useServiceRequests'
import type {
    ServiceRequestsFilter,
    ServiceRequestsPageProps,
    ServiceRequestsSearchResponse
} from '../types'
import ServiceRequestAssignHandlerDialog from './ServiceRequestAssignHandlerDialog'
import ServiceRequestAssignSuccessDialog from './ServiceRequestAssignSuccessDialog'
import ServiceRequestCreateDialog from './ServiceRequestCreateDialog'
import ServiceRequestActionDialog from './ServiceRequestActionDialog'
import ServiceRequestDeactivateDialog from './ServiceRequestDeactivateDialog'
import ServiceRequestsFilterBar from './ServiceRequestsFilterBar'
import ServiceRequestsTable from './ServiceRequestsTable'
import { commonText, serviceRequestsText } from './serviceRequestHelpers'

type Props = ServiceRequestsPageProps & {
    initialFilter: ServiceRequestsFilter
    initialData: ServiceRequestsSearchResponse
    initialError?: string | null
}

const ServiceRequestsContent = ({ dictionary, session, locale, initialFilter, initialData, initialError }: Props) => {
    const sessiontoken = session?.user?.token ?? undefined
    const serviceRequests = useServiceRequests({
        dictionary,
        sessiontoken,
        language: locale,
        initialFilter,
        initialData,
        initialError
    })

    return (
        <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
            <Stack spacing={3}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2}>
                    <Stack direction="row" gap={1.5} alignItems="flex-start">
                        <AssignmentIcon color="primary" sx={{ fontSize: 34, mt: 0.25 }} />
                        <Stack>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                {serviceRequestsText(dictionary, 'service_requests')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {serviceRequestsText(dictionary, 'service_requests_description')}
                            </Typography>
                        </Stack>
                    </Stack>

                    <Stack direction="row" gap={1} alignItems="center">
                        <PermissionGuard href="/service-requests/service-requests" action="ADD">
                            <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={serviceRequests.handleOpenCreate}>
                                {serviceRequestsText(dictionary, 'add_service_request')}
                            </Button>
                        </PermissionGuard>
                    </Stack>
                </Stack>

                <ServiceRequestsFilterBar
                    dictionary={dictionary}
                    filter={serviceRequests.draftFilter}
                    onChange={serviceRequests.updateDraftFilter}
                    onStatusChange={serviceRequests.applyFilter}
                    onSearch={serviceRequests.handleSearch}
                    onReset={serviceRequests.handleReset}
                />

                {serviceRequests.error && (
                    <Alert
                        severity="error"
                        action={
                            <Button color="inherit" size="small" onClick={() => void serviceRequests.loadData()}>
                                {commonText(dictionary, 'retry')}
                            </Button>
                        }
                    >
                        {serviceRequests.error}
                    </Alert>
                )}

                <ServiceRequestsTable
                    dictionary={dictionary}
                    locale={locale}
                    rows={serviceRequests.rows}
                    loading={serviceRequests.loading}
                    pageIndex={serviceRequests.filter.page_index}
                    pageSize={serviceRequests.filter.page_size}
                    onViewDetail={serviceRequests.handleViewDetail}
                    onUpdateStatus={serviceRequests.handleOpenUpdateStatus}
                    onOpenAssignHandler={serviceRequests.handleOpenAssignHandler}
                    onCancel={serviceRequests.handleOpenCancel}
                    onDeactivate={serviceRequests.handleOpenDeactivate}
                    mutationLoading={serviceRequests.actionLoading || serviceRequests.deactivateLoading}
                />

                {serviceRequests.totalCount > 0 && (
                    <PaginationPage
                        page={serviceRequests.filter.page_index}
                        pageSize={serviceRequests.filter.page_size}
                        totalResults={serviceRequests.totalCount}
                        jumpPage={serviceRequests.filter.page_index}
                        handlePageSizeChange={serviceRequests.handlePageSizeChange}
                        handlePageChange={serviceRequests.handlePageChange}
                        handleJumpPage={serviceRequests.handleJumpPage}
                        dictionary={dictionary}
                    />
                )}
            </Stack>

            {serviceRequests.createOpen && serviceRequests.workingProject && (
                <ServiceRequestCreateDialog
                    key={serviceRequests.createKey}
                    dictionary={dictionary}
                    open
                    loading={serviceRequests.createLoading}
                    error={serviceRequests.createError}
                    defaultProjectId={serviceRequests.workingProject.id}
                    projectOptions={[serviceRequests.workingProject]}
                    projectsLoading={false}
                    onClose={serviceRequests.handleCloseCreate}
                    onSubmit={serviceRequests.handleCreate}
                />
            )}

            {serviceRequests.actionMode && serviceRequests.actionTarget && (
                <ServiceRequestActionDialog
                    key={serviceRequests.actionKey}
                    dictionary={dictionary}
                    open
                    mode={serviceRequests.actionMode}
                    request={serviceRequests.actionTarget}
                    loading={serviceRequests.actionLoading}
                    error={serviceRequests.actionError}
                    onClose={serviceRequests.handleCloseAction}
                    onSubmit={serviceRequests.handleActionSubmit}
                />
            )}

            <ServiceRequestDeactivateDialog
                dictionary={dictionary}
                request={serviceRequests.deactivateTarget}
                loading={serviceRequests.deactivateLoading}
                onClose={serviceRequests.handleCloseDeactivate}
                onConfirm={() => void serviceRequests.handleDeactivate()}
            />

            {serviceRequests.assignTarget && (
                <ServiceRequestAssignHandlerDialog
                    key={serviceRequests.assignKey}
                    dictionary={dictionary}
                    locale={locale}
                    sessiontoken={session?.user?.token ?? undefined}
                    request={serviceRequests.assignTarget}
                    detail={serviceRequests.assignDetail}
                    detailLoading={serviceRequests.assignDetailLoading}
                    detailError={serviceRequests.assignDetailError}
                    onRetryDetail={serviceRequests.handleRetryAssignDetail}
                    submitLoading={serviceRequests.assignSubmitLoading}
                    submitError={serviceRequests.assignSubmitError}
                    onClose={serviceRequests.handleCloseAssignHandler}
                    onSubmit={values => void serviceRequests.handleSubmitAssignHandler(values)}
                />
            )}

            {serviceRequests.assignSuccess && (
                <ServiceRequestAssignSuccessDialog
                    dictionary={dictionary}
                    locale={locale}
                    info={serviceRequests.assignSuccess}
                    onClose={serviceRequests.handleCloseAssignSuccess}
                />
            )}

            <Snackbar
                open={Boolean(serviceRequests.notice)}
                autoHideDuration={4000}
                onClose={serviceRequests.handleCloseNotice}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    variant="filled"
                    severity={serviceRequests.notice?.severity ?? 'success'}
                    onClose={serviceRequests.handleCloseNotice}
                >
                    {serviceRequests.notice?.message}
                </Alert>
            </Snackbar>
        </Paper>
        </RequireWorkingProject>
    )
}

export default ServiceRequestsContent
