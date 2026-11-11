import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import {
  Button,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField
} from '@mui/material'

import type { FeeInvoiceFilterModel, FeeDictionary, FeePeriodItem, FeeTypeItem } from '../types'
import type { CodeListOption } from '@/shared/utils/buildCodeListOptions'
import { commonText, feeText } from './feeInvoiceHelpers'

type Props = {
  dictionary: FeeDictionary
  locale: string
  filter: FeeInvoiceFilterModel
  onChange: <K extends keyof FeeInvoiceFilterModel>(key: K, value: FeeInvoiceFilterModel[K]) => void
  onSearch: () => void
  onReset: () => void
  periods: FeePeriodItem[]
  feeTypes: FeeTypeItem[]
  paymentStatuses: CodeListOption[]
  disabled?: boolean
}

const compactFieldSx = {
  '& .MuiInputBase-root': { height: 40 },
  '& .MuiInputBase-input': { paddingTop: '9px', paddingBottom: '9px' }
}

const compactButtonSx = {
  height: 40,
  minHeight: 40,
  whiteSpace: 'nowrap' as const
}

const FeeInvoiceFilterBar = ({
  dictionary,
  locale,
  filter,
  onChange,
  onSearch,
  onReset,
  periods,
  feeTypes,
  paymentStatuses,
  disabled = false
}: Props) => (
  <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2, boxShadow: 2 }}>
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
      <TextField
        select
        size="small"
        label={feeText(dictionary, 'fee_period', 'Fee period')}
        value={filter.fee_period_id ?? ''}
        onChange={event => onChange('fee_period_id', event.target.value === '' ? null : Number(event.target.value))}
        disabled={disabled}
        sx={{ flex: 1, ...compactFieldSx }}
      >
        <MenuItem value="">{feeText(dictionary, 'fee_invoice_all_periods', 'All fee periods')}</MenuItem>
        {periods.map(period => <MenuItem key={period.id} value={period.id!}>{period.period_name || period.period_code || `${period.month}/${period.year}`}</MenuItem>)}
      </TextField>
      <TextField
        select
        size="small"
        label={feeText(dictionary, 'field_fee_type_id', 'Fee type')}
        value={filter.fee_type_id ?? ''}
        onChange={event => onChange('fee_type_id', event.target.value === '' ? null : Number(event.target.value))}
        disabled={disabled}
        sx={{ flex: 1, ...compactFieldSx }}
      >
        <MenuItem value="">{feeText(dictionary, 'fee_invoice_all_fee_types', 'All fee types')}</MenuItem>
        {feeTypes.map(type => <MenuItem key={type.id} value={type.id!}>{(locale === 'vi' ? type.name_translations.vi : type.name_translations.en) || type.name || type.fee_type_code}</MenuItem>)}
      </TextField>
      <TextField
        select
        size="small"
        label={feeText(dictionary, 'field_payment_status', 'Payment status')}
        value={filter.status}
        onChange={event => onChange('status', event.target.value)}
        disabled={disabled}
        sx={{ flex: 1, ...compactFieldSx }}
      >
        <MenuItem value="">{feeText(dictionary, 'fee_invoice_all_payment_statuses', 'All payment statuses')}</MenuItem>
        {paymentStatuses.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
      </TextField>
      <TextField
        size="small"
        label={feeText(dictionary, 'search_label', 'Search')}
        placeholder={feeText(dictionary, 'fee_invoice_search_placeholder', 'Search by invoice number, customer or unit code')}
        value={filter.search_text}
        onChange={event => onChange('search_text', event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter') onSearch()
        }}
        disabled={disabled}
        sx={{ flex: 1, ...compactFieldSx }}
        slotProps={{
          input: {
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
          }
        }}
      />
      </Stack>
      <Stack
        direction="row"
        gap={1}
        sx={{ width: { xs: '100%', md: 'auto' }, ml: { md: 'auto' }, flexShrink: 0 }}
      >
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={onReset} disabled={disabled} sx={compactButtonSx}>
          {commonText(dictionary, 'reset', 'Reset')}
        </Button>
        <Button variant="contained" startIcon={<SearchIcon />} onClick={onSearch} disabled={disabled} sx={compactButtonSx}>
          {commonText(dictionary, 'search', 'Search')}
        </Button>
      </Stack>
    </Stack>
  </Paper>
)

export default FeeInvoiceFilterBar
