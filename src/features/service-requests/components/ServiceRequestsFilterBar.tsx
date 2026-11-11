import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import {
    Button,
    Grid,
    InputAdornment,
    MenuItem,
    Paper,
    Stack,
    TextField
} from '@mui/material'

import type {
    ServiceRequestsDictionary,
    ServiceRequestsFilter
} from '../types'
import {
    commonText,
    getRequestStatusLabel,
    requestStatusOptions,
    serviceRequestsText
} from './serviceRequestHelpers'

type Props = {
    dictionary: ServiceRequestsDictionary
    filter: ServiceRequestsFilter
    onChange: <K extends keyof ServiceRequestsFilter>(key: K, value: ServiceRequestsFilter[K]) => void
    onStatusChange: (value: ServiceRequestsFilter['request_status']) => void
    onSearch: () => void
    onReset: () => void
}

const ServiceRequestsFilterBar = ({
    dictionary,
    filter,
    onChange,
    onStatusChange,
    onSearch,
    onReset
}: Props) => (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
        <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 5, lg: 6 }}>
                <TextField
                    fullWidth
                    size="small"
                    label={serviceRequestsText(dictionary, 'search_label')}
                    placeholder={serviceRequestsText(dictionary, 'search_placeholder')}
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
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                    fullWidth
                    select
                    size="small"
                    label={serviceRequestsText(dictionary, 'request_status')}
                    value={filter.request_status}
                    onChange={event => onStatusChange(event.target.value)}
                >
                    {requestStatusOptions.map(status => (
                        <MenuItem key={status || 'all'} value={status}>
                            {status ? getRequestStatusLabel(dictionary, status) : serviceRequestsText(dictionary, 'all_statuses')}
                        </MenuItem>
                    ))}
                </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Stack
                    direction="row"
                    gap={1}
                    justifyContent={{ xs: 'stretch', md: 'flex-end' }}
                    sx={{
                        '& .MuiButton-root': {
                            flex: 1,
                            minWidth: { xs: 0, md: 120 }
                        }
                    }}
                >
                    <Button fullWidth variant="contained" startIcon={<SearchIcon />} onClick={onSearch}>
                        {commonText(dictionary, 'search')}
                    </Button>
                    <Button fullWidth variant="outlined" startIcon={<RefreshIcon />} onClick={onReset}>
                        {commonText(dictionary, 'reset')}
                    </Button>
                </Stack>
            </Grid>
        </Grid>
    </Paper>
)

export default ServiceRequestsFilterBar
