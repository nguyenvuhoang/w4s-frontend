import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { Box, Button, Grid, MenuItem, Stack, TextField } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'

import type { ApplicationLogFilterModel } from '../types'
import { applicationLogText } from './applicationLogHelpers'

type Props = {
  locale: string
  filter: ApplicationLogFilterModel
  loading: boolean
  onChange: <K extends keyof ApplicationLogFilterModel>(key: K, value: ApplicationLogFilterModel[K]) => void
  onSearch: () => void
  onReset: () => void
}

const getLogLevelOptions = (locale: string) => [
  { label: applicationLogText(locale, 'Tất cả', 'All'), value: '' },
  { label: applicationLogText(locale, 'Lỗi', 'Error'), value: 'Error' },
  { label: applicationLogText(locale, 'Cảnh báo', 'Warning'), value: 'Warning' },
  { label: applicationLogText(locale, 'Thông tin', 'Information'), value: 'Information' },
  { label: 'Debug', value: 'Debug' },
  { label: 'Trace', value: 'Trace' }
]

const getDirectionOptions = (locale: string) => [
  { label: applicationLogText(locale, 'Tất cả', 'All'), value: '' },
  { label: applicationLogText(locale, 'Vào (In)', 'In'), value: 'In' },
  { label: applicationLogText(locale, 'Ra (Out)', 'Out'), value: 'Out' }
]

const ApplicationLogsFilterBar = ({ locale, filter, loading, onChange, onSearch, onReset }: Props) => (
  <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider', mt: 1 }}>
    <Grid container spacing={2} alignItems="center">
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <DatePicker
          label={applicationLogText(locale, 'Từ ngày', 'From date')}
          value={filter.from_date ? dayjs(filter.from_date) : null}
          format="DD/MM/YYYY"
          onChange={value => onChange('from_date', value ? dayjs(value).format('YYYY-MM-DD') : null)}
          slotProps={{ textField: { size: 'small', fullWidth: true } }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <DatePicker
          label={applicationLogText(locale, 'Đến ngày', 'To date')}
          value={filter.to_date ? dayjs(filter.to_date) : null}
          format="DD/MM/YYYY"
          onChange={value => onChange('to_date', value ? dayjs(value).format('YYYY-MM-DD') : null)}
          slotProps={{ textField: { size: 'small', fullWidth: true } }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <TextField
          select
          fullWidth
          size="small"
          label={applicationLogText(locale, 'Log level', 'Log level')}
          value={filter.log_level}
          onChange={event => onChange('log_level', event.target.value)}
        >
          {getLogLevelOptions(locale).map(option => (
            <MenuItem key={option.value || 'all'} value={option.value}>{option.label}</MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <TextField
          fullWidth
          size="small"
          label={applicationLogText(locale, 'Service name', 'Service name')}
          value={filter.service_name}
          onChange={event => onChange('service_name', event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') onSearch()
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <TextField
          fullWidth
          size="small"
          label={applicationLogText(locale, 'Log type', 'Log type')}
          value={filter.log_type}
          onChange={event => onChange('log_type', event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') onSearch()
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <TextField
          select
          fullWidth
          size="small"
          label="Direction"
          value={filter.direction}
          onChange={event => onChange('direction', event.target.value)}
        >
          {getDirectionOptions(locale).map(option => (
            <MenuItem key={option.value || 'all'} value={option.value}>{option.label}</MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <TextField
          fullWidth
          size="small"
          label={applicationLogText(locale, 'Action name', 'Action name')}
          value={filter.action_name}
          onChange={event => onChange('action_name', event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') onSearch()
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <TextField
          fullWidth
          size="small"
          label={applicationLogText(locale, 'Từ khóa tìm kiếm', 'Search text')}
          value={filter.search_text}
          onChange={event => onChange('search_text', event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') onSearch()
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} justifyContent={{ sm: 'flex-end' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon fontSize="small" />}
            onClick={onReset}
            disabled={loading}
            sx={{ minWidth: 108, height: 40, whiteSpace: 'nowrap' }}
          >
            {applicationLogText(locale, 'Đặt lại', 'Reset')}
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<SearchIcon fontSize="small" />}
            onClick={onSearch}
            disabled={loading}
            sx={{ minWidth: 108, height: 40, whiteSpace: 'nowrap' }}
          >
            {applicationLogText(locale, 'Tìm kiếm', 'Search')}
          </Button>
        </Stack>
      </Grid>
    </Grid>
  </Box>
)

export default ApplicationLogsFilterBar
