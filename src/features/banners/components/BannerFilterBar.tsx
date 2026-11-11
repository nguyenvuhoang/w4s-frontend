import SearchIcon from '@mui/icons-material/Search'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { Button, Paper, Stack, TextField } from '@mui/material'

import type { BannerDictionary, BannerFilterModel } from '../types'
import { bannerText, commonText } from './bannerHelpers'

type Props = {
  dictionary: BannerDictionary
  filter: BannerFilterModel
  onChange: <K extends keyof BannerFilterModel>(key: K, value: BannerFilterModel[K]) => void
  onSearch: () => void
  onReset: () => void
}

const BannerFilterBar = ({ dictionary, filter, onChange, onSearch, onReset }: Props) => (
  <Paper sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
    <Stack direction={{ xs: 'column', md: 'row' }} gap={2} alignItems={{ xs: 'stretch', md: 'center' }}>
      <TextField
        fullWidth
        size="small"
        label={bannerText(dictionary, 'search_text', 'Search')}
        placeholder={bannerText(dictionary, 'search_placeholder', 'Search by banner title')}
        value={filter.search_text}
        onChange={event => onChange('search_text', event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter') onSearch()
        }}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} sx={{ flexShrink: 0 }}>
        <Button variant="contained" startIcon={<SearchIcon />} onClick={onSearch} sx={{ minWidth: 116 }}>
          {commonText(dictionary, 'search', 'Search')}
        </Button>
        <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={onReset} sx={{ minWidth: 116 }}>
          {commonText(dictionary, 'reset', 'Reset')}
        </Button>
      </Stack>
    </Stack>
  </Paper>
)

export default BannerFilterBar

