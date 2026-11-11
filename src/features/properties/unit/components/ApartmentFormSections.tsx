'use client'

import type { ReactNode } from 'react'

import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { Grid, IconButton, InputAdornment, MenuItem, Paper, TextField, Tooltip, Typography } from '@mui/material'

import type { Locale } from '@/configs/i18n'

import { APARTMENT_RECORD_STATUS_OPTIONS } from '../apartmentCreateHelpers'
import {
  apartmentText,
  commonText,
  formatApartmentBuildingLabel,
  formatApartmentFloorLabel,
  getApartmentRecordStatusLabel,
  isAreaDraftInput
} from '../apartmentHelpers'
import { getApartmentStatusCaption, useApartmentStatusCodeList } from '../hooks/useApartmentStatusCodeList'
import { getApartmentTypeCaption, useApartmentTypeCodeList } from '../hooks/useApartmentTypeCodeList'
import type { ApartmentBuildingOption, ApartmentCreateFormValues, ApartmentDictionary, ApartmentFloorOption } from '../types'

// Sections shared by the Create and Edit Apartment pages (same fields, order and conventions).

type FieldErrors = Partial<Record<string, string>>
// Non-generic so both the create and the edit (create + status) setters fit.
type UpdateValue = (key: keyof ApartmentCreateFormValues, value: ApartmentCreateFormValues[keyof ApartmentCreateFormValues]) => void

export const ApartmentFormSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main', mb: 2 }}>{title}</Typography>
    <Grid container spacing={2.5}>{children}</Grid>
  </Paper>
)

/** "Vị trí căn hộ": [Project] [Tower] [Floor] [Unit number] — input order follows the code formula Tower – Floor – Unit. */
export const ApartmentLocationSection = ({
  dictionary,
  projectLabel,
  values,
  errors,
  disabled,
  buildingOptions,
  buildingsLoading,
  floorOptions,
  floorsLoading,
  onBuildingChange,
  updateValue
}: {
  dictionary: ApartmentDictionary
  projectLabel: string
  values: ApartmentCreateFormValues
  errors: FieldErrors
  disabled: boolean
  buildingOptions: ApartmentBuildingOption[]
  buildingsLoading: boolean
  floorOptions: ApartmentFloorOption[]
  floorsLoading: boolean
  onBuildingChange: (buildingId: number | null) => void
  updateValue: UpdateValue
}) => (
  <ApartmentFormSection title={apartmentText(dictionary, 'apartmentCreateSectionLocation', 'Apartment location')}>
    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
      {/* Context only: the project is locked (create: working project, edit: the apartment's project). */}
      <TextField
        fullWidth
        required
        disabled
        label={apartmentText(dictionary, 'project', 'Project')}
        value={projectLabel}
        error={Boolean(errors.project)}
        helperText={errors.project}
      />
    </Grid>
    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
      <TextField
        select
        fullWidth
        required
        label={apartmentText(dictionary, 'building', 'Tower')}
        // Only bind the id once its option is loaded (edit preselects before the options arrive).
        value={buildingOptions.some(building => building.id === values.building_id) ? values.building_id : ''}
        error={Boolean(errors.building_id || errors.building_code)}
        helperText={errors.building_id ?? errors.building_code}
        disabled={disabled || buildingsLoading || buildingOptions.length === 0}
        onChange={event => onBuildingChange(event.target.value === '' ? null : Number(event.target.value))}
      >
        {buildingOptions.map(building => (
          <MenuItem key={building.id} value={building.id}>{formatApartmentBuildingLabel(building)}</MenuItem>
        ))}
      </TextField>
    </Grid>
    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
      <TextField
        select
        fullWidth
        required
        label={apartmentText(dictionary, 'floor', 'Floor')}
        value={floorOptions.some(floor => floor.id === values.floor_id) ? values.floor_id : ''}
        error={Boolean(errors.floor_id || errors.floor_no)}
        helperText={errors.floor_id ?? errors.floor_no}
        disabled={disabled || !values.building_id || floorsLoading || floorOptions.length === 0}
        onChange={event => updateValue('floor_id', event.target.value === '' ? null : Number(event.target.value))}
      >
        {floorOptions.map(floor => (
          <MenuItem key={floor.id} value={floor.id}>{formatApartmentFloorLabel(floor)}</MenuItem>
        ))}
      </TextField>
    </Grid>
    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
      <TextField
        fullWidth
        required
        label={apartmentText(dictionary, 'apartmentNo', 'Unit Code')}
        value={values.unit_number}
        error={Boolean(errors.unit_number)}
        helperText={errors.unit_number}
        disabled={disabled}
        onChange={event => updateValue('unit_number', event.target.value)}
      />
    </Grid>
  </ApartmentFormSection>
)

/**
 * "Trạng thái căn hộ" select (create and edit): options from CodeList IPS / APARTMENT_STATUS, the form keeps (and
 * sends) the code value. A stored value outside the visible CodeList (legacy / list not loaded) stays selected
 * and is sent back unchanged, but cannot be chosen again once another value is picked.
 */
export const ApartmentStatusSelect = ({
  dictionary,
  locale,
  value,
  disabled,
  onChange
}: {
  dictionary: ApartmentDictionary
  locale: Locale
  value: string
  disabled: boolean
  onChange: (value: string) => void
}) => {
  const apartmentStatusCodes = useApartmentStatusCodeList(locale)
  const apartmentStatusListed = apartmentStatusCodes.options.some(option => option.value === value)

  return (
    <TextField
      select
      fullWidth
      label={apartmentText(dictionary, 'apartmentStatus', 'Apartment status')}
      value={value}
      disabled={disabled || apartmentStatusCodes.isLoading}
      helperText={apartmentStatusCodes.error
        ? apartmentText(dictionary, 'apartmentStatusLoadError', 'Unable to load apartment statuses.')
        : apartmentStatusCodes.isLoading
          ? commonText(dictionary, 'loading', 'Loading, please wait...')
          : undefined}
      onChange={event => onChange(event.target.value)}
      slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
    >
      <MenuItem value="">--</MenuItem>
      {apartmentStatusCodes.options.map(option => (
        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
      ))}
      {value && !apartmentStatusListed && (
        <MenuItem value={value} disabled>
          {getApartmentStatusCaption(apartmentStatusCodes.captionMap, value)}
        </MenuItem>
      )}
    </TextField>
  )
}

/** Required record status select (A / I). Another stored status stays selected and is sent back unchanged, but cannot be chosen. */
export const ApartmentRecordStatusSelect = ({
  dictionary,
  value,
  error,
  disabled,
  onChange
}: {
  dictionary: ApartmentDictionary
  value: string
  error?: string
  disabled: boolean
  onChange: (value: string) => void
}) => (
  <TextField
    select
    fullWidth
    required
    label={commonText(dictionary, 'status', 'Status')}
    value={value}
    error={Boolean(error)}
    helperText={error}
    disabled={disabled}
    onChange={event => onChange(event.target.value)}
  >
    {APARTMENT_RECORD_STATUS_OPTIONS.map(option => (
      <MenuItem key={option} value={option}>{apartmentText(dictionary, `status${option}`, option)}</MenuItem>
    ))}
    {value && !APARTMENT_RECORD_STATUS_OPTIONS.includes(value) && (
      <MenuItem value={value} disabled>{getApartmentRecordStatusLabel(dictionary, value)}</MenuItem>
    )}
  </TextField>
)

/**
 * "Thông tin căn hộ": editable full code (auto from the formula by default, custom once typed, with a
 * restore-default action), then type / statuses / area (m²) / room count.
 */
export const ApartmentInfoSection = ({
  dictionary,
  locale,
  apartmentCode,
  apartmentCodeCustom,
  onApartmentCodeChange,
  onApartmentCodeRestore,
  values,
  errors,
  disabled,
  updateValue,
  apartmentStatusField,
  statusField,
  children
}: {
  dictionary: ApartmentDictionary
  locale: Locale
  apartmentCode: string
  /** true: custom code (not overwritten by tower / floor / unit changes); false: follows the formula. */
  apartmentCodeCustom: boolean
  onApartmentCodeChange: (value: string) => void
  onApartmentCodeRestore: () => void
  values: ApartmentCreateFormValues
  errors: FieldErrors
  disabled: boolean
  updateValue: UpdateValue
  /** Field right after the apartment type (apartment status). */
  apartmentStatusField?: ReactNode
  /** Create: record status on the first row, right after the apartment status. */
  statusField?: ReactNode
  /** Edit: extra fields after room count (record status). */
  children?: ReactNode
}) => {
  const apartmentTypeCodes = useApartmentTypeCodeList(locale)
  const apartmentTypeListed = apartmentTypeCodes.options.some(option => option.value === values.apartment_type)
  // Create: [type][apartment status][status] then [area][room count];
  // edit: [type][apartment status][area][room count] then [status].
  const fieldSize = statusField
    ? { xs: 12, md: 4 }
    : children || apartmentStatusField ? { xs: 12, sm: 6, md: 3 } : { xs: 12, md: 4 }
  const measureSize = statusField ? { xs: 12, md: 6 } : fieldSize
  const restoreLabel = apartmentText(dictionary, 'apartmentFullCodeRestore', 'Restore default')

  return (
    <ApartmentFormSection title={apartmentText(dictionary, 'apartmentInfo', 'Apartment information')}>
      <Grid size={{ xs: 12 }}>
        {/* Auto (Tower – Floor – Unit) by default; typing switches to a custom code, restored by the end action. */}
        <TextField
          fullWidth
          required
          label={apartmentText(dictionary, 'apartmentFullCode', 'Full apartment code')}
          value={apartmentCode}
          placeholder="—"
          error={Boolean(errors.apartment_code)}
          helperText={errors.apartment_code ?? (apartmentCodeCustom
            ? apartmentText(dictionary, 'apartmentFullCodeCustomHelper', 'Custom code – not updated when Tower, Floor or Unit changes')
            : apartmentText(dictionary, 'apartmentFullCodeHelper', 'Automatically generated from Tower – Floor – Unit'))}
          disabled={disabled}
          onChange={event => onApartmentCodeChange(event.target.value)}
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              endAdornment: apartmentCodeCustom ? (
                <InputAdornment position="end">
                  <Tooltip title={restoreLabel}>
                    <span>
                      <IconButton edge="end" size="small" aria-label={restoreLabel} disabled={disabled} onClick={onApartmentCodeRestore}>
                        <RestartAltIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </InputAdornment>
              ) : undefined
            }
          }}
          sx={{ '& .MuiInputBase-input': { fontWeight: 700 } }}
        />
      </Grid>
      <Grid size={fieldSize}>
        <TextField
          select
          fullWidth
          label={apartmentText(dictionary, 'apartmentType', 'Apartment Type')}
          value={values.apartment_type}
          disabled={disabled || apartmentTypeCodes.isLoading}
          helperText={apartmentTypeCodes.error
            ? apartmentText(dictionary, 'apartmentTypeLoadError', 'Unable to load apartment types.')
            : apartmentTypeCodes.isLoading
              ? commonText(dictionary, 'loading', 'Loading, please wait...')
              : undefined}
          onChange={event => updateValue('apartment_type', event.target.value)}
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">-</MenuItem>
          {apartmentTypeCodes.options.map(option => (
            <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
          ))}
          {/* A stored type outside the visible CodeList is retained but cannot be selected again. */}
          {values.apartment_type && !apartmentTypeListed && (
            <MenuItem value={values.apartment_type} disabled>
              {getApartmentTypeCaption(apartmentTypeCodes.captionMap, values.apartment_type)}
            </MenuItem>
          )}
        </TextField>
      </Grid>
      {apartmentStatusField && <Grid size={fieldSize}>{apartmentStatusField}</Grid>}
      {statusField && <Grid size={fieldSize}>{statusField}</Grid>}
      <Grid size={measureSize}>
        <TextField
          fullWidth
          label={apartmentText(dictionary, 'areaWithUnit', 'Area (m²)')}
          value={values.area}
          error={Boolean(errors.area)}
          helperText={errors.area}
          disabled={disabled}
          onChange={event => { if (isAreaDraftInput(event.target.value)) updateValue('area', event.target.value) }}
          slotProps={{ htmlInput: { inputMode: 'decimal' } }}
        />
      </Grid>
      <Grid size={measureSize}>
        <TextField
          fullWidth
          label={apartmentText(dictionary, 'roomCount', 'Room count')}
          value={values.room_count}
          error={Boolean(errors.room_count)}
          helperText={errors.room_count}
          disabled={disabled}
          onChange={event => updateValue('room_count', event.target.value)}
          slotProps={{ htmlInput: { inputMode: 'numeric' } }}
        />
      </Grid>
      {children && <Grid size={fieldSize}>{children}</Grid>}
    </ApartmentFormSection>
  )
}

/** "Thông tin kỹ thuật": water / electricity meter codes (trimmed on submit). */
export const ApartmentTechnicalSection = ({
  dictionary,
  values,
  disabled,
  updateValue
}: {
  dictionary: ApartmentDictionary
  values: ApartmentCreateFormValues
  disabled: boolean
  updateValue: UpdateValue
}) => (
  <ApartmentFormSection title={apartmentText(dictionary, 'apartmentCreateSectionTechnical', 'Technical information')}>
    <Grid size={{ xs: 12, md: 6 }}>
      <TextField
        fullWidth
        label={apartmentText(dictionary, 'waterMeterCode', 'Water Meter Code')}
        value={values.water_meter_code}
        disabled={disabled}
        onChange={event => updateValue('water_meter_code', event.target.value)}
      />
    </Grid>
    <Grid size={{ xs: 12, md: 6 }}>
      <TextField
        fullWidth
        label={apartmentText(dictionary, 'electricityMeterCode', 'Electricity Meter Code')}
        value={values.electricity_meter_code}
        disabled={disabled}
        onChange={event => updateValue('electricity_meter_code', event.target.value)}
      />
    </Grid>
  </ApartmentFormSection>
)

/** "Bàn giao & mô tả": handover date (date input; sent as ISO UTC or "") and description. */
export const ApartmentHandoverSection = ({
  dictionary,
  values,
  disabled,
  updateValue
}: {
  dictionary: ApartmentDictionary
  values: ApartmentCreateFormValues
  disabled: boolean
  updateValue: UpdateValue
}) => (
  <ApartmentFormSection title={apartmentText(dictionary, 'apartmentCreateSectionHandover', 'Handover & description')}>
    <Grid size={{ xs: 12, md: 6 }}>
      <TextField
        fullWidth
        type="date"
        label={apartmentText(dictionary, 'handoverDate', 'Handover date')}
        value={values.handover_date}
        disabled={disabled}
        onChange={event => updateValue('handover_date', event.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
      />
    </Grid>
    <Grid size={{ xs: 12 }}>
      <TextField
        fullWidth
        multiline
        minRows={4}
        label={commonText(dictionary, 'description', 'Description')}
        value={values.description}
        disabled={disabled}
        onChange={event => updateValue('description', event.target.value)}
      />
    </Grid>
  </ApartmentFormSection>
)
