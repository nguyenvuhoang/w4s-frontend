import { useMemo } from 'react'

import { Alert, Box, Button, Chip, CircularProgress, Divider, Drawer, Grid, InputAdornment, MenuItem, Stack, TextField, Typography } from '@mui/material'

import type { Locale } from '@/configs/i18n'
import ApartmentLookup from '@/shared/components/apartment-lookup/ApartmentLookup'
import type { ApartmentLookupOption } from '@/shared/services/apartmentLookupService'
import ProjectLookup from '@/shared/components/project-lookup/ProjectLookup'
import type { ProjectLookupOption } from '@/shared/services/projectLookupService'
import { useCodeListCaptionMap } from '@/shared/hooks/useCodeListCaptionMap'
import { buildCodeListOptions } from '@/shared/utils/buildCodeListOptions'

import type { ResidentAddApartmentFormValues, ResidentAddApartmentMode } from '../../hooks/useResidentDetailActions'
import type { ResidentListStatus, ResidentRole } from '../../types'
import {
    commonText,
    getResidentStatusLabel,
    residentText,
    RESIDENT_ROLE_CODE_GROUP,
    RESIDENT_ROLE_CODE_NAME,
    status_options,
    type ResidentDictionary
} from '../resident-list/residentListHelpers'

const getDrawerTitle = (dictionary: ResidentDictionary, mode: ResidentAddApartmentMode | null) => {
    if (mode === 'OWNER') return residentText(dictionary, 'add_apartment_owner_title', 'Sở hữu thêm căn hộ')
    if (mode === 'TENANT') return residentText(dictionary, 'add_apartment_tenant_title', 'Thuê căn hộ')

    return residentText(dictionary, 'detail_add_apartment_title', 'Thêm căn hộ cho cư dân')
}

type Props = {
    dictionary: ResidentDictionary
    locale: Locale
    sessiontoken?: string
    mode: ResidentAddApartmentMode | null
    residentCode?: string | null
    residentFullName?: string | null
    form_values: ResidentAddApartmentFormValues
    form_errors: Partial<Record<keyof ResidentAddApartmentFormValues, string>>
    general_error?: string | null
    saving: boolean
    on_close: () => void
    on_save: () => void
    on_update_form: <K extends keyof ResidentAddApartmentFormValues>(key: K, value: ResidentAddApartmentFormValues[K]) => void
}

const ResidentAddApartmentDrawer = ({
    dictionary,
    locale,
    sessiontoken,
    mode,
    residentCode,
    residentFullName,
    form_values,
    form_errors,
    general_error,
    saving,
    on_close,
    on_save,
    on_update_form
}: Props) => {
    const {
        items: residentRoleCodeItems,
        isLoading: isLoadingResidentRoleCodes
    } = useCodeListCaptionMap({
        code_group: RESIDENT_ROLE_CODE_GROUP,
        code_name: RESIDENT_ROLE_CODE_NAME,
        language: locale
    })

    const residentRoleOptions = useMemo(
        () => buildCodeListOptions(residentRoleCodeItems, locale),
        [residentRoleCodeItems, locale]
    )

    const handleProjectChange = (option: ProjectLookupOption | null) => {
        on_update_form('project_id', option?.id ?? null)
        on_update_form('project_label', option?.displayLabel ?? '')
    }

    const handleApartmentChange = (option: ApartmentLookupOption | null) => {
        on_update_form('apartment_id', option?.id ?? null)
        on_update_form('apartment_label', option?.displayLabel ?? '')
    }

    return (
        <Drawer anchor="right" open={Boolean(mode)} onClose={on_close} PaperProps={{ sx: { width: { xs: '100%', sm: 560 } } }}>
            <Box sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 800 }}>
                    {getDrawerTitle(dictionary, mode)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {residentText(dictionary, 'detail_add_apartment_subtitle', 'Chọn dự án và căn hộ để liên kết với cư dân này.')}
                </Typography>
                {(residentCode || residentFullName) && (
                    <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
                        <Chip size="small" label={`${residentText(dictionary, 'detail_profile_resident_code', 'Mã cư dân')}: ${residentCode || '-'}`} />
                        <Chip size="small" label={`${residentText(dictionary, 'field_full_name', 'Họ tên')}: ${residentFullName || '-'}`} />
                    </Stack>
                )}
            </Box>
            <Divider />
            <Stack spacing={2.5} sx={{ p: 3 }}>
                {general_error && <Alert severity="error">{general_error}</Alert>}

                <ProjectLookup
                    sessiontoken={sessiontoken}
                    language={locale}
                    label={residentText(dictionary, 'project_code', 'Dự án / Khu nhà')}
                    required
                    value={form_values.project_id}
                    displayValue={form_values.project_label}
                    error={Boolean(form_errors.project_id)}
                    helperText={form_errors.project_id}
                    placeholder={residentText(dictionary, 'select_placeholder', '-- Chọn --')}
                    onChange={handleProjectChange}
                    messages={{
                        searchTitle: residentText(dictionary, 'project_search_title', 'Tìm kiếm dự án'),
                        searchLabel: residentText(dictionary, 'search_label', 'Tìm kiếm'),
                        searchButtonLabel: residentText(dictionary, 'search', 'Tìm kiếm'),
                        selectLabel: residentText(dictionary, 'select', 'Chọn'),
                        emptyText: residentText(dictionary, 'no_project_found', 'Không tìm thấy dự án phù hợp.')
                    }}
                />

                <ApartmentLookup
                    sessiontoken={sessiontoken}
                    language={locale}
                    projectId={form_values.project_id}
                    label={residentText(dictionary, 'apartment_code', 'Tầng / Căn hộ')}
                    required
                    displayValue={form_values.apartment_label}
                    error={Boolean(form_errors.apartment_id)}
                    helperText={form_errors.apartment_id}
                    placeholder={form_values.project_id
                        ? residentText(dictionary, 'select_placeholder', '-- Chọn --')
                        : residentText(dictionary, 'select_project_first', 'Vui lòng chọn dự án trước')
                    }
                    onChange={handleApartmentChange}
                    messages={{
                        searchTitle: residentText(dictionary, 'apartment_search_title', 'Tìm kiếm căn hộ'),
                        apartmentCodeLabel: residentText(dictionary, 'apartment_code', 'Mã căn hộ'),
                        apartmentTypeLabel: residentText(dictionary, 'apartment_type', 'Loại căn hộ'),
                        searchButtonLabel: residentText(dictionary, 'search', 'Tìm kiếm'),
                        selectLabel: residentText(dictionary, 'select', 'Chọn'),
                        emptyText: residentText(dictionary, 'no_apartment_found', 'Không tìm thấy căn hộ phù hợp.')
                    }}
                />

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            select
                            disabled={Boolean(mode) || isLoadingResidentRoleCodes}
                            label={residentText(dictionary, 'role', 'Quyền cư dân')}
                            value={form_values.role}
                            onChange={event => on_update_form('role', event.target.value as ResidentRole)}
                            slotProps={isLoadingResidentRoleCodes
                                ? {
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position="end" sx={{ mr: 3 }}>
                                                <CircularProgress color="inherit" size={18} />
                                            </InputAdornment>
                                        )
                                    }
                                }
                                : undefined
                            }
                        >
                            {residentRoleOptions.map(option => (
                                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            select
                            label={residentText(dictionary, 'field_status', 'Trạng thái')}
                            value={form_values.status}
                            onChange={event => on_update_form('status', event.target.value as ResidentListStatus)}
                        >
                            {status_options.filter((option): option is ResidentListStatus => option !== 'ALL').map(option => (
                                <MenuItem key={option} value={option}>{getResidentStatusLabel(dictionary, option)}</MenuItem>
                            ))}
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

export default ResidentAddApartmentDrawer
