import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SearchIcon from '@mui/icons-material/Search'
import { Button, Paper, Stack, TextField } from '@mui/material'

import FilterSearchForm from '@/shared/components/forms/FilterSearchForm'

import { commonText, partnerText } from '../partnerHelpers'
import type { PartnerDictionary, PartnerFilterModel } from '../types'

type Props = {
  dictionary: PartnerDictionary
  filter: PartnerFilterModel
  onChange: (key: 'search_text', value: string) => void
  onSearch: () => void
  onReset: () => void
}

const PartnerFilterBar = ({ dictionary, filter, onChange, onSearch, onReset }: Props) => (
  <Paper sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
    <FilterSearchForm on_search={onSearch}>
      <Stack direction={{ xs: 'column', md: 'row' }} gap={2} alignItems={{ xs: 'stretch', md: 'center' }}>
        <TextField
          fullWidth
          size="small"
          label={partnerText(dictionary, 'search_text', 'Search partners')}
          placeholder={partnerText(dictionary, 'search_placeholder', 'Search partners')}
          value={filter.search_text}
          onChange={event => onChange('search_text', event.target.value)}
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} sx={{ flexShrink: 0 }}>
          <Button type="submit" variant="contained" startIcon={<SearchIcon />} sx={{ minWidth: 116 }}>
            {commonText(dictionary, 'search', 'Search')}
          </Button>
          <Button type="button" variant="outlined" startIcon={<RestartAltIcon />} onClick={onReset} sx={{ minWidth: 116 }}>
            {commonText(dictionary, 'reset', 'Reset')}
          </Button>
        </Stack>
      </Stack>
    </FilterSearchForm>
  </Paper>
)

export default PartnerFilterBar
