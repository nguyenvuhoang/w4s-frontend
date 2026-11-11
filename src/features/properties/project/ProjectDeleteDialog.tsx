'use client'

import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'

type Props = {
  open: boolean
  deleting: boolean
  error: string | null
  labels: { title: string; message: string; cancel: string; confirm: string; processing: string }
  onCancel: () => void
  onConfirm: () => void
}

/** Confirmation for WF_BO_DELETE_PROJECT; submit errors stay inside the dialog (same pattern as BuildingDeleteDialog). */
const ProjectDeleteDialog = ({ open, deleting, error, labels, onCancel, onConfirm }: Props) => (
  <Dialog open={open} onClose={deleting ? undefined : onCancel} maxWidth="xs" fullWidth>
    <DialogTitle>{labels.title}</DialogTitle>
    <DialogContent>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        <Typography>{labels.message}</Typography>
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} disabled={deleting}>{labels.cancel}</Button>
      <Button
        variant="contained"
        color="error"
        disabled={deleting}
        startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : undefined}
        onClick={onConfirm}
      >
        {deleting ? labels.processing : labels.confirm}
      </Button>
    </DialogActions>
  </Dialog>
)

export default ProjectDeleteDialog
