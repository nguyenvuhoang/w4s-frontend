import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined'
import { Alert, Chip, Divider, Grid, Paper, Stack, Typography } from '@mui/material'

import type { ResidentAccount, ResidentListStatus } from '../../types'
import {
    formatResidentDateTime,
    getBooleanLabel,
    getResidentStatusColor,
    getResidentStatusLabel,
    residentText,
    type ResidentDictionary
} from '../resident-list/residentListHelpers'

type Props = {
    dictionary: ResidentDictionary
    account: ResidentAccount | null
    error?: string | null
}

const emptyText = (value?: string | number | null) => {
    if (value === null || value === undefined || value === '') return '-'

    return value
}

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{value}</Typography>
    </Stack>
)

const BooleanChip = ({ label, value, dictionary }: { label: string; value: boolean; dictionary: ResidentDictionary }) => (
    <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Chip
            label={getBooleanLabel(dictionary, value)}
            color={value === true ? 'success' : 'default'}
            size="small"
            variant={value ? 'filled' : 'outlined'}
            sx={{ fontWeight: 700, alignSelf: 'flex-start' }}
        />
    </Stack>
)

const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
    <Stack direction="row" gap={1} alignItems="center">
        {icon}
        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {title}
        </Typography>
    </Stack>
)

const ResidentAccountTab = ({ dictionary, account, error }: Props) => {
    if (error) {
        return <Alert severity="error">{error}</Alert>
    }

    if (!account) {
        return (
            <Alert severity="info">
                {residentText(dictionary, 'account_empty', 'Cư dân chưa có tài khoản đăng nhập.')}
            </Alert>
        )
    }

    return (
        <Paper sx={{ p: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
            <Stack spacing={3}>
                <Stack spacing={1.5}>
                    <SectionTitle
                        icon={<AccountCircleOutlinedIcon color="primary" fontSize="small" />}
                        title={residentText(dictionary, 'account_section_account', 'Thông tin tài khoản')}
                    />
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}><DetailItem label={residentText(dictionary, 'account_login_name', 'Tên đăng nhập')} value={emptyText(account.login_name)} /></Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}><DetailItem label={residentText(dictionary, 'account_user_code', 'User code')} value={emptyText(account.user_code)} /></Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}><DetailItem label={residentText(dictionary, 'account_channel_id', 'Kênh đăng nhập')} value={emptyText(account.channel_id)} /></Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}><DetailItem label={residentText(dictionary, 'account_contract_number', 'Số hợp đồng')} value={emptyText(account.contract_number)} /></Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Stack spacing={0.5}>
                                <Typography variant="caption" color="text.secondary">{residentText(dictionary, 'account_status', 'Trạng thái')}</Typography>
                                {account.status ? (
                                    <Chip
                                        size="small"
                                        color={getResidentStatusColor(account.status as ResidentListStatus)}
                                        label={getResidentStatusLabel(dictionary, account.status as ResidentListStatus)}
                                        sx={{ fontWeight: 700, alignSelf: 'flex-start' }}
                                    />
                                ) : (
                                    <Typography sx={{ fontWeight: 700 }}>-</Typography>
                                )}
                            </Stack>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}><DetailItem label={residentText(dictionary, 'account_user_type', 'Loại user')} value={emptyText(account.user_type)} /></Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}><DetailItem label={residentText(dictionary, 'account_user_level', 'User level')} value={emptyText(account.user_level)} /></Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}><DetailItem label={residentText(dictionary, 'account_policy_id', 'Policy ID')} value={emptyText(account.policy_id)} /></Grid>
                    </Grid>
                </Stack>

                <Divider />

                <Stack spacing={1.5}>
                    <SectionTitle
                        icon={<LoginOutlinedIcon color="primary" fontSize="small" />}
                        title={residentText(dictionary, 'account_section_login_status', 'Trạng thái đăng nhập')}
                    />
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}><BooleanChip label={residentText(dictionary, 'account_is_login', 'Đang được phép đăng nhập')} value={account.is_login} dictionary={dictionary} /></Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}><DetailItem label={residentText(dictionary, 'account_last_login_time', 'Đăng nhập lần cuối')} value={formatResidentDateTime(account.last_login_time)} /></Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}><DetailItem label={residentText(dictionary, 'account_expire_time', 'Hết hạn')} value={formatResidentDateTime(account.expire_time)} /></Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}><DetailItem label={residentText(dictionary, 'account_failnumber', 'Số lần đăng nhập sai')} value={emptyText(account.failnumber)} /></Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}><DetailItem label={residentText(dictionary, 'account_locked_until', 'Khóa đến')} value={formatResidentDateTime(account.locked_until)} /></Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}><BooleanChip label={residentText(dictionary, 'account_is_first_login', 'Đăng nhập lần đầu')} value={account.is_first_login} dictionary={dictionary} /></Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}><BooleanChip label={residentText(dictionary, 'account_is_biometric_supported', 'Hỗ trợ biometric')} value={account.is_biometric_supported} dictionary={dictionary} /></Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}><BooleanChip label={residentText(dictionary, 'account_is_super_admin', 'Super Admin')} value={account.is_super_admin} dictionary={dictionary} /></Grid>
                    </Grid>
                </Stack>

            </Stack>
        </Paper>
    )
}

export default ResidentAccountTab
