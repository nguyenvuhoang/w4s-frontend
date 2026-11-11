'use client'

import AddIcon from '@mui/icons-material/Add'
import BusinessIcon from '@mui/icons-material/Business'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Alert, Button, Paper, Stack, Typography } from '@mui/material'
import { useRouter } from '@shared/hooks/useRouter'

import PaginationPage from '@/@core/components/jTable/pagination'
import { PermissionGuard } from '@shared/permissions/PermissionGuard'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import { usePermission } from '@shared/permissions/usePermission'
import SwalAlert from '@shared/utils/SwalAlert'

import { useVendors } from '../hooks/useVendors'
import type {
    VendorsFilterModel,
    VendorsPageProps,
    VendorsSearchResponse
} from '../vendorTypes'
import VendorsFilterBar from './VendorsFilterBar'
import VendorsTable from './VendorsTable'
import { commonText, vendorsText } from './vendorHelpers'

type Props = VendorsPageProps & {
    initialFilter: VendorsFilterModel
    initialData: VendorsSearchResponse
    initialError?: string | null
}

const VendorsContent = ({
    dictionary,
    session,
    locale,
    initialFilter,
    initialData,
    initialError
}: Props) => {
    const router = useRouter()
    const sessiontoken = session?.user?.token ?? undefined
    const vendors = useVendors({
        dictionary,
        sessiontoken,
        language: locale,
        initialFilter,
        initialData,
        initialError
    })
    const permission = usePermission({ href: '/contracts/company' })
    const handleViewVendor = (id: number) => {
        if (id > 0) router.push(`/${locale}/contracts/company/${id}`)
    }
    const handleCreateVendor = () => {
        if (!permission.canAdd) {
            SwalAlert('warning', dictionary['common'].nopermissionview, 'center')

            return
        }

        router.push(`/${locale}/contracts/company/create`)
    }

    return (
        <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
            <Stack spacing={3}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                    <Stack direction="row" gap={1.5} alignItems="flex-start">
                        <BusinessIcon color="primary" sx={{ fontSize: 34, mt: 0.25 }} />
                        <Stack>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                {vendorsText(dictionary, 'vendors_management', 'Vendor Companies')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {vendorsText(dictionary, 'vendors_management_description', 'Search and manage vendor company information by project.')}
                            </Typography>
                        </Stack>
                    </Stack>

                    <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} sx={{ alignSelf: { xs: 'stretch', md: 'center' } }}>
                        <PermissionGuard href="/contracts/company" action="ADD">
                            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateVendor}>
                                {vendorsText(dictionary, 'add_vendor', 'Add Vendor')}
                            </Button>
                        </PermissionGuard>
                        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={vendors.handleRefresh}>
                            {vendors.refreshLabel}
                        </Button>
                    </Stack>
                </Stack>

                <VendorsFilterBar
                    dictionary={dictionary}
                    filter={vendors.draftFilter}
                    onChange={vendors.updateDraftFilter}
                    onSearch={vendors.handleSearch}
                />

                {vendors.error && (
                    <Alert
                        severity="error"
                        action={
                            <Button color="inherit" size="small" onClick={() => void vendors.loadData()}>
                                {commonText(dictionary, 'retry', 'Retry')}
                            </Button>
                        }
                    >
                        {vendors.error}
                    </Alert>
                )}

                <VendorsTable
                    dictionary={dictionary}
                    rows={vendors.rows}
                    loading={vendors.loading}
                    pageIndex={vendors.filter.page_index}
                    pageSize={vendors.filter.page_size}
                    onView={handleViewVendor}
                />

                {vendors.totalCount > 0 && (
                    <PaginationPage
                        page={vendors.filter.page_index}
                        pageSize={vendors.filter.page_size}
                        totalResults={vendors.totalCount}
                        jumpPage={vendors.filter.page_index}
                        handlePageSizeChange={vendors.handlePageSizeChange}
                        handlePageChange={vendors.handlePageChange}
                        handleJumpPage={vendors.handleJumpPage}
                        dictionary={dictionary}
                    />
                )}
            </Stack>
        </Paper>
        </RequireWorkingProject>
    )
}

export default VendorsContent
