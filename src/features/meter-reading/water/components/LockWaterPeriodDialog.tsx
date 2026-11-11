import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'

import { waterText } from '../hooks/useWaterMeterReading'
import type { WaterMeterDictionary } from '../types'

const LockWaterPeriodDialog = ({ dictionary, open, loading, on_close, on_confirm }: { dictionary: WaterMeterDictionary; open: boolean; loading: boolean; on_close: () => void; on_confirm: () => void }) => (
    <Dialog open={open} onClose={loading ? undefined : on_close} fullWidth maxWidth="xs">
        <DialogTitle>{waterText(dictionary, 'lock_period_confirm_title')}</DialogTitle>
        <DialogContent><Typography>{waterText(dictionary, 'lock_period_confirm_message')}</Typography></DialogContent>
        <DialogActions>
            <Button onClick={on_close} disabled={loading}>{waterText(dictionary, 'cancel')}</Button>
            <Button variant="contained" color="warning" startIcon={loading ? <CircularProgress color="inherit" size={16} /> : <LockOutlinedIcon />} onClick={on_confirm} disabled={loading}>{waterText(dictionary, 'lock_period')}</Button>
        </DialogActions>
    </Dialog>
)

export default LockWaterPeriodDialog
