'use client'

import CloseIcon from '@mui/icons-material/Close'
import PersonIcon from '@mui/icons-material/Person'
import { Alert, Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import type { ChangeEvent } from 'react'
import { useMemo } from 'react'

import { useCodeListCaptionMap } from '@/shared/hooks/useCodeListCaptionMap'
import { buildCodeListOptions } from '@/shared/utils/buildCodeListOptions'

import type { StaffDictionary, StaffStatus, StaffUpdatePayload } from '../types'
import { normalizeStaffGender } from '../utils/staffGender'
import { toStaffDateInputValue } from '../utils/staffDate'
import { commonText, gender_options, getStaffGenderLabel, getStaffStatusLabel, staffText, status_options } from './staff-list/staffListHelpers'

// Same CodeList source as the Create screen's Department select (StaffDetailContent also reads it
// to caption the department on the detail card): code_group = IPS, code_name = DEPARTMENT.
const DEPARTMENT_CODE_GROUP = 'IPS'
const DEPARTMENT_CODE_NAME = 'DEPARTMENT'

type Props = {
    dictionary: StaffDictionary
    locale: string
    open: boolean
    form_values: StaffUpdatePayload
    form_errors: Partial<Record<keyof StaffUpdatePayload, string>>
    modal_error?: string | null
    current_avatar_url?: string | null
    selected_avatar_file?: File | null
    avatar_preview_url?: string | null
    avatar_error?: string | null
    saving_label?: string | null
    saving: boolean
    on_close: () => void
    on_save: () => void
    on_update_form: <K extends keyof StaffUpdatePayload>(key: K, value: StaffUpdatePayload[K]) => void
    on_update_avatar_file: (file: File | null) => void
}

const StaffModifyDialog = ({
    dictionary,
    locale,
    open,
    form_values,
    form_errors,
    modal_error,
    current_avatar_url,
    selected_avatar_file,
    avatar_preview_url,
    avatar_error,
    saving_label,
    saving,
    on_close,
    on_save,
    on_update_form,
    on_update_avatar_file
}: Props) => {
    const avatar_src = avatar_preview_url || current_avatar_url || undefined

    const { items: department_items } = useCodeListCaptionMap({
        code_group: DEPARTMENT_CODE_GROUP,
        code_name: DEPARTMENT_CODE_NAME,
        language: locale
    })

    const department_options = useMemo(
        () => buildCodeListOptions(department_items, locale),
        [department_items, locale]
    )

    // Preselect the user's current department. If that code is no longer in the CodeList
    // (renamed/removed), fall back to showing the raw code instead of losing the value or
    // tripping MUI's out-of-range Select warning.
    const department_code_value = form_values.department_code ?? ''
    const department_has_match = department_options.some(option => option.value === department_code_value)
    const birthday_value = toStaffDateInputValue(form_values.birthday)

    const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
        on_update_avatar_file(event.target.files?.[0] ?? null)
        event.target.value = ''
    }

    return (
    <Dialog
        open={open}
        fullWidth
        maxWidth="md"
        disableEscapeKeyDown
        onClose={(_, reason) => {
            if (reason === 'backdropClick' || reason === 'escapeKeyDown') return

            on_close()
        }}
        slotProps={{
            paper : {
                sx: {
                    borderRadius: 2
                }
            }
        }}
    >
        <DialogTitle sx={{ pr: 7 }}>
            <Typography variant="h5" component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>
                {staffText(dictionary, 'modify_title', 'Modify user')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {staffText(dictionary, 'modify_subtitle', 'Update basic account information only.')}
            </Typography>
            <IconButton
                aria-label={commonText(dictionary, 'close', 'Close')}
                onClick={on_close}
                disabled={saving}
                sx={{ position: 'absolute', right: 16, top: 16 }}
            >
                <CloseIcon />
            </IconButton>
        </DialogTitle>
        <DialogContent dividers>
            <Stack spacing={2.5} sx={{ py: 1 }}>
                {modal_error && (
                    <Alert severity="error">
                        {modal_error}
                    </Alert>
                )}
                {(form_errors.id || form_errors.user_id || form_errors.login_name) && (
                    <Alert severity="error">
                        {form_errors.id || form_errors.user_id || form_errors.login_name}
                    </Alert>
                )}
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>
                        {staffText(dictionary, 'field_avatar', 'Avatar')}
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                        <Avatar src={avatar_src} sx={{ width: 88, height: 88, bgcolor: 'primary.main', color: 'common.white', fontSize: 34, fontWeight: 900 }}>
                            {form_values.full_name.slice(0, 1) || form_values.login_name.slice(0, 1) || <PersonIcon />}
                        </Avatar>
                        <Stack spacing={1} sx={{ minWidth: 0 }}>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Button variant="outlined" component="label" disabled={saving}>
                                    {staffText(dictionary, 'avatar_choose_file', 'Choose image')}
                                    <input hidden type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" onChange={handleAvatarChange} />
                                </Button>
                                {selected_avatar_file && (
                                    <Button color="inherit" variant="text" disabled={saving} onClick={() => on_update_avatar_file(null)}>
                                        {staffText(dictionary, 'avatar_clear_file', 'Remove selected image')}
                                    </Button>
                                )}
                            </Stack>
                            <Typography variant="caption" color={avatar_error ? 'error' : 'text.secondary'} sx={{ overflowWrap: 'anywhere' }}>
                                {avatar_error || selected_avatar_file?.name || staffText(dictionary, 'avatar_helper', 'PNG, JPG, JPEG or WEBP. Maximum 5MB.')}
                            </Typography>
                        </Stack>
                    </Stack>
                </Box>
                <TextField
                    fullWidth
                    required
                    disabled
                    label={staffText(dictionary, 'field_username', 'Username')}
                    value={form_values.login_name}
                    error={Boolean(form_errors.login_name)}
                    helperText={form_errors.login_name}
                />
                <TextField
                    fullWidth
                    required
                    label={staffText(dictionary, 'field_full_name', 'Full name')}
                    value={form_values.full_name}
                    error={Boolean(form_errors.full_name)}
                    helperText={form_errors.full_name}
                    onChange={event => on_update_form('full_name', event.target.value)}
                />
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label={staffText(dictionary, 'field_email', 'Email')} value={form_values.email} onChange={event => on_update_form('email', event.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label={staffText(dictionary, 'field_phone', 'Phone')} value={form_values.phone} onChange={event => on_update_form('phone', event.target.value)} />
                    </Grid>
                </Grid>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required select label={staffText(dictionary, 'field_gender', 'Gender')} value={form_values.gender} error={Boolean(form_errors.gender)} helperText={form_errors.gender} onChange={event => on_update_form('gender', normalizeStaffGender(event.target.value))} slotProps={{ inputLabel: { shrink: true } }}>
                            <MenuItem value="">{staffText(dictionary, 'not_selected', 'Not selected')}</MenuItem>
                            {gender_options.map(option => <MenuItem key={option} value={option}>{getStaffGenderLabel(dictionary, option)}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <DatePicker
                            label={staffText(dictionary, 'field_birthday', 'Birthday')}
                            value={birthday_value ? dayjs(birthday_value) : null}
                            maxDate={dayjs()}
                            format="DD/MM/YYYY"
                            onChange={value => on_update_form('birthday', value && value.isValid() ? value.format('YYYY-MM-DD') : '')}
                            slotProps={{ textField: { fullWidth: true, slotProps: { inputLabel: { shrink: true } } } }}
                        />
                    </Grid>
                </Grid>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth select label={staffText(dictionary, 'field_status', 'Status')} value={form_values.status} onChange={event => on_update_form('status', event.target.value as StaffStatus)} slotProps={{ inputLabel: { shrink: true } }}>
                            {status_options.map(option => <MenuItem key={option} value={option}>{getStaffStatusLabel(dictionary, option)}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth type="number" label={staffText(dictionary, 'field_user_level', 'User level')} value={form_values.user_level} onChange={event => on_update_form('user_level', event.target.value === '' ? '' : Number(event.target.value))} />
                    </Grid>
                </Grid>
                <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label={staffText(dictionary, 'field_address', 'Address')}
                    value={form_values.address}
                    onChange={event => on_update_form('address', event.target.value)}
                />
                <TextField
                    fullWidth
                    select
                    label={staffText(dictionary, 'field_department', 'Department')}
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={department_code_value}
                    onChange={event => on_update_form('department_code', event.target.value)}
                >
                    {department_code_value && !department_has_match && (
                        <MenuItem value={department_code_value}>{department_code_value}</MenuItem>
                    )}
                    {department_options.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label={staffText(dictionary, 'field_description', 'Description')}
                    value={form_values.description}
                    onChange={event => on_update_form('description', event.target.value)}
                />
            </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
            <Button disabled={saving} onClick={on_close}>{commonText(dictionary, 'cancel', 'Cancel')}</Button>
            <Button variant="contained" disabled={saving} onClick={on_save}>
                {saving ? (saving_label || commonText(dictionary, 'processing', 'Processing...')) : commonText(dictionary, 'save', 'Save')}
            </Button>
        </DialogActions>
    </Dialog>
    )
}

export default StaffModifyDialog
