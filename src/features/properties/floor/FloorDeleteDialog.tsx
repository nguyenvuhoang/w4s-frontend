'use client'

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'

import { commonText, floorText } from './floorHelpers'
import type { FloorDictionary } from './types'

type Props = {
  dictionary: FloorDictionary
  open: boolean
  deleting: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}

const FloorDeleteDialog = ({ dictionary, open, deleting, error, onCancel, onConfirm }: Props) => (
  <Dialog open={open} onClose={deleting ? undefined : onCancel} maxWidth="xs" fullWidth>
    <DialogTitle>{floorText(dictionary, 'deleteFloor', 'Delete floor')}</DialogTitle>
    <DialogContent>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        <Typography>{floorText(dictionary, 'deleteFloorConfirm', 'Are you sure you want to delete this floor?')}</Typography>
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

export default FloorDeleteDialog
