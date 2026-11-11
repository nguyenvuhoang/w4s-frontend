import SecurityIcon from '@mui/icons-material/Security'
import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material'

import { residentText, type ResidentDictionary } from '../resident-list/residentListHelpers'

type Props = {
    dictionary: ResidentDictionary
    account_available: boolean
    account_error?: string | null
    login_name: string
    on_change_username: () => void
}

// Username management only: the resident's personal fields live in the profile tab, so this tab has
// no form fields or Save of its own.
const ResidentAccountEditTab = ({
    dictionary,
    account_available,
    account_error,
    login_name,
    on_change_username
}: Props) => {
    if (account_error) {
        return <Alert severity="error">{account_error}</Alert>
    }

    if (!account_available) {
        return (
            <Alert severity="info">
                {residentText(dictionary, 'account_empty', 'Cư dân chưa có tài khoản đăng nhập.')}
            </Alert>
        )
    }

    return (
        <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
            <Stack spacing={0.5} sx={{ mb: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    {residentText(dictionary, 'edit_tab_account', 'Tài khoản đăng nhập')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {residentText(dictionary, 'account_edit_subtitle', 'Quản lý tên đăng nhập của tài khoản cư dân.')}
                </Typography>
            </Stack>
            {/* Login name is changed only through the Change Username dialog (WF_BO_UPDATE_RESIDENT_PROFILE). */}
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <TextField
                    fullWidth
                    required
                    label={residentText(dictionary, 'account_login_name', 'Tên đăng nhập')}
                    value={login_name}
                    slotProps={{ input: { readOnly: true } }}
                />
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SecurityIcon />}
                    onClick={on_change_username}
                    sx={{
                        flexShrink: 0,
                        minHeight: 44,
                        px: 2.5,
                        py: 1.25,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        color: 'common.white',
                        '&:hover': { bgcolor: 'primary.dark' }
                    }}
                >
                    {residentText(dictionary, 'change_username_button', 'Đổi tên đăng nhập')}
                </Button>
            </Stack>
        </Paper>
    )
}

export default ResidentAccountEditTab
