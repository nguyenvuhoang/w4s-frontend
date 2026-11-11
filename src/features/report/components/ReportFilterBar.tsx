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

import type { ReportDictionary, ReportFilterModel } from '../types'
import { commonText, reportText } from './reportHelpers'

type Props = {
  dictionary: ReportDictionary
  filter: ReportFilterModel
  onChange: <K extends keyof ReportFilterModel>(key: K, value: ReportFilterModel[K]) => void
  onSearch: () => void
  onReset: () => void
}

const ReportFilterBar = ({
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
          label={commonText(dictionary, 'search', 'Search')}
          placeholder={reportText(dictionary, 'report_search_placeholder', 'Search by report code, name or description')}
          value={filter.search_text}
          onChange={event => onChange('search_text', event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') onSearch()
          }}
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

export default ReportFilterBar
