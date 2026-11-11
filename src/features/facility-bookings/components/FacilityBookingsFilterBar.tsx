import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { Button, Grid, InputAdornment, Paper, Stack, TextField } from '@mui/material'

import type { FacilityBookingFilterModel, FacilityBookingsDictionary } from '../types'
import { bookingText, commonText } from './facilityBookingHelpers'

type Props = {
    dictionary: FacilityBookingsDictionary
    draft_filter: FacilityBookingFilterModel
    on_filter_change: <K extends keyof FacilityBookingFilterModel>(key: K, value: FacilityBookingFilterModel[K]) => void
    on_search: () => void
    on_reset: () => void
}

const FacilityBookingsFilterBar = ({ dictionary, draft_filter, on_filter_change, on_search, on_reset }: Props) => (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
        <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
                <TextField
                    fullWidth
                    size="small"
                    label={bookingText(dictionary, 'search_label', 'Search')}
                    placeholder={bookingText(dictionary, 'search_placeholder', 'Search booking, project, facility, apartment or note')}
                    value={draft_filter.search_text}
                    onChange={event => on_filter_change('search_text', event.target.value)}
                    onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); on_search() } }}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
                />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label={bookingText(dictionary, 'project_id', 'Project ID')}
                    value={draft_filter.project_id}
                    onChange={event => on_filter_change('project_id', Number(event.target.value) || 1)}
                />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
                <Stack direction="row" gap={1}>
                    <Button fullWidth variant="contained" startIcon={<SearchIcon />} onClick={on_search}>
                        {commonText(dictionary, 'search', 'Search')}
                    </Button>
                    <Button fullWidth variant="outlined" startIcon={<RefreshIcon />} onClick={on_reset}>
                        {commonText(dictionary, 'reset', 'Reset')}
                    </Button>
                </Stack>
            </Grid>
        </Grid>
    </Paper>
)

export default FacilityBookingsFilterBar
