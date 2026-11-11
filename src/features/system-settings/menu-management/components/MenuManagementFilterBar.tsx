import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { Button, Grid, InputAdornment, Paper, Stack, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material'

import type { MenuCommandTypeFilter } from '../hooks/useMenuCommandSearch'
import type { MenuManagementDictionary } from '../types'
import { commonText, menuManagementText } from './menuCommandHelpers'

type Props = {
  dictionary: MenuManagementDictionary
  searchText: string
  typeFilter: MenuCommandTypeFilter
  loading: boolean
  onSearchTextChange: (value: string) => void
  onSearchKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void
  onSearch: () => void
  onRefresh: () => void
  onTypeFilterChange: (value: MenuCommandTypeFilter) => void
}

const MenuManagementFilterBar = ({
  dictionary,
  searchText,
  typeFilter,
  loading,
  onSearchTextChange,
  onSearchKeyDown,
  onSearch,
  onRefresh,
  onTypeFilterChange
}: Props) => (
  <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
    <Grid container spacing={2} alignItems="center">
      <Grid size={{ xs: 12, md: 5 }}>
        <TextField
          fullWidth
          size="small"
          label={menuManagementText(dictionary, 'search_label', 'Tìm kiếm')}
          placeholder={menuManagementText(dictionary, 'search_placeholder', 'Tìm theo tên, mã menu hoặc command')}
          value={searchText}
          onChange={event => onSearchTextChange(event.target.value)}
          onKeyDown={onSearchKeyDown}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
            }
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          fullWidth
          color="primary"
          value={typeFilter}
          onChange={(_, value) => value && onTypeFilterChange(value)}
        >
          <ToggleButton value="all">{menuManagementText(dictionary, 'filter_all', 'Tất cả')}</ToggleButton>
          <ToggleButton value="M">{menuManagementText(dictionary, 'filter_menu', 'Menu')}</ToggleButton>
          <ToggleButton value="C">{menuManagementText(dictionary, 'filter_command', 'Chức năng')}</ToggleButton>
        </ToggleButtonGroup>
      </Grid>

      <Grid size={{ xs: 12, md: 3 }}>
        <Stack direction="row" gap={1}>
          <Button fullWidth variant="contained" startIcon={<SearchIcon />} onClick={onSearch} disabled={loading}>
            {commonText(dictionary, 'search', 'Tìm kiếm')}
          </Button>
          <Button fullWidth variant="outlined" startIcon={<RefreshIcon />} onClick={onRefresh} disabled={loading}>
            {commonText(dictionary, 'refresh', 'Làm mới')}
          </Button>
        </Stack>
      </Grid>
    </Grid>
  </Paper>
)

export default MenuManagementFilterBar
