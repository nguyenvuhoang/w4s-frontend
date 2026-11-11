import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { Button, Grid, InputAdornment, MenuItem, Paper, Stack, TextField } from '@mui/material'

import { apartmentStatusOptions, apartmentText, commonText } from './apartmentHelpers'
import type { ApartmentDictionary, ApartmentSearchFilter } from './types'

type Props = {
  dictionary: ApartmentDictionary
  filter: ApartmentSearchFilter
  disabled?: boolean
  onChange: <K extends keyof ApartmentSearchFilter>(key: K, value: ApartmentSearchFilter[K]) => void
  onSelectChange: <K extends 'status'>(key: K, value: ApartmentSearchFilter[K]) => void
  onSearch: () => void
  onReset: () => void
}

const ApartmentFilterBar = ({
  dictionary,
  filter,
  disabled = false,
  onChange,
  onSelectChange,
  onSearch,
  onReset
}: Props) => (
  <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
    <Grid container spacing={2} alignItems="center">
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          size="small"
          label={commonText(dictionary, 'search', 'Search')}
          placeholder={apartmentText(dictionary, 'apartmentSearchPlaceholder', 'Search full apartment code or owner')}
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
          fullWidth
          select
          size="small"
          label={apartmentText(dictionary, 'status', 'Status')}
          value={filter.status}
          onChange={event => onSelectChange('status', event.target.value as ApartmentSearchFilter['status'])}
        >
          {apartmentStatusOptions.map(option => (
            <MenuItem key={option} value={option}>{apartmentText(dictionary, `status${option}`, option)}</MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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

export default ApartmentFilterBar
