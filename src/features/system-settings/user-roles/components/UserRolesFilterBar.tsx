import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { Button, Grid, InputAdornment, Paper, Stack, TextField } from '@mui/material'

import type { UserRoleFilterModel, UserRolesDictionary } from '../types'
import { commonText, userRoleText } from './userRoleHelpers'

type Props = {
  dictionary: UserRolesDictionary
  filter: UserRoleFilterModel
  loading: boolean
  onChange: <K extends keyof UserRoleFilterModel>(key: K, value: UserRoleFilterModel[K]) => void
  onSearch: () => void
  onReset: () => void
}

const UserRolesFilterBar = ({ dictionary, filter, loading, onChange, onSearch, onReset }: Props) => (
  <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
    <Grid container spacing={2} alignItems="center">
      <Grid size={{ xs: 12, md: 8 }}>
        <TextField
          fullWidth
          size="small"
          label={userRoleText(dictionary, 'search_label', 'Search')}
          placeholder={userRoleText(dictionary, 'search_placeholder', 'Search by role name or description')}
          value={filter.search_text}
          onChange={event => onChange('search_text', event.target.value)}
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
        <Stack direction="row" gap={1}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={onSearch}
            disabled={loading}
          >
            {commonText(dictionary, 'search', 'Search')}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onReset}
            disabled={loading}
          >
            {commonText(dictionary, 'reset', 'Reset')}
          </Button>
        </Stack>
      </Grid>
    </Grid>
  </Paper>
)

export default UserRolesFilterBar
