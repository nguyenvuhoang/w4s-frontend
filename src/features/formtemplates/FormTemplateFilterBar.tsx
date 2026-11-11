import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { Button, Grid, InputAdornment, Paper, Stack, TextField } from '@mui/material'

import { commonText, formTemplateText } from './formTemplateHelpers'
import type { FormTemplateDictionary, FormTemplateSearchFilter } from './types'

type Props = {
  dictionary: FormTemplateDictionary
  filter: FormTemplateSearchFilter
  disabled?: boolean
  onChange: <K extends keyof FormTemplateSearchFilter>(key: K, value: FormTemplateSearchFilter[K]) => void
  onSearch: () => void
  onReset: () => void
}

const FormTemplateFilterBar = ({
  dictionary,
  filter,
  disabled = false,
  onChange,
  onSearch,
  onReset
}: Props) => (
  <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
    <Grid container spacing={2} alignItems="center">
      <Grid size={{ xs: 12, md: 8 }}>
        <TextField
          fullWidth
          size="small"
          label={commonText(dictionary, 'search', 'Search')}
          placeholder={formTemplateText(dictionary, 'searchPlaceholder', 'Tìm theo mã hoặc tên biểu mẫu')}
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
      <Grid size={{ xs: 12, md: 4 }}>
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

export default FormTemplateFilterBar
