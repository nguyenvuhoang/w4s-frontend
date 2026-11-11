import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material'

import type { StaffDictionary } from '../types'
import { commonText, staffText } from './staff-list/staffListHelpers'

type Props = {
    dictionary: StaffDictionary
    open: boolean
    loading: boolean
    error?: string | null
    target_name: string
    target_code: string
    on_close: () => void
    on_confirm: () => void
}

const StaffDeleteDialog = ({ dictionary, open, loading, error, target_name, target_code, on_close, on_confirm }: Props) => (
    <Dialog
        open={open}
        maxWidth="xs"
        fullWidth
        disableEscapeKeyDown
        onClose={(_, reason) => {
            if (reason === 'backdropClick' || reason === 'escapeKeyDown') return

            on_close()
        }}
        slotProps={{
            paper: {
                sx: { borderRadius: 2 }
            }
        }}
    >
        <DialogTitle sx={{ pr: 7, fontWeight: 800, color: 'error.main' }}>
            {staffText(dictionary, 'delete_user_confirm_title', 'Delete user')}
            <IconButton
                aria-label={commonText(dictionary, 'close', 'Close')}
                onClick={on_close}
                disabled={loading}
                sx={{ position: 'absolute', right: 16, top: 16 }}
            >
                <CloseIcon />
            </IconButton>
        </DialogTitle>
        <DialogContent dividers>
            <Stack spacing={2} sx={{ py: 1 }}>
                {error && <Alert severity="error">{error}</Alert>}
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <WarningAmberIcon color="warning" />
                    <Typography>
                        {staffText(dictionary, 'delete_user_confirm_message', 'Are you sure you want to delete this user? This action cannot be undone.')}
                    </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                    {staffText(dictionary, 'delete_user_target_label', 'User')}: <strong>{target_name || '-'}</strong> ({target_code || '-'})
                </Typography>
            </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
            <Button onClick={on_close} disabled={loading}>
                {commonText(dictionary, 'cancel', 'Cancel')}
            </Button>
            <Button
                variant="contained"
                color="error"
                startIcon={loading ? <CircularProgress color="inherit" size={16} /> : <DeleteOutlineIcon />}
                onClick={on_confirm}
                disabled={loading}
            >
                {loading
                    ? staffText(dictionary, 'deleting_user', 'Deleting...')
                    : commonText(dictionary, 'delete', 'Delete')}
            </Button>
        </DialogActions>
    </Dialog>
)

export default StaffDeleteDialog
