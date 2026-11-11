import SearchIcon from '@mui/icons-material/Search'
import { Button, Grid, InputAdornment, Paper, Stack, TextField } from '@mui/material'

import type { VendorsDictionary, VendorsFilterModel } from '../vendorTypes'
import { commonText, vendorsText } from './vendorHelpers'

type Props = {
    dictionary: VendorsDictionary
    filter: VendorsFilterModel
    onChange: <K extends keyof VendorsFilterModel>(key: K, value: VendorsFilterModel[K]) => void
    onSearch: () => void
}

const VendorsFilterBar = ({ dictionary, filter, onChange, onSearch }: Props) => (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
        <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                    fullWidth
                    size="small"
                    label={vendorsText(dictionary, 'search_label', 'Search')}
                    placeholder={vendorsText(dictionary, 'search_placeholder', 'Search by vendor code, company name, phone or email')}
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
            <Grid size={{ xs: 12, md: 2 }}>
                <Stack direction="row" gap={1}>
                    <Button fullWidth variant="contained" startIcon={<SearchIcon />} onClick={onSearch}>
                        {commonText(dictionary, 'search', 'Search')}
                    </Button>
                </Stack>
            </Grid>
        </Grid>
    </Paper>
)

export default VendorsFilterBar
