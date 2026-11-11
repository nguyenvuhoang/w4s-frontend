import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import {
  Button,
  Grid,
  InputAdornment,
  Paper,
  Stack,
  TextField
} from '@mui/material'

import type { FeeDictionary, FeeTypeFilterModel } from '../types'
import { commonText, feeText } from './feeTypeHelpers'

type Props = {
  dictionary: FeeDictionary
  filter: FeeTypeFilterModel
  onChange: <K extends keyof FeeTypeFilterModel>(key: K, value: FeeTypeFilterModel[K]) => void
  onSearch: () => void
  onReset: () => void
}

const FeeTypeFilterBar = ({
  dictionary,
  filter,
  onChange,
  onSearch,
  onReset
}: Props) => (
  <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
    <Grid container spacing={2} alignItems="center">
      <Grid size={{ xs: 12, md: 9 }}>
        <TextField
          fullWidth
          size="small"
          label={feeText(dictionary, 'search_label', 'Search')}
          placeholder={feeText(dictionary, 'fee_type_search_placeholder', 'Search by code, name or description')}
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
      <Grid size={{ xs: 12, md: 3 }}>
        <Stack direction="row" gap={1}>
          <Button fullWidth variant="contained" startIcon={<SearchIcon />} onClick={onSearch}>
            {commonText(dictionary, 'search', 'Search')}
          </Button>
          <Button fullWidth variant="outlined" startIcon={<RefreshIcon />} onClick={onReset}>
            {commonText(dictionary, 'refresh', 'Refresh')}
          </Button>
        </Stack>
      </Grid>
    </Grid>
  </Paper>
)

export default FeeTypeFilterBar
