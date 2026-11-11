import { Alert, Box, Button, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'

import type { Locale } from '@/configs/i18n'
import CountryLookup from '@/shared/components/country-lookup/CountryLookup'
import { countryLookupLabel, type CountryLookupOption } from '@/shared/services/countryLookupService'

import type { Gender, ResidentListStatus, ResidentPayload } from '../../types'
import {
    commonText,
    gender_options,
    getResidentGenderLabel,
    getResidentStatusLabel,
    normalizeResidentCode,
    residentText,
    status_options,
    type ResidentDictionary
} from '../resident-list/residentListHelpers'

type Props = {
    dictionary: ResidentDictionary
    locale: Locale
    sessiontoken?: string
    form_values: ResidentPayload | null
    form_errors: Partial<Record<keyof ResidentPayload, string>>
    general_error?: string | null
    saving: boolean
    on_save: () => void
    on_update_form: <K extends keyof ResidentPayload>(key: K, value: ResidentPayload[K]) => void
}

const ResidentProfileEditTab = ({
    dictionary,
    locale,
    sessiontoken,
    form_values,
    form_errors,
    general_error,
    saving,
    on_save,
    on_update_form
}: Props) => {
    if (!form_values) {
        return (
            <Alert severity="info">
                {residentText(dictionary, 'detail_empty_no_data', 'Không có dữ liệu cư dân.')}
            </Alert>
        )
    }

    return (
        <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
            <Stack spacing={0.5} sx={{ mb: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    {residentText(dictionary, 'edit_tab_profile', 'Thông tin cư dân')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {residentText(dictionary, 'form_subtitle', 'Cập nhật thông tin định danh và liên hệ của cư dân.')}
                </Typography>
            </Stack>
            <Stack spacing={2.5}>
                {general_error && <Alert severity="error">{general_error}</Alert>}
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            required
                            disabled
                            label={residentText(dictionary, 'field_resident_code', 'Mã cư dân')}
                            value={form_values.resident_code}
                            error={Boolean(form_errors.resident_code)}
                            helperText={form_errors.resident_code}
                            onChange={event => on_update_form('resident_code', normalizeResidentCode(event.target.value))}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            disabled
                            label={residentText(dictionary, 'field_user_code', 'User code')}
                            value={form_values.user_code ?? ''}
                        />
                    </Grid>
                </Grid>
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
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label={residentText(dictionary, 'field_phone', 'Số điện thoại')} value={form_values.phone} error={Boolean(form_errors.phone)} helperText={form_errors.phone} onChange={event => on_update_form('phone', event.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label={residentText(dictionary, 'field_email', 'Email')} value={form_values.email} error={Boolean(form_errors.email)} helperText={form_errors.email} onChange={event => on_update_form('email', event.target.value)} />
                    </Grid>
                </Grid>
                <TextField fullWidth label={residentText(dictionary, 'field_identity_number', 'CCCD/CMND')} value={form_values.identity_number} error={Boolean(form_errors.identity_number)} helperText={form_errors.identity_number} onChange={event => on_update_form('identity_number', event.target.value)} />
                <CountryLookup
                    sessiontoken={sessiontoken}
                    language={locale}
                    label={residentText(dictionary, 'nationality', 'Quốc gia')}
                    value={form_values.nationality_country_id}
                    displayValue={form_values.nationality}
                    error={Boolean(form_errors.nationality)}
                    helperText={form_errors.nationality}
                    onChange={(country: CountryLookupOption | null) => {
                        on_update_form('nationality_country_id', country?.country_id ?? '')
                        on_update_form('nationality', country ? countryLookupLabel(country, locale) : '')
                    }}
                    messages={{
                        searchTitle: residentText(dictionary, 'country_lookup_title', 'Tìm kiếm quốc gia'),
                        searchLabel: residentText(dictionary, 'country_lookup_search_label', 'Tìm theo tên hoặc mã quốc gia'),
                        countryCodeLabel: residentText(dictionary, 'country_code', 'Mã quốc gia'),
                        searchButtonLabel: residentText(dictionary, 'search', 'Tìm kiếm'),
                        selectLabel: residentText(dictionary, 'country_lookup_select', 'Chọn quốc gia'),
                        emptyText: residentText(dictionary, 'country_lookup_empty', 'Không tìm thấy quốc gia phù hợp.'),
                        errorReferenceLabel: residentText(dictionary, 'country_lookup_error_reference', 'Mã tra cứu lỗi'),
                        clearLabel: residentText(dictionary, 'country_lookup_clear', 'Xóa quốc gia')
                    }}
                />
                <TextField fullWidth multiline minRows={3} label={residentText(dictionary, 'description', 'Mô tả')} value={form_values.description} error={Boolean(form_errors.description)} helperText={form_errors.description} onChange={event => on_update_form('description', event.target.value)} />
                <TextField fullWidth label={residentText(dictionary, 'field_avatar_url', 'Avatar URL')} value={form_values.avatar_url ?? ''} onChange={event => on_update_form('avatar_url', event.target.value || null)} />
                <TextField fullWidth select label={residentText(dictionary, 'field_status', 'Trạng thái')} value={form_values.status} onChange={event => on_update_form('status', event.target.value as ResidentListStatus)}>
                    {status_options.filter(option => option !== 'ALL').map(option => <MenuItem key={option} value={option}>{getResidentStatusLabel(dictionary, option)}</MenuItem>)}
                </TextField>
            </Stack>
            <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Stack direction="row" justifyContent="flex-end" gap={1}>
                    <Button variant="contained" disabled={saving} onClick={on_save}>
                        {saving ? commonText(dictionary, 'processing', 'Đang xử lý...') : commonText(dictionary, 'save', 'Lưu')}
                    </Button>
                </Stack>
            </Box>
        </Paper>
    )
}

export default ResidentProfileEditTab
