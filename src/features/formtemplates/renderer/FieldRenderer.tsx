'use client'

import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'

import type { Locale } from '@/configs/i18n'
import { getLocalizedText } from '@/shared/utils/getLocalizedText'
import SelectFormField from '@/@core/components/form-field/SelectFormField'
import ApartmentLookup from '@/shared/components/apartment-lookup/ApartmentLookup'

import type { DataField } from '../formSchema.types'
import { formTemplateText } from '../formTemplateHelpers'
import type { FormTemplateDictionary } from '../types'

export type FieldRenderMode = 'preview' | 'print'

type Props = {
  field: DataField
  mode: FieldRenderMode
  locale: Locale | string
  dictionary: FormTemplateDictionary
  sessiontoken?: string
  projectId?: number | null
  value: unknown
  onChange?: (value: unknown) => void
  error?: string
}

const PrintValueBox = ({ value, showBorder = true }: { value: unknown; showBorder?: boolean }) => (
  <Box
    sx={{
      minHeight: 26,
      px: 1,
      py: 0.5,
      borderBottom: showBorder ? '1px solid #94a3b8' : 'none',
      fontSize: 13,
      wordBreak: 'break-word'
    }}
  >
    {value === null || value === undefined || value === '' ? ' ' : String(value)}
  </Box>
)

const emptyRepeaterRow = (field: DataField): Record<string, unknown> => (
  Object.fromEntries((field.columns ?? []).map(column => [column.name, column.default_value ?? '']))
)

const FieldRenderer = ({ field, mode, locale, dictionary, sessiontoken, projectId, value, onChange, error }: Props) => {
  const label = getLocalizedText(field.label, locale)
  const placeholder = field.placeholder ? getLocalizedText(field.placeholder, locale) : undefined
  const helpText = field.help_text ? getLocalizedText(field.help_text, locale) : undefined
  const disabled = mode === 'print' || Boolean(field.read_only)

  if (mode === 'print' && field.type !== 'repeater') {
    return (
      <Box>
        <Typography variant="caption" color="text.secondary">{label}{field.required ? ' *' : ''}</Typography>
        <PrintValueBox value={value} />
      </Box>
    )
  }

  switch (field.type) {
    case 'textarea':
      return (
        <TextField
          fullWidth
          multiline
          minRows={3}
          label={label}
          required={field.required}
          disabled={disabled}
          placeholder={placeholder}
          helperText={error ?? helpText}
          error={Boolean(error)}
          value={value ?? ''}
          onChange={event => onChange?.(event.target.value)}
        />
      )

    case 'number':
      return (
        <TextField
          fullWidth
          type="number"
          label={label}
          required={field.required}
          disabled={disabled}
          placeholder={placeholder}
          helperText={error ?? helpText}
          error={Boolean(error)}
          value={value ?? ''}
          onChange={event => onChange?.(event.target.value === '' ? '' : Number(event.target.value))}
        />
      )

    case 'date':
      return (
        <TextField
          fullWidth
          type="date"
          label={label}
          required={field.required}
          disabled={disabled}
          helperText={error ?? helpText}
          error={Boolean(error)}
          value={value ?? ''}
          onChange={event => onChange?.(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      )

    case 'time':
      return (
        <TextField
          fullWidth
          type="time"
          label={label}
          required={field.required}
          disabled={disabled}
          helperText={error ?? helpText}
          error={Boolean(error)}
          value={value ?? ''}
          onChange={event => onChange?.(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      )

    case 'time_range': {
      const rangeValue = (value ?? {}) as { from?: string; to?: string }

      return (
        <Stack spacing={1}>
          <Typography variant="caption" color="text.secondary">{label}{field.required ? ' *' : ''}</Typography>
          <Stack direction="row" spacing={1.5}>
            <TextField
              fullWidth
              type="time"
              size="small"
              disabled={disabled}
              value={rangeValue.from ?? ''}
              onChange={event => onChange?.({ ...rangeValue, from: event.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              fullWidth
              type="time"
              size="small"
              disabled={disabled}
              value={rangeValue.to ?? ''}
              onChange={event => onChange?.({ ...rangeValue, to: event.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
          {(error ?? helpText) && <Typography variant="caption" color={error ? 'error' : 'text.secondary'}>{error ?? helpText}</Typography>}
        </Stack>
      )
    }

    case 'select':
      return (
        <SelectFormField
          field={{
            value: value ?? '',
            onChange: (v: any) => onChange?.(typeof v === 'string' ? v : v?.target?.value),
            onBlur: () => undefined,
            name: field.name
          }}
          label={label}
          required={field.required}
          disabled={disabled}
          error={Boolean(error)}
          options={(field.options ?? []).map(option => ({ value: option.value, label: getLocalizedText(option.label, locale) }))}
        />
      )

    case 'radio':
      return (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{label}{field.required ? ' *' : ''}</Typography>
          <RadioGroup
            value={value ?? ''}
            onChange={event => onChange?.(event.target.value)}
          >
            {(field.options ?? []).map(option => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                disabled={disabled}
                control={<Radio size="small" />}
                label={getLocalizedText(option.label, locale)}
              />
            ))}
          </RadioGroup>
          {(error ?? helpText) && <Typography variant="caption" color={error ? 'error' : 'text.secondary'}>{error ?? helpText}</Typography>}
        </Box>
      )

    case 'checkbox':
      return (
        <FormControlLabel
          control={(
            <Checkbox
              checked={Boolean(value)}
              disabled={disabled}
              onChange={event => onChange?.(event.target.checked)}
            />
          )}
          label={`${label}${field.required ? ' *' : ''}`}
        />
      )

    case 'apartment':
      return (
        <ApartmentLookup
          sessiontoken={sessiontoken}
          language={locale}
          projectId={projectId}
          label={label}
          required={field.required}
          disabled={disabled}
          value={typeof value === 'number' ? value : null}
          displayValue={typeof value === 'string' ? value : ''}
          error={Boolean(error)}
          helperText={error ?? helpText}
          onChange={option => onChange?.(option?.id ?? null)}
          messages={{
            searchTitle: formTemplateText(dictionary, 'apartmentLookupSearchTitle', 'Tra cứu căn hộ'),
            apartmentCodeLabel: formTemplateText(dictionary, 'apartmentLookupCodeLabel', 'Số căn hộ'),
            apartmentTypeLabel: formTemplateText(dictionary, 'apartmentLookupTypeLabel', 'Loại căn hộ'),
            searchButtonLabel: formTemplateText(dictionary, 'apartmentLookupSearchButton', 'Tìm kiếm'),
            selectLabel: formTemplateText(dictionary, 'apartmentLookupSelectButton', 'Chọn'),
            emptyText: formTemplateText(dictionary, 'apartmentLookupEmptyText', 'Không tìm thấy căn hộ')
          }}
        />
      )

    case 'resident':
      return (
        <TextField
          fullWidth
          label={label}
          required={field.required}
          disabled={disabled}
          placeholder={placeholder ?? formTemplateText(dictionary, 'residentFieldPlaceholder', 'Nhập mã hoặc tên cư dân')}
          helperText={error ?? helpText}
          error={Boolean(error)}
          value={value ?? ''}
          onChange={event => onChange?.(event.target.value)}
        />
      )

    case 'repeater': {
      const rows = Array.isArray(value) ? value as Record<string, unknown>[] : []
      const columns = field.columns ?? []
      const canAdd = mode === 'preview' && (!field.max_rows || rows.length < field.max_rows)
      const canRemove = (index: number) => mode === 'preview' && (!field.min_rows || rows.length > field.min_rows)

      return (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>{label}{field.required ? ' *' : ''}</Typography>
          <Table size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                {columns.map(column => (
                  <TableCell key={column.id}>{getLocalizedText(column.label, locale)}{column.required ? ' *' : ''}</TableCell>
                ))}
                {mode === 'preview' && <TableCell width={48} />}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + 1}>
                    <Typography variant="caption" color="text.secondary">
                      {mode === 'print' ? ' ' : formTemplateText(dictionary, 'repeaterNoRows', 'Chua co dong nao')}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row, index) => (
                <TableRow key={index}>
                  {columns.map(column => (
                    <TableCell key={column.id}>
                      <FieldRenderer
                        field={{ ...column, label: { vi: '', en: '' } }}
                        mode={mode}
                        locale={locale}
                        dictionary={dictionary}
                        sessiontoken={sessiontoken}
                        projectId={projectId}
                        value={row[column.name]}
                        onChange={mode === 'preview' ? (columnValue => {
                          const nextRows = rows.map((r, i) => (i === index ? { ...r, [column.name]: columnValue } : r))

                          onChange?.(nextRows)
                        }) : undefined}
                      />
                    </TableCell>
                  ))}
                  {mode === 'preview' && (
                    <TableCell>
                      <IconButton
                        size="small"
                        disabled={!canRemove(index)}
                        onClick={() => onChange?.(rows.filter((_, i) => i !== index))}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {mode === 'preview' && (
            <IconButton
              size="small"
              disabled={!canAdd}
              onClick={() => onChange?.([...rows, emptyRepeaterRow(field)])}
              sx={{ mt: 1 }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          )}
          {error && <Typography variant="caption" color="error">{error}</Typography>}
        </Box>
      )
    }

    case 'text':
    default:
      return (
        <TextField
          fullWidth
          label={label}
          required={field.required}
          disabled={disabled}
          placeholder={placeholder}
          helperText={error ?? helpText}
          error={Boolean(error)}
          value={value ?? ''}
          onChange={event => onChange?.(event.target.value)}
        />
      )
  }
}

export default FieldRenderer
