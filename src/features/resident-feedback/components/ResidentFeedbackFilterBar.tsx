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
    ResidentFeedbackDictionary,
    ResidentFeedbackFilter
} from '../types'
import {
    commonText,
    getFeedbackStatusLabel,
    requestStatusOptions,
    residentFeedbackText
} from './residentFeedbackHelpers'

type Props = {
    dictionary: ResidentFeedbackDictionary
    filter: ResidentFeedbackFilter
    disabled?: boolean
    onChange: <K extends keyof ResidentFeedbackFilter>(key: K, value: ResidentFeedbackFilter[K]) => void
    onStatusChange: (value: ResidentFeedbackFilter['request_status']) => void
    onSearch: () => void
    onReset: () => void
}

const ResidentFeedbackFilterBar = ({
    dictionary,
    filter,
    disabled = false,
    onChange,
    onStatusChange,
    onSearch,
    onReset
}: Props) => (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
        <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, lg: 6 }}>
                <TextField
                    fullWidth
                    size="small"
                    label={residentFeedbackText(dictionary, 'search_label')}
                    placeholder={residentFeedbackText(dictionary, 'search_placeholder')}
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
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <TextField
                    fullWidth
                    select
                    size="small"
                    label={residentFeedbackText(dictionary, 'request_status')}
                    value={filter.request_status}
                    onChange={event => onStatusChange(event.target.value)}
                >
                    {requestStatusOptions.map(status => (
                        <MenuItem key={status || 'all'} value={status}>
                            {status ? getFeedbackStatusLabel(dictionary, status) : residentFeedbackText(dictionary, 'all_statuses')}
                        </MenuItem>
                    ))}
                </TextField>
            </Grid>
            <Grid size={{ xs: 12, lg: 3 }}>
                <Stack direction="row" gap={1}>
                    <Button fullWidth variant="contained" startIcon={<SearchIcon />} onClick={onSearch} disabled={disabled}>
                        {commonText(dictionary, 'search')}
                    </Button>
                    <Button fullWidth variant="outlined" startIcon={<RefreshIcon />} onClick={onReset} disabled={disabled}>
                        {commonText(dictionary, 'reset')}
                    </Button>
                </Stack>
            </Grid>
        </Grid>
    </Paper>
)

export default ResidentFeedbackFilterBar
