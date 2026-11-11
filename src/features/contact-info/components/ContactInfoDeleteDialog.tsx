import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography
} from '@mui/material'

import type { ContactInfoDictionary, ContactInfoItem } from '../types'
import {
  commonText,
  contactInfoText,
  displayText,
  getContactTypeLabel
} from './contactInfoHelpers'

type Props = {
  dictionary: ContactInfoDictionary
  contact: ContactInfoItem | null
  loading: boolean
  error: string | null
  onClose: () => void
  onConfirm: () => void
}

const DetailLine = ({ label, value }: { label: string; value: string }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 1 }}>
    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>{label}</Typography>
    <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{value}</Typography>
  </Box>
)

const ContactInfoDeleteDialog = ({ dictionary, contact, loading, error, onClose, onConfirm }: Props) => (
  <Dialog open={Boolean(contact)} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs">
    <DialogTitle sx={{ fontWeight: 800 }}>
      {contactInfoText(dictionary, 'delete_title', 'Delete Project Contact')}
    </DialogTitle>
    <DialogContent>
      <Stack spacing={2}>
        <DialogContentText>
          {contactInfoText(dictionary, 'delete_confirm_message', 'Are you sure you want to delete this contact information?')}
        </DialogContentText>

        {contact && (
          <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'action.hover' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
              {contactInfoText(dictionary, 'delete_target', 'Contact to delete')}
            </Typography>
            <Stack spacing={1}>
              <DetailLine label={contactInfoText(dictionary, 'create_field_name', 'Contact Name')} value={displayText(contact.name)} />
              <DetailLine label={contactInfoText(dictionary, 'field_phone', 'Phone')} value={displayText(contact.phone)} />
              <DetailLine label={contactInfoText(dictionary, 'field_contact_type', 'Contact Type')} value={getContactTypeLabel(dictionary, contact.contact_type)} />
            </Stack>
          </Box>
        )}

        {error && <Alert severity="error">{error}</Alert>}
      </Stack>
    </DialogContent>
    <DialogActions sx={{ px: 3, py: 2 }}>
      <Button onClick={onClose} disabled={loading}>
        {commonText(dictionary, 'cancel', 'Cancel')}
      </Button>
      <Button
        variant="contained"
        color="error"
        startIcon={loading ? <CircularProgress color="inherit" size={16} /> : <DeleteOutlineIcon />}
        onClick={onConfirm}
        disabled={loading || !contact}
      >
        {contactInfoText(dictionary, 'delete', 'Delete')}
      </Button>
    </DialogActions>
  </Dialog>
)

export default ContactInfoDeleteDialog
