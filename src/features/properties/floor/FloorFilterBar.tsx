import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { Button, Grid, InputAdornment, MenuItem, Paper, Stack, TextField } from '@mui/material'

import { commonText, FLOOR_STATUS_FILTER_OPTIONS, floorText, getFloorStatusFilterLabel } from './floorHelpers'
import type { FloorDictionary, FloorSearchFilter, FloorStatusFilter } from './types'

type Props = {
  dictionary: FloorDictionary
  filter: FloorSearchFilter
  disabled?: boolean
  onChange: <K extends keyof FloorSearchFilter>(key: K, value: FloorSearchFilter[K]) => void
  onStatusChange: (status: FloorStatusFilter) => void
  onSearch: () => void
  onReset: () => void
}

const FloorFilterBar = ({
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
          placeholder={floorText(dictionary, 'floorSearchPlaceholder', 'Search floor name or code')}
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
          onChange={event => onStatusChange(event.target.value as FloorStatusFilter)}
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          {FLOOR_STATUS_FILTER_OPTIONS.map(option => (
            <MenuItem key={option || 'all'} value={option}>{getFloorStatusFilterLabel(dictionary, option)}</MenuItem>
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

export default FloorFilterBar
