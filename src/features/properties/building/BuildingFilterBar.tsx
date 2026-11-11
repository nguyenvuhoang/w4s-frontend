import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { Button, Grid, InputAdornment, MenuItem, Paper, Stack, TextField } from '@mui/material'

import { BUILDING_STATUS_FILTER_OPTIONS, buildingText, commonText, getBuildingStatusFilterLabel } from './buildingHelpers'
import type { BuildingDictionary, BuildingSearchFilter, BuildingStatusFilter } from './types'

type Props = {
  dictionary: BuildingDictionary
  filter: BuildingSearchFilter
  disabled?: boolean
  onChange: <K extends keyof BuildingSearchFilter>(key: K, value: BuildingSearchFilter[K]) => void
  onStatusChange: (status: BuildingStatusFilter) => void
  onSearch: () => void
  onReset: () => void
}

const BuildingFilterBar = ({
  dictionary,
  filter,
  disabled = false,
  onChange,
  onStatusChange,
  onSearch,
  onReset
}: Props) => (
  <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
    <Grid container spacing={2} alignItems="center">
      <Grid size={{ xs: 12, md: 5 }}>
        <TextField
          fullWidth
          size="small"
          label={commonText(dictionary, 'search', 'Search')}
          placeholder={buildingText(dictionary, 'buildingSearchPlaceholder', 'Search by building name or code')}
          value={filter.search_text}
          onChange={event => onChange('search_text', event.target.value)}
          onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); onSearch() } }}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
            }
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <TextField
          select
          fullWidth
          size="small"
          label={commonText(dictionary, 'status', 'Status')}
          value={filter.status ?? ''}
          disabled={disabled}
          onChange={event => onStatusChange(event.target.value as BuildingStatusFilter)}
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          {BUILDING_STATUS_FILTER_OPTIONS.map(option => (
            <MenuItem key={option || 'all'} value={option}>{getBuildingStatusFilterLabel(dictionary, option)}</MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Stack direction="row" gap={1}>
          <Button fullWidth variant="contained" startIcon={<SearchIcon />} onClick={onSearch} disabled={disabled}>
            {commonText(dictionary, 'search', 'Search')}
          </Button>
          <Button fullWidth variant="outlined" startIcon={<RefreshIcon />} onClick={onReset} disabled={disabled}>
            {commonText(dictionary, 'reset', 'Reset')}
          </Button>
        </Stack>
      </Grid>
    </Grid>
  </Paper>
)

export default BuildingFilterBar
