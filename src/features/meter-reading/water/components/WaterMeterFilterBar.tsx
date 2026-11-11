import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { Button, CircularProgress, Grid, InputAdornment, MenuItem, Paper, Stack, TextField } from '@mui/material'

import { waterText } from '../hooks/useWaterMeterReading'
import type { WaterMeterApartmentOption, WaterMeterBuildingOption, WaterMeterDictionary, WaterMeterPeriod, WaterMeterSearchFilter } from '../types'

const formatPeriodOptionLabel = (period: WaterMeterPeriod) => `${period.year}/${String(period.month).padStart(2, '0')}`

type Props = {
    dictionary: WaterMeterDictionary
    draft_filter: WaterMeterSearchFilter
    building_options: WaterMeterBuildingOption[]
    building_options_loading?: boolean
    apartment_options: WaterMeterApartmentOption[]
    apartment_options_loading?: boolean
    period_options: WaterMeterPeriod[]
    period_options_loading?: boolean
    disabled?: boolean
    on_filter_change: <K extends keyof WaterMeterSearchFilter>(key: K, value: WaterMeterSearchFilter[K]) => void
    on_building_change: (building_id: number | null) => void
    on_apartment_change: (apartment_id: number | null) => void
    on_period_change: (water_meter_period_id: number | null) => void
    on_search: () => void
    on_reset: () => void
}

const WaterMeterFilterBar = ({
    dictionary,
    draft_filter,
    building_options,
    building_options_loading = false,
    apartment_options,
    apartment_options_loading = false,
    period_options,
    period_options_loading = false,
    disabled = false,
    on_filter_change,
    on_building_change,
    on_apartment_change,
    on_period_change,
    on_search,
    on_reset
}: Props) => (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
        <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                    fullWidth
                    size="small"
                    label={waterText(dictionary, 'search_keyword_label')}
                    placeholder={waterText(dictionary, 'search_keyword_placeholder')}
                    value={draft_filter.search_text}
                    disabled={disabled}
                    onChange={event => on_filter_change('search_text', event.target.value)}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                <TextField
                    fullWidth
                    select
                    size="small"
                    label={waterText(dictionary, 'filter_building_label')}
                    value={draft_filter.building_id !== null ? String(draft_filter.building_id) : ''}
                    disabled={disabled || building_options_loading}
                    onChange={event => on_building_change(event.target.value === '' ? null : Number(event.target.value))}
                    slotProps={{
                        input: {
                            endAdornment: building_options_loading ? (
                                <InputAdornment position="end"><CircularProgress size={16} /></InputAdornment>
                            ) : undefined
                        }
                    }}
                >
                    <MenuItem value="">{waterText(dictionary, 'filter_building_all_option')}</MenuItem>
                    {building_options.map(building => (
                        <MenuItem key={building.id} value={String(building.id)}>{building.building_code ? `[${building.building_code}] ${building.name}` : building.name}</MenuItem>
                    ))}
                </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                <TextField
                    fullWidth
                    select
                    size="small"
                    label={waterText(dictionary, 'filter_apartment_label')}
                    value={draft_filter.apartment_id !== null ? String(draft_filter.apartment_id) : ''}
                    disabled={disabled || apartment_options_loading}
                    onChange={event => on_apartment_change(event.target.value === '' ? null : Number(event.target.value))}
                    slotProps={{
                        input: {
                            endAdornment: apartment_options_loading ? (
                                <InputAdornment position="end"><CircularProgress size={16} /></InputAdornment>
                            ) : undefined
                        }
                    }}
                >
                    <MenuItem value="">{waterText(dictionary, 'filter_apartment_all_option')}</MenuItem>
                    {apartment_options.map(apartment => (
                        <MenuItem key={apartment.id} value={String(apartment.id)}>{apartment.apartment_code}</MenuItem>
                    ))}
                </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                    fullWidth
                    select
                    size="small"
                    label={waterText(dictionary, 'water_meter_period')}
                    value={draft_filter.water_meter_period_id !== null ? String(draft_filter.water_meter_period_id) : ''}
                    disabled={disabled || period_options_loading}
                    onChange={event => on_period_change(event.target.value === '' ? null : Number(event.target.value))}
                    slotProps={{
                        input: {
                            endAdornment: period_options_loading ? (
                                <InputAdornment position="end"><CircularProgress size={16} /></InputAdornment>
                            ) : undefined
                        }
                    }}
                >
                    <MenuItem value="">{waterText(dictionary, 'filter_period_all_option')}</MenuItem>
                    {period_options.map(period => (
                        <MenuItem key={period.id} value={String(period.id)}>{formatPeriodOptionLabel(period)}</MenuItem>
                    ))}
                </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
                <Stack direction="row" gap={1}>
                    <Button fullWidth variant="contained" startIcon={<SearchIcon />} onClick={on_search} disabled={disabled}>
                        {waterText(dictionary, 'search')}
                    </Button>
                    <Button fullWidth variant="outlined" startIcon={<RefreshIcon />} onClick={on_reset} disabled={disabled}>
                        {waterText(dictionary, 'refresh')}
                    </Button>
                </Stack>
            </Grid>
        </Grid>
    </Paper>
)

export default WaterMeterFilterBar
