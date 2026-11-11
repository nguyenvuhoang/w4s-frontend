import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'

import type { ResidentDetailConfirmType } from '../../hooks/useResidentDetailActions'
import { commonText, residentText, type ResidentDictionary } from './residentListHelpers'

type Props = {
    dictionary: ResidentDictionary
    type: ResidentDetailConfirmType
    error?: string | null
    loading?: boolean
    on_close: () => void
    on_confirm: () => void
}

const ResidentConfirmDialog = ({ dictionary, type, error, loading = false, on_close, on_confirm }: Props) => (
    <Dialog
        open={type === 'delete'}
        maxWidth="xs"
        fullWidth
        disableEscapeKeyDown={loading}
        onClose={(_, reason) => {
            if (loading && (reason === 'backdropClick' || reason === 'escapeKeyDown')) return

            on_close()
        }}
    >
        <DialogTitle>{residentText(dictionary, 'delete_confirm_title', 'Xóa cư dân')}</DialogTitle>
        <DialogContent>
            <Stack spacing={1.5}>
                {error && <Alert severity="error">{error}</Alert>}
                <Typography>
                    {residentText(dictionary, 'delete_confirm', 'Bạn có chắc chắn muốn xóa cư dân này?')}
                </Typography>
            </Stack>
        </DialogContent>
        <DialogActions>
            <Button onClick={on_close} disabled={loading}>{commonText(dictionary, 'cancel', 'Hủy')}</Button>
            <Button
                color="error"
                variant="contained"
                onClick={on_confirm}
                disabled={loading}
                startIcon={loading ? <CircularProgress color="inherit" size={16} /> : undefined}
            >
                {loading
                    ? residentText(dictionary, 'deleting_label', 'Đang xóa...')
                    : residentText(dictionary, 'action_delete', 'Xóa')}
            </Button>
        </DialogActions>
    </Dialog>
)

export default ResidentConfirmDialog
