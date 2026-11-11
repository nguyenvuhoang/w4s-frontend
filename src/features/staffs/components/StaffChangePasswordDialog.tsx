import { useEffect, useState } from 'react'

import AutorenewIcon from '@mui/icons-material/Autorenew'
import CloseIcon from '@mui/icons-material/Close'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material'

import type { StaffDictionary } from '../types'
import { generateStrongPassword } from '../utils/passwordGenerator'
import { commonText, staffText } from './staff-list/staffListHelpers'

type Props = {
    dictionary: StaffDictionary
    open: boolean
    loading: boolean
    error?: string | null
    /** Identifies the target user when this dialog is opened from a list row rather than the detail page. */
    target_label?: string
    on_close: () => void
    on_confirm: (password: string) => void
}

const StaffChangePasswordDialog = ({ dictionary, open, loading, error, target_label, on_close, on_confirm }: Props) => {
    const [password, setPassword] = useState('')
    const [confirm_password, setConfirmPassword] = useState('')
    const [field_errors, setFieldErrors] = useState<{ password?: string; confirm_password?: string }>({})
    const [show_password, setShowPassword] = useState(false)
    const [show_confirm_password, setShowConfirmPassword] = useState(false)

    useEffect(() => {
        if (!open) {
            setPassword('')
            setConfirmPassword('')
            setFieldErrors({})
            setShowPassword(false)
            setShowConfirmPassword(false)
        }
    }, [open])

    const handleGeneratePassword = () => {
        const generated = generateStrongPassword()

        setPassword(generated)
        setConfirmPassword(generated)
        setFieldErrors({})
        setShowPassword(true)
        setShowConfirmPassword(true)
    }

    const handleSubmit = () => {
        const errors: { password?: string; confirm_password?: string } = {}

        if (!password) {
            errors.password = staffText(dictionary, 'password_required', 'Password is required.')
        } else if (password.length < 8) {
            errors.password = staffText(dictionary, 'password_min_length', 'Password must be at least 8 characters.')
        }

        if (!confirm_password) {
            errors.confirm_password = staffText(dictionary, 'confirm_password_required', 'Please confirm the password.')
        } else if (password && confirm_password !== password) {
            errors.confirm_password = staffText(dictionary, 'confirm_password_mismatch', 'Confirmation password does not match.')
        }

        setFieldErrors(errors)

        if (Object.keys(errors).length > 0) return

        on_confirm(password)
    }

    return (
        <Dialog
            open={open}
            maxWidth="xs"
            fullWidth
            disableEscapeKeyDown
            onClose={(_, reason) => {
                if (loading || reason === 'backdropClick' || reason === 'escapeKeyDown') return

                on_close()
            }}
            slotProps={{
                paper: { sx: { borderRadius: 2 } }
            }}
        >
            <DialogTitle sx={{ pr: 7 }}>
                <Typography variant="h5" component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>
                    {staffText(dictionary, 'change_password_title', 'Change password')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {staffText(dictionary, 'change_password_subtitle', 'Set a new password for this user.')}
                </Typography>
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
                <Stack spacing={2.5} sx={{ py: 1 }}>
                    {target_label && <Typography variant="body2" color="text.secondary">{target_label}</Typography>}
                    {error && <Alert severity="error">{error}</Alert>}
                    <TextField
                        fullWidth
                        required
                        type={show_password ? 'text' : 'password'}
                        autoComplete="new-password"
                        label={staffText(dictionary, 'field_new_password', 'New password')}
                        value={password}
                        error={Boolean(field_errors.password)}
                        helperText={field_errors.password || staffText(dictionary, 'password_hint', 'At least 8 characters.')}
                        onChange={event => {
                            setPassword(event.target.value)
                            setFieldErrors(current => ({ ...current, password: undefined }))
                        }}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label={staffText(dictionary, 'toggle_password_visibility', 'Toggle password visibility')}
                                            onClick={() => setShowPassword(current => !current)}
                                            edge="end"
                                        >
                                            {show_password ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }
                        }}
                    />
                    <TextField
                        fullWidth
                        required
                        type={show_confirm_password ? 'text' : 'password'}
                        autoComplete="new-password"
                        label={staffText(dictionary, 'field_confirm_password', 'Confirm password')}
                        value={confirm_password}
                        error={Boolean(field_errors.confirm_password)}
                        helperText={field_errors.confirm_password}
                        onChange={event => {
                            setConfirmPassword(event.target.value)
                            setFieldErrors(current => ({ ...current, confirm_password: undefined }))
                        }}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label={staffText(dictionary, 'toggle_password_visibility', 'Toggle password visibility')}
                                            onClick={() => setShowConfirmPassword(current => !current)}
                                            edge="end"
                                        >
                                            {show_confirm_password ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }
                        }}
                    />
                    <Button variant="outlined" size="small" startIcon={<AutorenewIcon />} onClick={handleGeneratePassword} sx={{ alignSelf: 'flex-start' }}>
                        {staffText(dictionary, 'generate_password_button', 'Generate password')}
                    </Button>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={on_close} disabled={loading}>
                    {commonText(dictionary, 'cancel', 'Cancel')}
                </Button>
                <Button variant="contained" disabled={loading} onClick={handleSubmit}>
                    {loading ? staffText(dictionary, 'changing_password', 'Changing password...') : staffText(dictionary, 'change_password', 'Change Password')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default StaffChangePasswordDialog
