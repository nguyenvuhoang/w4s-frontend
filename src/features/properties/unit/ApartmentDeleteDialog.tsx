'use client'

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'

import { apartmentText, commonText } from './apartmentHelpers'
import type { ApartmentDictionary } from './types'

type Props = {
  dictionary: ApartmentDictionary
  open: boolean
  deleting: boolean
  error: string | null
  /** Shown so the user knows exactly which apartment is deleted. */
  apartmentCode?: string
  onCancel: () => void
  onConfirm: () => void
}

const ApartmentDeleteDialog = ({ dictionary, open, deleting, error, apartmentCode, onCancel, onConfirm }: Props) => (
  <Dialog open={open} onClose={deleting ? undefined : onCancel} maxWidth="xs" fullWidth>
    <DialogTitle>{apartmentText(dictionary, 'deleteApartment', 'Delete apartment')}</DialogTitle>
    <DialogContent>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        <Typography>{apartmentText(dictionary, 'deleteApartmentConfirm', 'Are you sure you want to delete this apartment?')}</Typography>
        {apartmentCode && <Typography sx={{ fontWeight: 800 }}>{apartmentCode}</Typography>}
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

export default ApartmentDeleteDialog
