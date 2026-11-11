import CloseIcon from '@mui/icons-material/Close'
import {
    Alert,
    Box,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    Typography
} from '@mui/material'
import type { ReactNode } from 'react'

import type { FacilityBookingItem, FacilityBookingsDictionary } from '../types'
import {
    bookingText,
    commonText,
    formatBookingDate,
    formatBookingMoney,
    formatNullableText,
    getBookingBooleanLabel,
    getBookingStatusColor,
    getBookingStatusLabel
} from './facilityBookingHelpers'

type Props = {
    dictionary: FacilityBookingsDictionary
    locale: string
    open: boolean
    loading: boolean
    error: string | null
    booking: FacilityBookingItem | null
    on_close: () => void
}

const DetailRow = ({ label, children }: { label: string; children: ReactNode }) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '210px 1fr' }, gap: 1.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>{label}</Typography>
        <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>{children}</Box>
    </Box>
)

const FacilityBookingDetailDialog = ({ dictionary, locale, open, loading, error, booking, on_close }: Props) => (
    <Dialog open={open} onClose={on_close} fullWidth maxWidth="md">
        <DialogTitle sx={{ pr: 7, fontWeight: 800 }}>
            {bookingText(dictionary, 'facility_booking_detail')}
            <IconButton
                aria-label={commonText(dictionary, 'close')}
                onClick={on_close}
                sx={{ position: 'absolute', right: 12, top: 10 }}
            >
                <CloseIcon />
            </IconButton>
        </DialogTitle>
        <DialogContent dividers>
            {loading ? (
                <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress /></Stack>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : booking ? (
                <Stack spacing={2}>
                    <DetailRow label={bookingText(dictionary, 'booking_code')}>{formatNullableText(booking.booking_code)}</DetailRow>
                    <DetailRow label={bookingText(dictionary, 'project_id')}>{formatNullableText(booking.project_id)}</DetailRow>
                    <DetailRow label={bookingText(dictionary, 'facility_id')}>{formatNullableText(booking.facility_id)}</DetailRow>
                    <DetailRow label={bookingText(dictionary, 'facility_time_slot_id')}>{formatNullableText(booking.facility_time_slot_id)}</DetailRow>
                    <DetailRow label={bookingText(dictionary, 'resident_id')}>{formatNullableText(booking.resident_id)}</DetailRow>
                    <DetailRow label={bookingText(dictionary, 'user_code')}>{formatNullableText(booking.user_code)}</DetailRow>
                    <DetailRow label={bookingText(dictionary, 'apartment_id')}>{formatNullableText(booking.apartment_id)}</DetailRow>
                    <DetailRow label={bookingText(dictionary, 'booking_date')}>{formatBookingDate(booking.booking_date, locale)}</DetailRow>
                    <DetailRow label={bookingText(dictionary, 'start_time')}>{formatNullableText(booking.start_time)}</DetailRow>
                    <DetailRow label={bookingText(dictionary, 'end_time')}>{formatNullableText(booking.end_time)}</DetailRow>
                    <DetailRow label={bookingText(dictionary, 'note')}>{formatNullableText(booking.note)}</DetailRow>
                    <DetailRow label={bookingText(dictionary, 'terms_accepted')}>{getBookingBooleanLabel(dictionary, booking.terms_accepted)}</DetailRow>
                    <DetailRow label={bookingText(dictionary, 'status')}>
                        <Chip size="small" color={getBookingStatusColor(booking.status)} label={getBookingStatusLabel(dictionary, booking.status)} />
                    </DetailRow>
                    <DetailRow label={bookingText(dictionary, 'service_fee')}>{formatBookingMoney(booking.service_fee, locale)}</DetailRow>
                    <DetailRow label={bookingText(dictionary, 'deposit_amount')}>{formatBookingMoney(booking.deposit_amount, locale)}</DetailRow>
                    <DetailRow label={bookingText(dictionary, 'total_amount')}>{formatBookingMoney(booking.total_amount, locale)}</DetailRow>
                    <DetailRow label={bookingText(dictionary, 'payment_method')}>{formatNullableText(booking.payment_method)}</DetailRow>
                    <DetailRow label={bookingText(dictionary, 'approved_by')}>{formatNullableText(booking.approved_by_user_code)}</DetailRow>
                    <DetailRow label={bookingText(dictionary, 'approved_on')}>{formatBookingDate(booking.approved_on_utc, locale)}</DetailRow>
                </Stack>
            ) : null}
        </DialogContent>
    </Dialog>
)

export default FacilityBookingDetailDialog
