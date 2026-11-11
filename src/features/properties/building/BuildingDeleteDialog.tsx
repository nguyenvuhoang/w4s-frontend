'use client'

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'

import { buildingText, commonText } from './buildingHelpers'
import type { BuildingDictionary } from './types'

type Props = {
  dictionary: BuildingDictionary
  open: boolean
  deleting: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}

const BuildingDeleteDialog = ({ dictionary, open, deleting, error, onCancel, onConfirm }: Props) => (
  <Dialog open={open} onClose={deleting ? undefined : onCancel} maxWidth="xs" fullWidth>
    <DialogTitle>{buildingText(dictionary, 'deleteBuilding', 'Delete tower')}</DialogTitle>
    <DialogContent>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        <Typography>{buildingText(dictionary, 'deleteBuildingConfirm', 'Are you sure you want to delete this tower?')}</Typography>
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} disabled={deleting}>{commonText(dictionary, 'cancel', 'Cancel')}</Button>
      <Button variant="contained" color="error" disabled={deleting} onClick={onConfirm}>
        {deleting ? commonText(dictionary, 'processing', 'Processing...') : commonText(dictionary, 'delete', 'Delete')}
      </Button>
    </DialogActions>
  </Dialog>
)

export default BuildingDeleteDialog
