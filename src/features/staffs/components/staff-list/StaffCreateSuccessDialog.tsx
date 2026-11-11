import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    Stack,
    Typography
} from '@mui/material'

import SwalAlert from '@/shared/utils/SwalAlert'

import type { CreateUserSuccessData, StaffDictionary } from '../../types'
import { commonText, staffText } from './staffListHelpers'

type Props = {
    dictionary: StaffDictionary
    data: CreateUserSuccessData | null
    on_close: () => void
}

const InfoRow = ({ label, value, sensitive, unavailableText }: { label: string; value: string; sensitive?: boolean; unavailableText: string }) => (
    <Grid container spacing={1.5} alignItems="flex-start">
        <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                {label}
            </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 8 }}>
            <Typography
                variant="body2"
                sx={{
                    fontFamily: sensitive ? 'monospace' : undefined,
                    fontWeight: sensitive ? 800 : 600,
                    overflowWrap: 'anywhere'
                }}
            >
                {value || unavailableText}
            </Typography>
        </Grid>
    </Grid>
)

const copyText = async (dictionary: StaffDictionary, value: string) => {
    if (!value) return

    await navigator.clipboard.writeText(value)
    SwalAlert('success', staffText(dictionary, 'copy_success', 'Copied.'), 'center')
}

const StaffCreateSuccessDialog = ({ dictionary, data, on_close }: Props) => {
    const unavailable_text = staffText(dictionary, 'account_info_not_available', 'Chưa có thông tin')
    const account_info = data
        ? [
            [staffText(dictionary, 'field_fullname', 'Fullname'), data.fullname],
            [staffText(dictionary, 'field_username', 'Username'), data.username],
            [staffText(dictionary, 'field_password', 'Password'), data.password],
            [staffText(dictionary, 'field_email', 'Email'), data.email],
            [staffText(dictionary, 'field_phone', 'Phone'), data.phone],
            [staffText(dictionary, 'field_notification_type', 'Notification type'), data.notificationType]
        ]
            .filter(([, value]) => Boolean(value))
            .map(([label, value]) => `${label}: ${value}`)
            .join('\n')
        : ''

    return (
        <Dialog
            open={Boolean(data)}
            onClose={(_, reason) => {
                if (reason === 'backdropClick' || reason === 'escapeKeyDown') return

                on_close()
            }}
            disableEscapeKeyDown
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 2 } }}
        >
            <DialogTitle sx={{ color: 'primary.main', fontWeight: 800 }}>
                {staffText(dictionary, 'create_success_title', 'Tạo user thành công')}
            </DialogTitle>
            <DialogContent dividers>
                {data && (
                    <Stack spacing={2.5}>
                        {!data.hasAccountInformation ? (
                            <Alert severity="warning">
                                {staffText(dictionary, 'create_success_missing_account_info', 'Tạo user thành công nhưng hệ thống không nhận được thông tin tài khoản từ máy chủ. Vui lòng kiểm tra lại thông tin user trong danh sách hoặc thử tải lại.')}
                            </Alert>
                        ) : <>
                            <Alert severity="warning">
                                {staffText(dictionary, 'save_account_warning', 'Vui lòng lưu lại thông tin đăng nhập này. Mật khẩu có thể chỉ hiển thị một lần sau khi tạo user.')}
                            </Alert>

                            <Grid container spacing={3}>
                            <Grid size={{ xs: 12, md: data.qrSrc ? 7 : 12 }}>
                                <Stack spacing={1.5}>
                                    <InfoRow label={staffText(dictionary, 'field_fullname', 'Fullname')} value={data.fullname} unavailableText={unavailable_text} />
                                    <InfoRow label={staffText(dictionary, 'field_username', 'Username')} value={data.username} sensitive unavailableText={unavailable_text} />
                                    <InfoRow label={staffText(dictionary, 'field_password', 'Password')} value={data.password} sensitive unavailableText={unavailable_text} />
                                    <InfoRow label={staffText(dictionary, 'field_email', 'Email')} value={data.email} unavailableText={unavailable_text} />
                                    <InfoRow label={staffText(dictionary, 'field_phone', 'Phone')} value={data.phone} unavailableText={unavailable_text} />
                                    <InfoRow label={staffText(dictionary, 'field_user_code', 'User code')} value={data.userCode} unavailableText={unavailable_text} />
                                    <InfoRow label={staffText(dictionary, 'field_notification_type', 'Notification type')} value={data.notificationType} unavailableText={unavailable_text} />
                                </Stack>
                            </Grid>

                            {data.qrSrc && (
                                <Grid size={{ xs: 12, md: 5 }}>
                                    <Stack alignItems="center" spacing={1.5}>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                                            {staffText(dictionary, 'password_qr', 'QR code password')}
                                        </Typography>
                                        <Box
                                            component="img"
                                            src={data.qrSrc}
                                            alt="User password QR"
                                            sx={{
                                                width: 180,
                                                height: 180,
                                                objectFit: 'contain',
                                                border: 1,
                                                borderColor: 'divider',
                                                borderRadius: 1,
                                                p: 1
                                            }}
                                        />
                                    </Stack>
                                </Grid>
                            )}
                            </Grid>

                            {account_info && <>
                                <Divider />

                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="flex-end">
                                    <Button variant="contained" startIcon={<ContentCopyIcon />} onClick={() => void copyText(dictionary, account_info)}>
                                        {staffText(dictionary, 'copy_account_info', 'Copy login information')}
                                    </Button>
                                </Stack>
                            </>}
                        </>}
                    </Stack>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button variant="contained" onClick={on_close}>
                    {commonText(dictionary, 'close', 'Close')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default StaffCreateSuccessDialog
