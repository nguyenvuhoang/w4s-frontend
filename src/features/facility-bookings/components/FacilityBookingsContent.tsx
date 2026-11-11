'use client'

import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Alert, Button, Snackbar, Stack, Typography } from '@mui/material'

import PaginationPage from '@/@core/components/jTable/pagination'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { PermissionGuard } from '@shared/permissions/PermissionGuard'

import { useFacilityBookingsList } from '../hooks/useFacilityBookingsList'
import type {
    FacilityBookingFilterModel,
    FacilityBookingSearchResponse,
    FacilityBookingsPageProps
} from '../types'
import FacilityBookingsFilterBar from './FacilityBookingsFilterBar'
import FacilityBookingsTable from './FacilityBookingsTable'
import FacilityBookingCreateDialog from './FacilityBookingCreateDialog'
import FacilityBookingDetailDialog from './FacilityBookingDetailDialog'
import FacilityBookingDeactivateDialog from './FacilityBookingDeactivateDialog'
import { bookingText, commonText } from './facilityBookingHelpers'

type Props = FacilityBookingsPageProps & {
    initial_filter: FacilityBookingFilterModel
    initial_data: FacilityBookingSearchResponse
    initial_error?: string | null
}

const action_button_sx = {
    minWidth: 116,
    height: 36
}

const FacilityBookingsContent = ({ dictionary, session, locale, initial_filter, initial_data, initial_error }: Props) => {
    const booking_list = useFacilityBookingsList({
        dictionary,
        sessiontoken: session?.user?.token ?? undefined,
        language: locale,
        initial_filter,
        initial_data,
        initial_error
    })

    return (
        <ContentWrapper
            title={bookingText(dictionary, 'manage_facility_booking')}
            description={bookingText(dictionary, 'manage_facility_booking_description')}
            icon={<EventAvailableIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            dictionary={dictionary}
            issearch
        >
            <Stack spacing={3} sx={{ mt: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                    <Stack>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#225087' }}>
                            {bookingText(dictionary, 'manage_facility_booking')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {bookingText(dictionary, 'manage_facility_booking_description')}
                        </Typography>
                    </Stack>

                    <Stack direction="row" gap={1}>
                        <PermissionGuard href="/facilities/bookings" action="ADD">
                            <Button variant="contained" startIcon={<AddIcon />} onClick={booking_list.handleOpenCreate} sx={action_button_sx}>
                                {bookingText(dictionary, 'add_facility_booking')}
                            </Button>
                        </PermissionGuard>
                        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={booking_list.handleRefresh} sx={action_button_sx}>
                            {commonText(dictionary, 'refresh', 'Refresh')}
                        </Button>
                    </Stack>
                </Stack>

                <FacilityBookingsFilterBar
                    dictionary={dictionary}
                    draft_filter={booking_list.draft_filter}
                    on_filter_change={booking_list.updateDraftFilter}
                    on_search={booking_list.handleSearch}
                    on_reset={booking_list.resetFilter}
                />

                {booking_list.error && (
                    <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void booking_list.loadData()}>{commonText(dictionary, 'retry', 'Retry')}</Button>}>
                        {booking_list.error}
                    </Alert>
                )}

                <FacilityBookingsTable
                    dictionary={dictionary}
                    locale={locale}
                    rows={booking_list.rows}
                    loading={booking_list.loading}
                    page_index={booking_list.filter.page_index}
                    page_size={booking_list.filter.page_size}
                    on_view={booking_list.handleView}
                    on_deactivate={booking_list.handleOpenDeactivate}
                    deactivate_loading={booking_list.deactivate_loading}
                />

                {booking_list.total_count > 0 && (
                    <PaginationPage
                        page={booking_list.filter.page_index}
                        pageSize={booking_list.filter.page_size}
                        totalResults={booking_list.total_count}
                        jumpPage={booking_list.filter.page_index}
                        handlePageSizeChange={booking_list.handlePageSizeChange}
                        handlePageChange={booking_list.handlePageChange}
                        handleJumpPage={booking_list.handleJumpPage}
                        dictionary={dictionary}
                    />
                )}
            </Stack>

            {booking_list.create_open && (
                <FacilityBookingCreateDialog
                    key={booking_list.create_key}
                    dictionary={dictionary}
                    sessiontoken={session?.user?.token ?? undefined}
                    language={locale}
                    open
                    loading={booking_list.create_loading}
                    error={booking_list.create_error}
                    on_close={booking_list.handleCloseCreate}
                    on_submit={booking_list.handleCreate}
                />
            )}

            <FacilityBookingDetailDialog
                dictionary={dictionary}
                locale={locale}
                open={booking_list.detail_open}
                loading={booking_list.detail_loading}
                error={booking_list.detail_error}
                booking={booking_list.detail_booking}
                on_close={booking_list.handleCloseDetail}
            />

            <FacilityBookingDeactivateDialog
                dictionary={dictionary}
                booking={booking_list.deactivate_target}
                loading={booking_list.deactivate_loading}
                on_close={booking_list.handleCloseDeactivate}
                on_confirm={() => void booking_list.handleDeactivate()}
            />

            <Snackbar
                open={Boolean(booking_list.mutation_notice)}
                autoHideDuration={4000}
                onClose={booking_list.handleCloseMutationNotice}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    variant="filled"
                    severity={booking_list.mutation_notice?.severity ?? 'success'}
                    onClose={booking_list.handleCloseMutationNotice}
                >
                    {booking_list.mutation_notice?.message}
                </Alert>
            </Snackbar>
        </ContentWrapper>
    )
}

export default FacilityBookingsContent
import AddIcon from '@mui/icons-material/Add'
