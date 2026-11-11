import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { Box, Button, InputAdornment, Paper, TextField } from '@mui/material'

import type { ContractsDictionary, ContractsFilterModel } from '../types'
import { commonText, contractsText } from './contractHelpers'

type Props = {
    dictionary: ContractsDictionary
    filter: ContractsFilterModel
    onChange: <K extends keyof ContractsFilterModel>(key: K, value: ContractsFilterModel[K]) => void
    onSearch: () => void
    onReset: () => void
}

const actionButtonSx = {
    width: { xs: '100%', sm: 132 },
    flexShrink: 0
}

const ContractsFilterBar = ({ dictionary, filter, onChange, onSearch, onReset }: Props) => (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2, width: '100%' }}>
        <Box
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: 1.5,
                width: '100%'
            }}
        >
            <TextField
                fullWidth
                size="small"
                label={contractsText(dictionary, 'search_label', 'Search')}
                placeholder={contractsText(dictionary, 'search_placeholder', 'Search by contract number, title or vendor code')}
                value={filter.search_text}
                onChange={event => onChange('search_text', event.target.value)}
                onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); onSearch() } }}
                sx={{ flex: 1, minWidth: 0 }}
                slotProps={{
                    input: {
                        startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                    }
                }}
            />
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 1,
                    justifyContent: 'flex-end',
                    flexShrink: 0
                }}
            >
                <Button variant="contained" startIcon={<SearchIcon />} onClick={onSearch} sx={actionButtonSx}>
                    {commonText(dictionary, 'search', 'Search')}
                </Button>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={onReset} sx={actionButtonSx}>
                    {commonText(dictionary, 'refresh', 'Refresh')}
                </Button>
            </Box>
        </Box>
    </Paper>
)

export default ContractsFilterBar
