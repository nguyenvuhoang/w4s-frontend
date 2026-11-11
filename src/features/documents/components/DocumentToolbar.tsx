import AccountTreeIcon from '@mui/icons-material/AccountTree'
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import GridViewIcon from '@mui/icons-material/GridView'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import ViewListIcon from '@mui/icons-material/ViewList'
import ViewModuleIcon from '@mui/icons-material/ViewModule'
import { Button, FormControl, InputAdornment, InputLabel, MenuItem, Paper, Select, Stack, TextField, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'

import type { DocumentFilterModel, DocumentViewMode } from '../types'
import { documentText, type DocumentDictionary, get_status_label } from './documentHelpers'

type Props = {
  dictionary: DocumentDictionary
  filter: DocumentFilterModel
  keyword: string
  actions_disabled?: boolean
  is_trash?: boolean
  on_keyword_change: (value: string) => void
  on_search: () => void
  on_status_change: (event: SelectChangeEvent) => void
  on_refresh: () => void
  on_create_folder: () => void
  on_upload: () => void
  on_trash: () => void
  on_exit_trash: () => void
  on_view_change: (view_mode: DocumentViewMode) => void
}

const view_options: { value: DocumentViewMode; label_key: string; icon: React.ReactNode }[] = [
  { value: 'tree', label_key: 'view_tree', icon: <AccountTreeIcon /> },
  { value: 'list', label_key: 'view_list', icon: <ViewListIcon /> },
  { value: 'tile', label_key: 'view_tile', icon: <GridViewIcon /> },
  { value: 'compact', label_key: 'view_compact', icon: <ViewModuleIcon /> }
]

const commonText = (dictionary: DocumentDictionary, key: string) => dictionary.common?.[key] ?? key

const DocumentToolbar = ({
  dictionary,
  filter,
  keyword,
  actions_disabled = false,
  is_trash = false,
  on_keyword_change,
  on_search,
  on_status_change,
  on_refresh,
  on_create_folder,
  on_upload,
  on_trash,
  on_exit_trash,
  on_view_change
}: Props) => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
    <Stack direction={{ xs: 'column', lg: 'row' }} gap={2} justifyContent="space-between">
      <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} flex={1}>
        {is_trash ? (
          <Button variant="outlined" onClick={on_exit_trash} disabled={actions_disabled}>
            {documentText(dictionary, 'back_to_files')}
          </Button>
        ) : (
          <>
            <Button variant="contained" startIcon={<CreateNewFolderIcon />} onClick={on_create_folder} disabled={actions_disabled}>
              {documentText(dictionary, 'create_folder')}
            </Button>
            <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={on_upload} disabled={actions_disabled}>
              {documentText(dictionary, 'upload')}
            </Button>
            <FormControl size="small" sx={{ minWidth: 190 }}>
              <InputLabel>{documentText(dictionary, 'status_filter')}</InputLabel>
              <Select
                label={documentText(dictionary, 'status_filter')}
                value={filter.status === 'deleted' ? 'all' : filter.status}
                onChange={on_status_change}
                disabled={actions_disabled}
              >
                {(['all', 'active', 'inactive'] as const).map(status => (
                  <MenuItem key={status} value={status}>
                    {get_status_label(dictionary, status)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" color="inherit" startIcon={<DeleteOutlineIcon />} onClick={on_trash} disabled={actions_disabled}>
              {documentText(dictionary, 'trash')}
            </Button>
          </>
        )}
        <Tooltip title={commonText(dictionary, 'refresh')}>
          <span>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={on_refresh} disabled={actions_disabled}>
              {commonText(dictionary, 'refresh')}
            </Button>
          </span>
        </Tooltip>
      </Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} alignItems={{ md: 'center' }}>
        <TextField
          size="small"
          value={keyword}
          onChange={event => on_keyword_change(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') on_search()
          }}
          placeholder={documentText(dictionary, 'search_placeholder')}
          disabled={actions_disabled}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            )
          }}
          sx={{ minWidth: { md: 280 } }}
        />
        <ToggleButtonGroup
          size="small"
          exclusive
          value={filter.view_mode}
          onChange={(_, value) => value && on_view_change(value)}
          disabled={actions_disabled}
        >
          {view_options.map(option => {
            const label = documentText(dictionary, option.label_key)

            return (
              <ToggleButton key={option.value} value={option.value} aria-label={label}>
                <Tooltip title={label}>
                  <span>{option.icon}</span>
                </Tooltip>
              </ToggleButton>
            )
          })}
        </ToggleButtonGroup>
      </Stack>
    </Stack>
  </Paper>
)

export default DocumentToolbar
