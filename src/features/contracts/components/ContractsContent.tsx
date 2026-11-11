'use client'

import AddIcon from '@mui/icons-material/Add'
import DescriptionIcon from '@mui/icons-material/Description'
import { Alert, Button, Paper, Snackbar, Stack, Typography } from '@mui/material'
import Link from 'next/link'

import PaginationPage from '@/@core/components/jTable/pagination'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import { PermissionGuard } from '@shared/permissions/PermissionGuard'

import { useContracts } from '../hooks/useContracts'
import type { ContractsFilterModel, ContractsPageProps, ContractsSearchResponse } from '../types'
import ContractsFilterBar from './ContractsFilterBar'
import ContractsTable from './ContractsTable'
import { commonText, contractsText } from './contractHelpers'

type Props = ContractsPageProps & {
    initialFilter: ContractsFilterModel
    initialData: ContractsSearchResponse
    initialError?: string | null
}

const ContractsContent = ({ dictionary, session, locale, initialFilter, initialData, initialError }: Props) => {
    const sessiontoken = session?.user?.token ?? undefined
    const contracts = useContracts({
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
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                        <Stack direction="row" gap={1.5} alignItems="flex-start">
                            <DescriptionIcon color="primary" sx={{ fontSize: 34, mt: 0.25 }} />
                            <Stack>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                    {contractsText(dictionary, 'contracts_management', 'Contracts Management')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {contractsText(dictionary, 'contracts_management_description', 'Manage project maintenance contracts.')}
                                </Typography>
                            </Stack>
                        </Stack>

                        <Stack direction="row" gap={1} alignItems="center">
                            <PermissionGuard href="/contracts/contracts" action="ADD">
                                <Button
                                    component={Link}
                                    href={`/${locale}/contracts/contracts/create`}
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                >
                                    {contractsText(dictionary, 'add_new', commonText(dictionary, 'add', 'Add'))}
                                </Button>
                            </PermissionGuard>
                        </Stack>
                    </Stack>

                    <ContractsFilterBar
                        dictionary={dictionary}
                        filter={contracts.draftFilter}
                        onChange={contracts.updateDraftFilter}
                        onSearch={contracts.handleSearch}
                        onReset={contracts.handleReset}
                    />

                    {contracts.error && (
                        <WorkflowErrorAlert
                            title={contractsText(dictionary, 'error_title', 'Unable to load contracts')}
                            message={contracts.error.message}
                            workflowId={contracts.error.workflowId}
                            executionId={contracts.error.executionId}
                            executionIdLabel={contractsText(dictionary, 'error_reference_label', locale === 'vi' ? 'Mã tra cứu lỗi' : 'Error Reference')}
                            copyLabel={commonText(dictionary, 'copy', locale === 'vi' ? 'Sao chép' : 'Copy')}
                            copiedLabel={commonText(dictionary, 'copiedErrorReference', locale === 'vi' ? 'Đã sao chép mã tra cứu' : 'Error reference copied')}
                            copySuccessMessage={contractsText(dictionary, 'copy_error_reference_success', locale === 'vi' ? 'Đã sao chép mã tra cứu' : 'Copied error reference.')}
                            copyFailedMessage={contractsText(dictionary, 'copy_error_reference_failed', locale === 'vi' ? 'Không thể sao chép mã tra cứu.' : 'Unable to copy error reference.')}
                            retryLabel={commonText(dictionary, 'retry', 'Retry')}
                            onRetry={() => void contracts.loadData()}
                        />
                    )}

                    <ContractsTable
                        dictionary={dictionary}
                        rows={contracts.rows}
                        loading={contracts.loading}
                        pageIndex={contracts.filter.page_index}
                        pageSize={contracts.filter.page_size}
                        onOpenDetail={contracts.handleOpenDetailPage}
                    />

                    {contracts.totalCount > 0 && (
                        <PaginationPage
                            page={contracts.filter.page_index}
                            pageSize={contracts.filter.page_size}
                            totalResults={contracts.totalCount}
                            jumpPage={contracts.filter.page_index}
                            handlePageSizeChange={contracts.handlePageSizeChange}
                            handlePageChange={contracts.handlePageChange}
                            handleJumpPage={contracts.handleJumpPage}
                            dictionary={dictionary}
                        />
                    )}
                </Stack>

                <Snackbar
                    open={Boolean(contracts.notice)}
                    autoHideDuration={4000}
                    onClose={contracts.handleCloseNotice}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert
                        variant="filled"
                        severity={contracts.notice?.severity ?? 'success'}
                        onClose={contracts.handleCloseNotice}
                    >
                        {contracts.notice?.message}
                    </Alert>
                </Snackbar>
            </Paper>
        </RequireWorkingProject>
    )
}

export default ContractsContent
