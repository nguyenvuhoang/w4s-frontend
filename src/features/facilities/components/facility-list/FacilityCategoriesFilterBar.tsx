import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { Button, Grid, InputAdornment, Paper, Stack, TextField } from '@mui/material'

import type { FacilitiesDictionary, FacilityCategoriesFilterModel } from '../../types'
import { commonText, facilitiesText } from './facilityListHelpers'

type Props = {
    dictionary: FacilitiesDictionary
    draft_filter: FacilityCategoriesFilterModel
    on_filter_change: <K extends keyof FacilityCategoriesFilterModel>(key: K, value: FacilityCategoriesFilterModel[K]) => void
    on_search: () => void
    on_reset: () => void
}

const FacilityCategoriesFilterBar = ({ dictionary, draft_filter, on_filter_change, on_search, on_reset }: Props) => (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
        <Grid container spacing={2} alignItems="center">
            <Grid size={12}>
                <TextField
                    fullWidth
                    size="small"
                    label={facilitiesText(dictionary, 'search_label', 'Search')}
                    placeholder={facilitiesText(dictionary, 'categories_search_placeholder', 'Search by category code or name')}
                    value={draft_filter.search_text}
                    onChange={event => on_filter_change('search_text', event.target.value)}
                    onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); on_search() } }}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
                />
            </Grid>
            <Grid size={12}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" flexWrap="wrap" gap={1}>
                    <Button variant="contained" startIcon={<SearchIcon />} onClick={on_search} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                        {commonText(dictionary, 'search', 'Search')}
                    </Button>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={on_reset} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                        {commonText(dictionary, 'reset', 'Reset')}
                    </Button>
                </Stack>
            </Grid>
        </Grid>
    </Paper>
)

export default FacilityCategoriesFilterBar
