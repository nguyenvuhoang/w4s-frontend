import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { Button, Grid, InputAdornment, Paper, Stack, TextField } from '@mui/material'

import type { ContactInfoDictionary, ContactInfoFilterModel } from '../types'
import { commonText, contactInfoText } from './contactInfoHelpers'

type Props = {
  dictionary: ContactInfoDictionary
  filter: ContactInfoFilterModel
  disabled: boolean
  onChange: <K extends keyof ContactInfoFilterModel>(key: K, value: ContactInfoFilterModel[K]) => void
  onSearch: () => void
  onReset: () => void
}

const ContactInfoFilterBar = ({ dictionary, filter, disabled, onChange, onSearch, onReset }: Props) => (
  <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
    <Grid container spacing={2} alignItems="center">
      <Grid size={{ xs: 12, md: 8 }}>
        <TextField
          fullWidth
          size="small"
          label={contactInfoText(dictionary, 'search_label', 'Search')}
          placeholder={contactInfoText(dictionary, 'search_placeholder', 'Search project contact information')}
          value={filter.search_text}
          onChange={event => onChange('search_text', event.target.value)}
          onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); onSearch() } }}
          disabled={disabled}
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

export default ContactInfoFilterBar
