import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material'

import { waterText } from '../hooks/useWaterMeterReading'
import type { WaterMeterDictionary } from '../types'

type Props = {
    dictionary: WaterMeterDictionary
    open: boolean
    loading: boolean
    locked: boolean
    error: string | null
    values: { new_index: string; last_index: string }
    on_change: (values: { new_index: string; last_index: string }) => void
    on_close: () => void
    on_save: () => void
}

const SaveWaterReadingDialog = ({ dictionary, open, loading, locked, error, values, on_change, on_close, on_save }: Props) => (
    <Dialog open={open} onClose={loading ? undefined : on_close} fullWidth maxWidth="sm">
        <DialogTitle>{waterText(dictionary, 'save_reading')}</DialogTitle>
        <DialogContent dividers>
            <Stack spacing={2}>
                {locked && <Alert severity="warning">{waterText(dictionary, 'locked_period_cannot_save')}</Alert>}
                {error && <Alert severity="error">{error}</Alert>}
                <TextField required type="number" label={waterText(dictionary, 'new_index')} value={values.new_index} onChange={event => on_change({ ...values, new_index: event.target.value })} disabled={loading || locked} inputProps={{ step: 'any' }} />
                <TextField type="number" label={waterText(dictionary, 'last_index')} value={values.last_index} onChange={event => on_change({ ...values, last_index: event.target.value })} disabled={loading || locked} inputProps={{ step: 'any' }} />
            </Stack>
        </DialogContent>
        <DialogActions>
            <Button onClick={on_close} disabled={loading}>{waterText(dictionary, 'cancel')}</Button>
            <Button variant="contained" startIcon={loading ? <CircularProgress color="inherit" size={16} /> : <SaveOutlinedIcon />} onClick={on_save} disabled={loading || locked}>{waterText(dictionary, 'save_reading')}</Button>
        </DialogActions>
    </Dialog>
)

export default SaveWaterReadingDialog