import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { Button, Grid, InputAdornment, MenuItem, Paper, Stack, TextField } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'

import type { AuditLogFilterModel } from '../types'
import { auditLogText } from './auditLogHelpers'

type Props = {
  locale: string
  filter: AuditLogFilterModel
  loading: boolean
  onChange: <K extends keyof AuditLogFilterModel>(key: K, value: AuditLogFilterModel[K]) => void
  onSearch: () => void
  onReset: () => void
}

const getStatusOptions = (locale: string) => [
  { label: auditLogText(locale, 'Tất cả', 'All'), value: '' },
  { label: auditLogText(locale, 'Thành công', 'Success'), value: 2 },
  { label: auditLogText(locale, 'Thất bại', 'Failed'), value: 3 }
] as const

const AuditLogsFilterBar = ({ locale, filter, loading, onChange, onSearch, onReset }: Props) => (
  <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
    <Grid container spacing={2} alignItems="center">
      <Grid size={{ xs: 12, md: 2 }}>
        <TextField
          fullWidth
          size="small"
          label="Workflow ID"
          placeholder={auditLogText(locale, 'Nhập workflow id', 'Enter workflow id')}
          value={filter.workflowid}
          onChange={event => onChange('workflowid', event.target.value)}
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

      <Grid size={{ xs: 12, md: 2 }}>
        <TextField
          fullWidth
          size="small"
          label="Execution ID"
          placeholder={auditLogText(locale, 'Nhập execution id', 'Enter execution id')}
          value={filter.execution_id}
          onChange={event => onChange('execution_id', event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') onSearch()
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 2 }}>
        <TextField
          select
          fullWidth
          size="small"
          label={auditLogText(locale, 'Trạng thái', 'Status')}
          value={filter.status}
          onChange={event => {
            const value = event.target.value

            onChange('status', value === '' ? '' : Number(value) as 2 | 3)
          }}
        >
          {getStatusOptions(locale).map(option => (
            <MenuItem key={option.value || 'all'} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid size={{ xs: 12, md: 2 }}>
        <DatePicker
          label={auditLogText(locale, 'Từ ngày', 'From date')}
          value={filter.from_date ? dayjs(filter.from_date) : null}
          format="DD/MM/YYYY"
          onChange={value => onChange('from_date', value ? dayjs(value).format('YYYY-MM-DD') : null)}
          slotProps={{
            textField: { size: 'small', fullWidth: true }
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 2 }}>
        <DatePicker
          label={auditLogText(locale, 'Đến ngày', 'To date')}
          value={filter.to_date ? dayjs(filter.to_date) : null}
          format="DD/MM/YYYY"
          onChange={value => onChange('to_date', value ? dayjs(value).format('YYYY-MM-DD') : null)}
          slotProps={{
            textField: { size: 'small', fullWidth: true }
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} justifyContent={{ sm: 'flex-end' }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<SearchIcon fontSize="small" />}
            onClick={onSearch}
            disabled={loading}
            sx={{ minWidth: 108, height: 40, whiteSpace: 'nowrap' }}
          >
            {auditLogText(locale, 'Tìm kiếm', 'Search')}
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon fontSize="small" />}
            onClick={onReset}
            disabled={loading}
            sx={{ minWidth: 108, height: 40, whiteSpace: 'nowrap' }}
          >
            {auditLogText(locale, 'Làm mới', 'Refresh')}
          </Button>
        </Stack>
      </Grid>
    </Grid>
  </Paper>
)

export default AuditLogsFilterBar
