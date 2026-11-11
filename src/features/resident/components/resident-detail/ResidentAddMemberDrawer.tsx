import { Alert, Box, Button, Chip, Divider, Drawer, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'

import type { ResidentAddMemberFormValues } from '../../hooks/useResidentDetailActions'
import type { Gender, ResidentAddMemberContext, ResidentRole } from '../../types'
import { getAllowedRelationshipsByRole } from '../../utils/residentRoleRelationship'
import {
    commonText,
    gender_options,
    getResidentGenderLabel,
    residentText,
    type ResidentDictionary
} from '../resident-list/residentListHelpers'

const role_options: ResidentRole[] = ['TENANT', 'MEMBER', 'REPRESENTATIVE']

const getRoleOptionLabel = (dictionary: ResidentDictionary, role: ResidentRole) => {
    if (role === 'TENANT') return residentText(dictionary, 'option_tenant_role', 'Người thuê')
    if (role === 'MEMBER') return residentText(dictionary, 'option_member_role', 'Thành viên')
    if (role === 'REPRESENTATIVE') return residentText(dictionary, 'option_representative_role', 'Người đại diện')

    return role
}

const getRelationshipOptionLabel = (dictionary: ResidentDictionary, relationship: string) =>
    residentText(dictionary, `option_relationship_${relationship.toLowerCase()}`, relationship)

type Props = {
    dictionary: ResidentDictionary
    open: boolean
    context: ResidentAddMemberContext | null
    form_values: ResidentAddMemberFormValues
    form_errors: Partial<Record<keyof ResidentAddMemberFormValues, string>>
    general_error?: string | null
    saving: boolean
    on_close: () => void
    on_save: () => void
    on_update_form: <K extends keyof ResidentAddMemberFormValues>(key: K, value: ResidentAddMemberFormValues[K]) => void
}

const ResidentAddMemberDrawer = ({
    dictionary,
    open,
    context,
    form_values,
    form_errors,
    general_error,
    saving,
    on_close,
    on_save,
    on_update_form
}: Props) => {
    const relationship_options = getAllowedRelationshipsByRole(form_values.role)

    return (
        <Drawer anchor="right" open={open} onClose={on_close} PaperProps={{ sx: { width: { xs: '100%', sm: 560 } } }}>
            <Box sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 800 }}>
                    {residentText(dictionary, 'add_member_title', 'Thêm thành viên')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {residentText(dictionary, 'add_member_subtitle', 'Thêm thành viên mới vào căn hộ này.')}
                </Typography>
                {context && (
                    <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
                        <Chip size="small" label={`${residentText(dictionary, 'field_apartment_code', 'Căn hộ')}: ${context.apartment_code || '-'}`} />
                        <Chip size="small" label={`${residentText(dictionary, 'detail_relations_project', 'Dự án')}: ${context.project_code || '-'}`} />
                        <Chip size="small" label={`${residentText(dictionary, 'detail_relations_building', 'Tòa')}: ${context.building_code || '-'}`} />
                    </Stack>
                )}
            </Box>
            <Divider />
            <Stack spacing={2.5} sx={{ p: 3 }}>
                {general_error && <Alert severity="error">{general_error}</Alert>}
                <TextField
                    fullWidth
                    required
                    label={residentText(dictionary, 'field_full_name', 'Họ và tên')}
                    value={form_values.full_name}
                    error={Boolean(form_errors.full_name)}
                    helperText={form_errors.full_name}
                    onChange={event => on_update_form('full_name', event.target.value)}
                />
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth select label={residentText(dictionary, 'field_gender', 'Giới tính')} value={form_values.gender} onChange={event => on_update_form('gender', event.target.value as Gender)}>
                            {gender_options.filter(option => option !== 'ALL').map(option => <MenuItem key={option} value={option}>{getResidentGenderLabel(dictionary, option)}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth type="date" label={residentText(dictionary, 'field_date_of_birth', 'Ngày sinh')} value={form_values.date_of_birth} onChange={event => on_update_form('date_of_birth', event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                    </Grid>
                </Grid>
                <TextField fullWidth required label={residentText(dictionary, 'field_phone', 'Số điện thoại')} value={form_values.phone} error={Boolean(form_errors.phone)} helperText={form_errors.phone} onChange={event => on_update_form('phone', event.target.value)} />
                <TextField fullWidth label={residentText(dictionary, 'field_email', 'Email')} value={form_values.email} error={Boolean(form_errors.email)} helperText={form_errors.email} onChange={event => on_update_form('email', event.target.value)} />
                <TextField fullWidth required label={residentText(dictionary, 'field_identity_number', 'CCCD/CMND')} value={form_values.identity_number} error={Boolean(form_errors.identity_number)} helperText={form_errors.identity_number} onChange={event => on_update_form('identity_number', event.target.value)} />
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            select
                            label={residentText(dictionary, 'role', 'Quyền cư dân')}
                            value={form_values.role}
                            onChange={event => on_update_form('role', event.target.value as ResidentRole)}
                        >
                            {role_options.map(role => <MenuItem key={role} value={role}>{getRoleOptionLabel(dictionary, role)}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            select
                            required
                            label={residentText(dictionary, 'relationship_type', 'Loại cư dân')}
                            value={form_values.relationship_with_owner}
                            error={Boolean(form_errors.relationship_with_owner)}
                            helperText={form_errors.relationship_with_owner}
                            onChange={event => on_update_form('relationship_with_owner', event.target.value as ResidentAddMemberFormValues['relationship_with_owner'])}
                        >
                            {relationship_options.map(option => <MenuItem key={option} value={option}>{getRelationshipOptionLabel(dictionary, option)}</MenuItem>)}
                        </TextField>
                    </Grid>
                </Grid>
            </Stack>
            <Box sx={{ mt: 'auto', p: 3, borderTop: 1, borderColor: 'divider' }}>
                <Stack direction="row" justifyContent="flex-end" gap={1}>
                    <Button onClick={on_close}>{commonText(dictionary, 'cancel', 'Hủy')}</Button>
                    <Button variant="contained" disabled={saving} onClick={on_save}>
                        {saving ? commonText(dictionary, 'processing', 'Đang xử lý...') : commonText(dictionary, 'save', 'Lưu')}
                    </Button>
                </Stack>
            </Box>
        </Drawer>
    )
}

export default ResidentAddMemberDrawer
