'use client'

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material'

import { BUILDING_EDIT_STATUS_OPTIONS, buildingText, commonText, getBuildingStatusLabel } from './buildingHelpers'
import type { BuildingFormValues } from './hooks/useBuildingForm'
import type { BuildingDictionary } from './types'

type Props = {
  dictionary: BuildingDictionary
  open: boolean
  values: BuildingFormValues
  errors: Partial<Record<keyof BuildingFormValues, string>>
  submitError: string | null
  saving: boolean
  onChange: <K extends keyof BuildingFormValues>(key: K, value: BuildingFormValues[K]) => void
  onClose: () => void
  onSubmit: () => void
}

// Edit tower dialog (create is the /properties/building/create page). Fields follow WF_BO_UPDATE_BUILDING:
// Tower code, Tower name, Floor count, Description, Resident count, Status. Display order is not edited (sent back unchanged).
const BuildingFormDialog = ({
  dictionary,
  open,
  values,
  errors,
  submitError,
  saving,
  onChange,
  onClose,
  onSubmit
}: Props) => {
  const currentStatusNotEditable = values.status !== '' && !BUILDING_EDIT_STATUS_OPTIONS.includes(values.status)

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {buildingText(dictionary, 'editBuilding', 'Edit tower')}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {submitError && <Alert severity="error">{submitError}</Alert>}
          <TextField
            fullWidth
            required
            label={buildingText(dictionary, 'buildingCode', 'Tower code')}
            value={values.building_code}
            error={Boolean(errors.building_code)}
            helperText={errors.building_code}
            disabled={saving}
            onChange={event => onChange('building_code', event.target.value)}
          />
          <TextField
            fullWidth
            required
            label={buildingText(dictionary, 'buildingName', 'Tower name')}
            value={values.name}
            error={Boolean(errors.name)}
            helperText={errors.name}
            disabled={saving}
            onChange={event => onChange('name', event.target.value)}
          />
          <TextField
            fullWidth
            label={buildingText(dictionary, 'floorCount', 'Floor count')}
            value={values.floor_count}
            error={Boolean(errors.floor_count)}
            helperText={errors.floor_count}
            disabled={saving}
            onChange={event => onChange('floor_count', event.target.value)}
            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
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
          <TextField
            fullWidth
            label={buildingText(dictionary, 'residentCount', 'Resident count')}
            value={values.resident_count}
            error={Boolean(errors.resident_count)}
            helperText={errors.resident_count}
            disabled={saving}
            onChange={event => onChange('resident_count', event.target.value)}
            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
          />
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
            {BUILDING_EDIT_STATUS_OPTIONS.map(option => (
              <MenuItem key={option} value={option}>{getBuildingStatusLabel(dictionary, option)}</MenuItem>
            ))}
            {currentStatusNotEditable && (
              <MenuItem value={values.status} disabled>{getBuildingStatusLabel(dictionary, values.status)}</MenuItem>
            )}
          </TextField>
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

export default BuildingFormDialog
