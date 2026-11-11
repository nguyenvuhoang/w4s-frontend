'use client'

import RestartAltRounded from '@mui/icons-material/RestartAltRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import { Button, Grid, InputAdornment, MenuItem, Paper, Stack, TextField } from '@mui/material'

import type { FeePeriodFilterModel, FeeProjectOption } from '@/features/fees/types'
import type { CodeListOption } from '@/shared/utils/buildCodeListOptions'
import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import { FEE_PERIOD_MONTHS, getFeePeriodFilterYearOptions } from '../feePeriod.helpers'
import { feeSettingsText } from '../feeSettingsModules'
import type { FeePeriodSelectFilterKey } from '../hooks/useFeePeriodSearch'

type FeePeriodFilterBarProps = {
  dictionary: SystemSettingsDictionary
  /** Applied filter (the selects show what is currently searched). */
  filter: FeePeriodFilterModel
  searchInput: string
  projects: FeeProjectOption[]
  statusOptions: CodeListOption[]
  statusLoading: boolean
  loading: boolean
  onSearchInputChange: (value: string) => void
  onFilterChange: (key: FeePeriodSelectFilterKey, value: number | string | null) => void
  onSearch: () => void
  onReset: () => void
}

/** Select value for "all"; never sent to the workflow (the key is omitted instead). */
const ALL = ''

const toNumberOrNull = (value: unknown) => (value === ALL || value === null || value === undefined ? null : Number(value))

/** Selects search immediately; the search box only searches on Enter or the Search button. */
const FeePeriodFilterBar = ({
  dictionary,
  filter,
  searchInput,
  projects,
  statusOptions,
  statusLoading,
  loading,
  onSearchInputChange,
  onFilterChange,
  onSearch,
  onReset
}: FeePeriodFilterBarProps) => {
  const text = (key: string, fallback: string) => feeSettingsText(dictionary, key, fallback)
  const selectSlotProps = { select: { displayEmpty: true }, inputLabel: { shrink: true } }

  return (
    <Paper variant='outlined' sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <TextField
            fullWidth
            size='small'
            label={text('search', 'Search')}
            value={searchInput}
            onChange={event => onSearchInputChange(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') onSearch()
            }}
            placeholder={text('period_search_placeholder', 'Search by period code')}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchRounded fontSize='small' />
                  </InputAdornment>
                )
              }
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <TextField
            select
            fullWidth
            size='small'
            label={text('field_project', 'Project')}
            value={filter.project_id ?? ALL}
            onChange={event => onFilterChange('project_id', toNumberOrNull(event.target.value))}
            slotProps={selectSlotProps}
          >
            <MenuItem value={ALL}>{text('filter_all_projects', 'All projects')}</MenuItem>
            {projects.map(project => (
              <MenuItem key={project.id} value={project.id}>
                {project.code ? `[${project.code}] ${project.name}` : project.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, sm: 4, lg: 2 }}>
          <TextField
            select
            fullWidth
            size='small'
            label={text('field_year', 'Year')}
            value={filter.year ?? ALL}
            onChange={event => onFilterChange('year', toNumberOrNull(event.target.value))}
            slotProps={selectSlotProps}
          >
            <MenuItem value={ALL}>{text('filter_all_years', 'All years')}</MenuItem>
            {getFeePeriodFilterYearOptions().map(year => <MenuItem key={year} value={year}>{year}</MenuItem>)}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, sm: 4, lg: 2 }}>
          <TextField
            select
            fullWidth
            size='small'
            label={text('field_month', 'Month / Period')}
            value={filter.month ?? ALL}
            onChange={event => onFilterChange('month', toNumberOrNull(event.target.value))}
            slotProps={selectSlotProps}
          >
            <MenuItem value={ALL}>{text('filter_all_months', 'All periods')}</MenuItem>
            {FEE_PERIOD_MONTHS.map(month => (
              <MenuItem key={month} value={month}>
                {text('filter_month_option', 'Month {month}').replace('{month}', String(month))}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, sm: 4, lg: 2 }}>
          <TextField
            select
            fullWidth
            size='small'
            label={text('field_status', 'Status')}
            value={filter.status || ALL}
            onChange={event => onFilterChange('status', String(event.target.value))}
            disabled={statusLoading}
            slotProps={selectSlotProps}
          >
            <MenuItem value={ALL}>{text('filter_all_statuses', 'All statuses')}</MenuItem>
            {statusOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      <Stack direction='row' justifyContent='flex-end' gap={1} sx={{ mt: 2 }}>
        <Button variant='outlined' startIcon={<RestartAltRounded />} onClick={onReset} disabled={loading}>
          {text('reset', 'Reset')}
        </Button>
        <Button variant='contained' startIcon={<SearchRounded />} onClick={onSearch} disabled={loading}>
          {text('search', 'Search')}
        </Button>
      </Stack>
    </Paper>
  )
}

export default FeePeriodFilterBar
