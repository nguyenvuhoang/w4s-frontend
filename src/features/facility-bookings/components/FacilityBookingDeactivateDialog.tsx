import BlockIcon from '@mui/icons-material/Block'
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Typography
} from '@mui/material'

import type { FacilityBookingItem, FacilityBookingsDictionary } from '../types'
import { bookingText, commonText } from './facilityBookingHelpers'

type Props = {
    dictionary: FacilityBookingsDictionary
    booking: FacilityBookingItem | null
    loading: boolean
    on_close: () => void
    on_confirm: () => void
}

const FacilityBookingDeactivateDialog = ({ dictionary, booking, loading, on_close, on_confirm }: Props) => (
    <Dialog open={Boolean(booking)} onClose={loading ? undefined : on_close} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>
            {bookingText(dictionary, 'confirm_deactivate_facility_booking')}
        </DialogTitle>
        <DialogContent>
            <DialogContentText>{bookingText(dictionary, 'deactivate_facility_booking_message')}</DialogContentText>
            {booking && <Typography sx={{ mt: 1.5, fontWeight: 700 }}>{booking.booking_code}</Typography>}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={on_close} disabled={loading}>{commonText(dictionary, 'cancel')}</Button>
            <Button
                variant="contained"
                color="warning"
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <BlockIcon />}
                onClick={on_confirm}
                disabled={loading}
            >
                {bookingText(dictionary, 'deactivate_facility_booking')}
            </Button>
        </DialogActions>
    </Dialog>
)

export default FacilityBookingDeactivateDialog
