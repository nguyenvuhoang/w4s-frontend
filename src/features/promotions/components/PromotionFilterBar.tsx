import SearchIcon from '@mui/icons-material/Search'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { Button, Paper, Stack, TextField } from '@mui/material'

import FilterSearchForm from '@/shared/components/forms/FilterSearchForm'

import type { PromotionDictionary, PromotionFilterModel } from '../types'
import { commonText, promotionText } from './promotionHelpers'

type Props = {
  dictionary: PromotionDictionary
  filter: PromotionFilterModel
  onChange: <K extends keyof PromotionFilterModel>(key: K, value: PromotionFilterModel[K]) => void
  onSearch: () => void
  onReset: () => void
}

const PromotionFilterBar = ({ dictionary, filter, onChange, onSearch, onReset }: Props) => (
  <Paper sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
    <FilterSearchForm on_search={onSearch}>
      <Stack direction={{ xs: 'column', md: 'row' }} gap={2} alignItems={{ xs: 'stretch', md: 'center' }}>
        <TextField
          fullWidth
          size="small"
          label={promotionText(dictionary, 'search_text', 'Search')}
          placeholder={promotionText(dictionary, 'search_placeholder', 'Search promotions...')}
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

export default PromotionFilterBar
