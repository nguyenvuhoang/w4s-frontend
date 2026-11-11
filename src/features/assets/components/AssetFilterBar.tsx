import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import {
  Button,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField
} from '@mui/material'

import FilterSearchForm from '@/shared/components/forms/FilterSearchForm'

import type { AssetDictionary, AssetFilterModel } from '../types'
import {
  assetCategoryOptions,
  assetStatusOptions,
  assetText,
  commonText,
  getAssetCategoryLabel,
  getAssetStatusLabel
} from './assetHelpers'

type Props = {
  dictionary: AssetDictionary
  filter: AssetFilterModel
  onChange: <K extends keyof AssetFilterModel>(key: K, value: AssetFilterModel[K]) => void
  onCategoryChange: (value: string) => void
  onStatusChange: (value: string) => void
  onSearch: () => void
  onReset: () => void
}

const AssetFilterBar = ({
  dictionary,
  filter,
  onChange,
  onCategoryChange,
  onStatusChange,
  onSearch,
  onReset
}: Props) => (
  <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
    <FilterSearchForm on_search={onSearch}>
      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField
            fullWidth
            size="small"
            label={assetText(dictionary, 'search_label', 'Search')}
            placeholder={assetText(dictionary, 'search_placeholder', 'Search by asset code, name, location or QR code')}
            value={filter.search_text}
            onChange={event => onChange('search_text', event.target.value)}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
              }
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <TextField
            fullWidth
            select
            size="small"
            label={assetText(dictionary, 'category', 'Category')}
            value={filter.category}
            onChange={event => onCategoryChange(event.target.value)}
          >
            <MenuItem value="">{commonText(dictionary, 'all', 'All')}</MenuItem>
            {assetCategoryOptions.map(category => (
              <MenuItem key={category} value={category}>{getAssetCategoryLabel(dictionary, category)}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <TextField
            fullWidth
            select
            size="small"
            label={assetText(dictionary, 'status', 'Status')}
            value={filter.status}
            onChange={event => onStatusChange(event.target.value)}
          >
            <MenuItem value="">{commonText(dictionary, 'all', 'All')}</MenuItem>
            {assetStatusOptions.map(status => (
              <MenuItem key={status} value={status}>{getAssetStatusLabel(dictionary, status)}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} sx={{ width: '100%' }}>
            <Button
              fullWidth
              type="submit"
              variant="contained"
              startIcon={<SearchIcon />}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {commonText(dictionary, 'search', 'Search')}
            </Button>
            <Button
              fullWidth
              type="button"
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onReset}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {commonText(dictionary, 'reset', 'Reset')}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </FilterSearchForm>
  </Paper>
)

export default AssetFilterBar
