'use client'

import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { Button, Grid, InputAdornment, Paper, TextField } from '@mui/material'

import type { WorkflowsDictionary } from '../types'
import { commonText, workflowText } from './workflowHelpers'

type Props = {
  dictionary: WorkflowsDictionary
  searchText: string
  loading: boolean
  onSearchTextChange: (value: string) => void
  onSearch: () => void
  onRefresh: () => void
}

const WorkflowsFilterBar = ({
  dictionary,
  searchText,
  loading,
  onSearchTextChange,
  onSearch,
  onRefresh
}: Props) => (
  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
    <Grid container spacing={2} alignItems="center">
      <Grid size={{ xs: 12, md: 8 }}>
        <TextField
          fullWidth
          size="small"
          label={workflowText(dictionary, 'search_label', 'Search')}
          placeholder={workflowText(dictionary, 'search_placeholder', 'Search by workflow code, name or description')}
          value={searchText}
          onChange={event => onSearchTextChange(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') onSearch()
          }}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
            }
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <Button fullWidth variant="contained" startIcon={<SearchIcon />} onClick={onSearch} disabled={loading}>
              {commonText(dictionary, 'search', 'Search')}
            </Button>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Button fullWidth variant="outlined" startIcon={<RefreshIcon />} onClick={onRefresh} disabled={loading}>
              {commonText(dictionary, 'refresh', 'Refresh')}
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  </Paper>
)

export default WorkflowsFilterBar
