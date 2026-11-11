import BlockIcon from '@mui/icons-material/Block'
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'

import type { FacilitiesDictionary } from '../../types'
import { commonText, facilitiesText } from './facilityListHelpers'

type Props = {
    dictionary: FacilitiesDictionary
    open: boolean
    loading: boolean
    on_close: () => void
    on_confirm: () => void
}

const FacilityDeactivateDialog = ({ dictionary, open, loading, on_close, on_confirm }: Props) => (
    <Dialog open={open} onClose={loading ? undefined : on_close} fullWidth maxWidth="xs">
        <DialogTitle>
            {facilitiesText(dictionary, 'deactivate_facility_confirm_title', 'deactivate_facility_confirm_title')}
        </DialogTitle>
        <DialogContent>
            <Typography>
                {facilitiesText(dictionary, 'deactivate_facility_confirm_message', 'deactivate_facility_confirm_message')}
            </Typography>
        </DialogContent>
        <DialogActions>
            <Button onClick={on_close} disabled={loading}>
                {commonText(dictionary, 'cancel', 'cancel')}
            </Button>
            <Button
                variant="contained"
                color="warning"
                startIcon={loading ? <CircularProgress color="inherit" size={16} /> : <BlockIcon />}
                onClick={on_confirm}
                disabled={loading}
            >
                {facilitiesText(dictionary, 'deactivate', 'deactivate')}
            </Button>
        </DialogActions>
    </Dialog>
)

export default FacilityDeactivateDialog
