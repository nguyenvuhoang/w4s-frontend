import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { Box, Button, CircularProgress, IconButton, InputAdornment, MenuItem, Paper, TextField, Tooltip } from '@mui/material'
import { useMemo } from 'react'

import type { Locale } from '@/configs/i18n'
import type { BuildingSearchItem } from '@/features/properties/building/types'
import FilterSearchForm from '@/shared/components/forms/FilterSearchForm'
import { useCodeListCaptionMap } from '@/shared/hooks/useCodeListCaptionMap'
import { buildCodeListOptions } from '@/shared/utils/buildCodeListOptions'

import type { ResidentFilterModel } from '../../types'
import {
    app_usage_options,
    commonText,
    getResidentAppUsageLabel,
    getResidentBuildingSelectLabel,
    getResidentRoleFilterSelectLabel,
    getResidentStatusLabel,
    residentText,
    parseResidentBuildingFilterValue,
    search_status_options,
    RESIDENT_ROLE_CODE_GROUP,
    RESIDENT_ROLE_CODE_NAME,
    type ResidentDictionary
} from './residentListHelpers'

const formatBuildingOptionLabel = (building: BuildingSearchItem) => (
    building.building_code ? `[${building.building_code}] ${building.name}` : building.name
)

const filterControlHeight = 44

const filter_control_sx = {
    '& .MuiInputBase-root': {
        height: filterControlHeight
    }
}

const action_control_sx = {
    height: filterControlHeight,
    minHeight: filterControlHeight,
    whiteSpace: 'nowrap',
    flexShrink: 0
}

type Props = {
    dictionary: ResidentDictionary
    language: Locale
    draft_filter: ResidentFilterModel
    building_options: BuildingSearchItem[]
    building_options_loading?: boolean
    disabled?: boolean
    on_filter_change: <K extends keyof ResidentFilterModel>(key: K, value: ResidentFilterModel[K]) => void
    on_select_filter_change: <K extends keyof ResidentFilterModel>(key: K, value: ResidentFilterModel[K]) => void
    on_search: () => void
    on_reset: () => void
}

const ResidentFilterBar = ({
    dictionary,
    language,
    draft_filter,
    building_options,
    building_options_loading = false,
    disabled = false,
    on_filter_change,
    on_select_filter_change,
    on_search,
    on_reset
}: Props) => {
    const { items: resident_role_items, isLoading: resident_roles_loading } = useCodeListCaptionMap({
        code_group: RESIDENT_ROLE_CODE_GROUP,
        code_name: RESIDENT_ROLE_CODE_NAME,
        language
    })
    const resident_role_options = useMemo(
        () => buildCodeListOptions(
            resident_role_items.filter(item => item.visible === true && Boolean(item.code_value?.trim())),
            language
        ),
        [language, resident_role_items]
    )

    return (
    <Paper sx={{ px: 3, py: 1.5, borderRadius: 2, boxShadow: 2 }}>
        <FilterSearchForm
            on_search={on_search}
            sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    lg: 'minmax(260px, 1.4fr) repeat(4, minmax(170px, 1fr)) auto'
                },
                alignItems: 'center'
            }}
        >
            <Box data-tour="resident-search">
                <TextField
                    fullWidth
                    size="small"
                    sx={filter_control_sx}
                    label={residentText(dictionary, 'search_label', 'Tim kiem')}
                    placeholder={residentText(dictionary, 'search_placeholder', 'Tim theo ten, ma cu dan, so dien thoai, email, CCCD/CMND')}
                    value={draft_filter.keyword}
                    disabled={disabled}
                    onChange={event => on_filter_change('keyword', event.target.value)}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
                />
            </Box>
            <Box data-tour="building-filter">
                <TextField
                    fullWidth
                    select
                    size="small"
                    sx={filter_control_sx}
                    label={residentText(dictionary, 'filter_building_label', 'Tòa nhà')}
                    InputLabelProps={{ shrink: true }}
                    value={String(draft_filter.building_id)}
                    SelectProps={{
                        displayEmpty: true,
                        renderValue: (selectedValue: unknown) => getResidentBuildingSelectLabel(
                            dictionary,
                            building_options,
                            parseResidentBuildingFilterValue(String(selectedValue))
                        )
                    }}
                    disabled={disabled || building_options_loading}
                    onChange={event => {
                        const raw_value = event.target.value

                        on_select_filter_change('building_id', parseResidentBuildingFilterValue(raw_value))
                    }}
                    slotProps={{
                        input: {
                            endAdornment: building_options_loading ? (
                                <InputAdornment position="end"><CircularProgress size={16} /></InputAdornment>
                            ) : undefined
                        }
                    }}
                >
                    <MenuItem value="">{residentText(dictionary, 'filter_building_all_option', 'Tất cả tòa nhà')}</MenuItem>
                    {building_options.map(building => (
                        <MenuItem key={building.id} value={String(building.id)}>{formatBuildingOptionLabel(building)}</MenuItem>
                    ))}
                </TextField>
            </Box>
            <Box>
                <TextField
                    fullWidth
                    select
                    size="small"
                    sx={filter_control_sx}
                    label={residentText(dictionary, 'field_status', 'Trạng thái')}
                    value={draft_filter.status ?? 'ALL'}
                    disabled={disabled}
                    onChange={event => on_select_filter_change('status', event.target.value as ResidentFilterModel['status'])}
                >
                    {search_status_options.map(option => (
                        <MenuItem key={option} value={option}>{getResidentStatusLabel(dictionary, option)}</MenuItem>
                    ))}
                </TextField>
            </Box>
            <Box data-tour="resident-role-filter">
                <TextField
                    fullWidth
                    select
                    size="small"
                    sx={filter_control_sx}
                    label={residentText(dictionary, 'filter_role_label', 'Quyền cư dân')}
                    InputLabelProps={{ shrink: true }}
                    value={draft_filter.role ?? ''}
                    disabled={disabled || resident_roles_loading}
                    onChange={event => on_select_filter_change('role', event.target.value as ResidentFilterModel['role'])}
                    SelectProps={{
                        displayEmpty: true,
                        renderValue: selectedValue => getResidentRoleFilterSelectLabel(
                            dictionary,
                            resident_role_options,
                            String(selectedValue)
                        )
                    }}
                    slotProps={{
                        input: {
                            endAdornment: resident_roles_loading ? (
                                <InputAdornment position="end"><CircularProgress size={16} /></InputAdornment>
                            ) : undefined
                        }
                    }}
                >
                    <MenuItem value="">{commonText(dictionary, 'all', 'Tất cả')}</MenuItem>
                    {resident_role_options.map(option => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                </TextField>
            </Box>
            <Box>
                <TextField
                    fullWidth
                    select
                    size="small"
                    sx={filter_control_sx}
                    label={residentText(dictionary, 'filter_app_usage_label', 'Đã sử dụng App')}
                    value={draft_filter.app_usage ?? 'ALL'}
                    disabled={disabled}
                    onChange={event => on_select_filter_change('app_usage', event.target.value as ResidentFilterModel['app_usage'])}
                >
                    {app_usage_options.map(option => (
                        <MenuItem key={option} value={option}>{getResidentAppUsageLabel(dictionary, option)}</MenuItem>
                    ))}
                </TextField>
            </Box>
            <Box
                sx={{
                    gridColumn: { xs: 'auto', sm: '1 / -1', lg: 'auto' },
                    display: 'flex',
                    gap: 1,
                    width: { xs: '100%', sm: 'auto' }
                }}
            >
                <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SearchIcon />}
                    disabled={disabled}
                    sx={{
                        ...action_control_sx,
                        flexGrow: { xs: 1, sm: 0 },
                        minWidth: { sm: 112 }
                    }}
                >
                    <Box component="span" sx={{ display: { xs: 'inline', xl: 'none' } }}>
                        {commonText(dictionary, 'search_short', 'Tìm')}
                    </Box>
                    <Box component="span" sx={{ display: { xs: 'none', xl: 'inline' } }}>
                        {commonText(dictionary, 'search', 'Tim kiem')}
                    </Box>
                </Button>
                <Tooltip title={commonText(dictionary, 'reset', 'Lam moi')}>
                    <IconButton
                        type="button"
                        color="primary"
                        onClick={on_reset}
                        disabled={disabled}
                        data-tour="resident-refresh"
                        aria-label={commonText(dictionary, 'reset', 'Lam moi')}
                        sx={{ ...action_control_sx, width: filterControlHeight }}
                    >
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        </FilterSearchForm>
    </Paper>
)
}

export default ResidentFilterBar
