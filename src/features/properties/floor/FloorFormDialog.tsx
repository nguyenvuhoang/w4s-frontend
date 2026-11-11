'use client'

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material'

import { commonText, FLOOR_EDIT_STATUS_OPTIONS, floorText, getFloorStatusLabel } from './floorHelpers'
import type { FloorFormMode, FloorFormValues } from './hooks/useFloorForm'
import type { FloorBuildingOption, FloorDictionary } from './types'

type Props = {
  dictionary: FloorDictionary
  open: boolean
  mode: FloorFormMode
  values: FloorFormValues
  errors: Partial<Record<keyof FloorFormValues, string>>
  submitError: string | null
  buildingsError: string | null
  saving: boolean
  buildingOptions: FloorBuildingOption[]
  onChange: <K extends keyof FloorFormValues>(key: K, value: FloorFormValues[K]) => void
  onClose: () => void
  onSubmit: () => void
}

// Fields follow the planned contracts only: Tower, Floor code, Floor name (+ Status when editing).
// "Floor No" and "Display Order" were removed per customer feedback. The name is sent as typed
// (no "Tầng" prefix is added).
const FloorFormDialog = ({
  dictionary,
  open,
  mode,
  values,
  errors,
  submitError,
  buildingsError,
  saving,
  buildingOptions,
  onChange,
  onClose,
  onSubmit
}: Props) => {
  const currentBuildingMissing = values.building_id !== null && !buildingOptions.some(option => option.id === values.building_id)
  const currentStatusNotEditable = mode === 'edit' && values.status !== '' && !FLOOR_EDIT_STATUS_OPTIONS.includes(values.status)

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'create' ? floorText(dictionary, 'addFloor', 'Add floor') : floorText(dictionary, 'editFloor', 'Edit floor')}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {submitError && <Alert severity="error">{submitError}</Alert>}
          {buildingsError && <Alert severity="warning">{buildingsError}</Alert>}

          <TextField
            select
            fullWidth
            required
            label={floorText(dictionary, 'building', 'Tower')}
            value={values.building_id ?? ''}
            error={Boolean(errors.building_id)}
            helperText={errors.building_id}
            disabled={saving}
            onChange={event => onChange('building_id', event.target.value === '' ? null : Number(event.target.value))}
          >
            {buildingOptions.map(option => (
              <MenuItem key={option.id} value={option.id}>{option.name || option.building_code}</MenuItem>
            ))}
            {currentBuildingMissing && (
              <MenuItem value={values.building_id ?? ''}>{`#${values.building_id}`}</MenuItem>
            )}
          </TextField>
          <TextField
            fullWidth
            required
            label={floorText(dictionary, 'floorCode', 'Floor code')}
            value={values.floor_code}
            error={Boolean(errors.floor_code)}
            helperText={errors.floor_code}
            disabled={saving}
            onChange={event => onChange('floor_code', event.target.value)}
          />
          <TextField
            fullWidth
            required
            label={floorText(dictionary, 'floorName', 'Floor name')}
            value={values.name}
            error={Boolean(errors.name)}
            helperText={errors.name}
            disabled={saving}
            onChange={event => onChange('name', event.target.value)}
          />
          <TextField
            fullWidth
            multiline
            minRows={3}
            label={commonText(dictionary, 'description', 'Description')}
            value={values.description}
            disabled={saving}
            onChange={event => onChange('description', event.target.value)}
          />
          {mode === 'edit' && (
            <TextField
              select
              fullWidth
              required
              label={commonText(dictionary, 'status', 'Status')}
              value={values.status}
              error={Boolean(errors.status)}
              helperText={errors.status}
              disabled={saving}
              onChange={event => onChange('status', event.target.value)}
            >
              {FLOOR_EDIT_STATUS_OPTIONS.map(option => (
                <MenuItem key={option} value={option}>{getFloorStatusLabel(dictionary, option)}</MenuItem>
              ))}
              {currentStatusNotEditable && (
                <MenuItem value={values.status} disabled>{getFloorStatusLabel(dictionary, values.status)}</MenuItem>
              )}
            </TextField>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={saving}>{commonText(dictionary, 'cancel', 'Cancel')}</Button>
        <Button variant="contained" disabled={saving} onClick={onSubmit}>
          {saving ? commonText(dictionary, 'processing', 'Processing...') : commonText(dictionary, 'save', 'Save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default FloorFormDialog
