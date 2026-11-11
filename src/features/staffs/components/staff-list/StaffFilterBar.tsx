import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { Box, Button, IconButton, InputAdornment, MenuItem, Paper, TextField, Tooltip } from '@mui/material'
import { useMemo, useState } from 'react'

import type { Locale } from '@/configs/i18n'
import FilterSearchForm from '@/shared/components/forms/FilterSearchForm'
import ProjectLookup from '@/shared/components/project-lookup/ProjectLookup'
import type { ProjectLookupOption } from '@/shared/services/projectLookupService'
import { useCodeListCaptionMap } from '@/shared/hooks/useCodeListCaptionMap'
import { buildCodeListOptions } from '@/shared/utils/buildCodeListOptions'

import type { StaffDictionary, StaffFilterModel } from '../../types'
import {
    commonText,
    getStaffLoginFilterLabel,
    staff_login_filter_options,
    staffText
} from './staffListHelpers'

type Props = {
    dictionary: StaffDictionary
    draft_filter: StaffFilterModel
    text_namespace?: 'staffs' | 'residents_tenants'
    sessiontoken?: string
    language: Locale
    on_filter_change: <K extends keyof StaffFilterModel>(key: K, value: StaffFilterModel[K]) => void
    on_select_filter_change: <K extends keyof StaffFilterModel>(key: K, value: StaffFilterModel[K]) => void
    on_search: () => void
    on_reset: () => void
}

// Same CodeList source as Create/Edit Staff's Department select.
const DEPARTMENT_CODE_GROUP = 'IPS'
const DEPARTMENT_CODE_NAME = 'DEPARTMENT'

// Status filter options come from the USER_STATUS CodeList instead of a hard-coded list.
const USER_STATUS_CODE_GROUP = 'CTH'
const USER_STATUS_CODE_NAME = 'USER_STATUS'

// Sentinel kept in sync with empty_staff_filter.status / staffService: "no status filter".
const STATUS_ALL_VALUE = 'ALL'

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

const StaffFilterBar = ({ dictionary, draft_filter, text_namespace = 'staffs', sessiontoken, language, on_filter_change, on_select_filter_change, on_search, on_reset }: Props) => {
    const [selected_project, setSelectedProject] = useState<ProjectLookupOption | null>(null)

    const { items: department_items } = useCodeListCaptionMap({
        code_group: DEPARTMENT_CODE_GROUP,
        code_name: DEPARTMENT_CODE_NAME,
        language
    })

    const department_options = useMemo(
        () => buildCodeListOptions(department_items, language),
        [department_items, language]
    )

    // Status dropdown is driven by the USER_STATUS CodeList: visible items only, sorted by
    // code_index, value = code_value ?? code_id, label = m_caption[locale] with caption/code fallback.
    // On CodeList failure items is [] — the dropdown still renders the "All" option and stays usable.
    const { items: status_items } = useCodeListCaptionMap({
        code_group: USER_STATUS_CODE_GROUP,
        code_name: USER_STATUS_CODE_NAME,
        language
    })

    const status_options = useMemo(
        () => buildCodeListOptions(status_items, language),
        [status_items, language]
    )

    // A status restored from the URL may not be present in the CodeList (or CodeList failed to
    // load) — keep it selectable as a raw fallback so the active filter still shows.
    const status_value = draft_filter.status || STATUS_ALL_VALUE
    const status_has_match = status_options.some(option => option.value === status_value)

    // A department_code restored from the URL may no longer exist in the CodeList — keep it
    // selectable as a raw fallback so the active filter still shows instead of resetting.
    const department_code_value = draft_filter.department_code ?? ''
    const department_has_match = department_options.some(option => option.value === department_code_value)

    return (
    <Paper sx={{ px: 3, py: 2, borderRadius: 2, boxShadow: 2 }}>
        <FilterSearchForm
            on_search={on_search}
            sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    lg: 'minmax(240px, 1.4fr) repeat(4, minmax(160px, 1fr)) auto'
                },
                alignItems: 'center'
            }}
        >
            <TextField
                fullWidth
                size="small"
                sx={filter_control_sx}
                label={staffText(dictionary, 'search_label', 'Search', text_namespace)}
                placeholder={staffText(dictionary, 'search_placeholder', 'Search by username, full name, email or phone', text_namespace)}
                value={draft_filter.search_text}
                onChange={event => on_filter_change('search_text', event.target.value)}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
            />

            <TextField
                fullWidth
                select
                size="small"
                sx={filter_control_sx}
                label={staffText(dictionary, 'field_status', 'Status', text_namespace)}
                value={status_value}
                onChange={event => on_select_filter_change('status', event.target.value as StaffFilterModel['status'])}
            >
                <MenuItem value={STATUS_ALL_VALUE}>{commonText(dictionary, 'all', 'All')}</MenuItem>
                {status_value !== STATUS_ALL_VALUE && !status_has_match && (
                    <MenuItem value={status_value}>{status_value}</MenuItem>
                )}
                {status_options.map(option => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
            </TextField>

            <Box sx={{ ...filter_control_sx, minWidth: 0 }}>
                <ProjectLookup
                    shrinkLabel
                    sessiontoken={sessiontoken}
                    language={language}
                    label={staffText(dictionary, 'field_project', 'Project', text_namespace)}
                    placeholder={staffText(dictionary, 'project_filter_placeholder', 'All projects', text_namespace)}
                    value={draft_filter.project_code ? selected_project?.id ?? null : null}
                    displayValue={draft_filter.project_code}
                    filterOption={option => option.status === 'A'}
                    clearable
                    clearLabel={staffText(dictionary, 'project_filter_clear', 'Clear project filter', text_namespace)}
                    onChange={option => {
                        setSelectedProject(option)
                        on_select_filter_change('project_code', option?.code ?? '')
                    }}
                    messages={{
                        searchTitle: staffText(dictionary, 'project_filter_search_title', 'Select project', text_namespace),
                        searchLabel: staffText(dictionary, 'project_filter_search_label', 'Search project', text_namespace),
                        searchButtonLabel: commonText(dictionary, 'search', 'Search'),
                        selectLabel: staffText(dictionary, 'project_filter_select', 'Select', text_namespace),
                        emptyText: staffText(dictionary, 'project_filter_empty', 'No project found.', text_namespace)
                    }}
                />
            </Box>

            <TextField
                fullWidth
                select
                size="small"
                sx={filter_control_sx}
                label={staffText(dictionary, 'field_is_login', 'Login', text_namespace)}
                value={draft_filter.is_login}
                onChange={event => on_select_filter_change('is_login', event.target.value as StaffFilterModel['is_login'])}
            >
                {staff_login_filter_options.map(option => (
                    <MenuItem key={option} value={option}>{getStaffLoginFilterLabel(dictionary, option, text_namespace)}</MenuItem>
                ))}
            </TextField>

            <TextField
                fullWidth
                select
                size="small"
                sx={filter_control_sx}
                label={staffText(dictionary, 'field_department', 'Department', text_namespace)}
                slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
                value={department_code_value}
                onChange={event => on_select_filter_change('department_code', event.target.value)}
            >
                <MenuItem value="">{staffText(dictionary, 'department_filter_all', 'All', text_namespace)}</MenuItem>
                {department_code_value && !department_has_match && (
                    <MenuItem value={department_code_value}>{department_code_value}</MenuItem>
                )}
                {department_options.map(option => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
            </TextField>

            <Box sx={{ gridColumn: { xs: 'auto', sm: '1 / -1', lg: 'auto' }, display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
                <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SearchIcon />}
                    sx={{ ...action_control_sx, flexGrow: { xs: 1, sm: 0 }, minWidth: { sm: 112 } }}
                >
                    {commonText(dictionary, 'search', 'Search')}
                </Button>
                <Tooltip title={commonText(dictionary, 'reset', 'Reset')}>
                    <IconButton
                        type="button"
                        color="primary"
                        onClick={on_reset}
                        aria-label={commonText(dictionary, 'reset', 'Reset')}
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

export default StaffFilterBar
