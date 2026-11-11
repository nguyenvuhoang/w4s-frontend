import CloseIcon from '@mui/icons-material/Close'
import SecurityIcon from '@mui/icons-material/Security'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField, Typography } from '@mui/material'

import type { ChangeUsernameFormErrors, ChangeUsernameFormValues } from '../../utils/residentChangeUsername'
import { commonText, residentText, type ResidentDictionary } from '../resident-list/residentListHelpers'

type Props = {
    dictionary: ResidentDictionary
    open: boolean
    current_username: string
    values: ChangeUsernameFormValues
    field_errors: ChangeUsernameFormErrors
    error?: string | null
    submitting: boolean
    on_change: <K extends keyof ChangeUsernameFormValues>(key: K, value: ChangeUsernameFormValues[K]) => void
    on_close: () => void
    on_confirm: () => void
}

// Cancel and Confirm share one size so the footer buttons line up.
const footer_button_sx = { minHeight: 42, px: 2.5, py: 1.25, borderRadius: 2, textTransform: 'none', fontWeight: 700 } as const

const ResidentChangeUsernameDialog = ({
    dictionary,
    open,
    current_username,
    values,
    field_errors,
    error,
    submitting,
    on_change,
    on_close,
    on_confirm
}: Props) => {
    const handleClose = () => {
        if (submitting) return
        on_close()
    }

    return (
        <Dialog
            open={open}
            maxWidth="sm"
            fullWidth
            disableEscapeKeyDown
            onClose={(_, reason) => {
                if (reason === 'backdropClick' || reason === 'escapeKeyDown') return

                handleClose()
            }}
            slotProps={{
                // overflow hidden keeps the header background inside the paper's rounded top corners.
                paper: { sx: { borderRadius: 2, overflow: 'hidden', m: { xs: 2, sm: 4 }, width: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' } } }
            }}
        >
            <DialogTitle
                sx={{
                    position: 'relative',
                    px: 3,
                    py: 2.5,
                    pr: 8,
                    color: 'common.white',
                    // Same background as the resident edit tab navigation.
                    background: theme => `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 55%, ${theme.palette.primary.dark} 100%)`
                }}
            >
                <Stack direction="row" alignItems="center" gap={1}>
                    <SecurityIcon sx={{ color: 'common.white' }} />
                    <Typography variant="h5" component="span" sx={{ color: 'common.white', fontWeight: 700 }}>
                        {residentText(dictionary, 'change_username_title', 'Đổi tên đăng nhập')}
                    </Typography>
                </Stack>
                <Typography variant="body2" sx={{ mt: 0.5, color: 'rgba(255,255,255,0.85)' }}>
                    {residentText(dictionary, 'change_username_subtitle', 'Nhập tên đăng nhập mới để cập nhật tài khoản cư dân.')}
                </Typography>
                <IconButton
                    aria-label={commonText(dictionary, 'close', 'Đóng')}
                    onClick={handleClose}
                    disabled={submitting}
                    sx={{
                        position: 'absolute',
                        right: 12,
                        top: 12,
                        color: 'common.white',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
                        '&.Mui-disabled': { color: 'rgba(255,255,255,0.5)' }
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack
                    component="form"
                    spacing={2.5}
                    sx={{ py: 1 }}
                    noValidate
                    onSubmit={event => {
                        event.preventDefault()
                        on_confirm()
                    }}
                >
                    {error && <Alert severity="error">{error}</Alert>}
                    <TextField
                        fullWidth
                        label={residentText(dictionary, 'change_username_current', 'Tên đăng nhập hiện tại')}
                        value={current_username}
                        slotProps={{ input: { readOnly: true } }}
                    />
                    <TextField
                        fullWidth
                        required
                        autoFocus
                        autoComplete="off"
                        label={residentText(dictionary, 'change_username_new', 'Tên đăng nhập mới')}
                        value={values.new_username}
                        disabled={submitting}
                        error={Boolean(field_errors.new_username)}
                        helperText={field_errors.new_username}
                        onChange={event => on_change('new_username', event.target.value)}
                    />
                    {/* Hidden submit so Enter inside the fields submits the same guarded handler. */}
                    <button type="submit" hidden aria-hidden tabIndex={-1} />
                </Stack>
            </DialogContent>
            <DialogActions
                disableSpacing
                sx={{
                    px: 3,
                    py: 2,
                    gap: 1.5,
                    // Mobile: full-width stacked, Confirm on top. Desktop: right-aligned row.
                    flexDirection: { xs: 'column-reverse', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' },
                    justifyContent: 'flex-end'
                }}
            >
                <Button variant="outlined" color="primary" sx={footer_button_sx} onClick={handleClose} disabled={submitting}>
                    {commonText(dictionary, 'cancel', 'Hủy')}
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SecurityIcon />}
                    sx={{ ...footer_button_sx, color: 'common.white', '&:hover': { bgcolor: 'primary.dark' } }}
                    onClick={on_confirm} disabled={submitting}
                >
                    {submitting
                        ? commonText(dictionary, 'processing', 'Đang xử lý...')
                        : residentText(dictionary, 'change_username_confirm', 'Xác nhận thay đổi')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default ResidentChangeUsernameDialog
