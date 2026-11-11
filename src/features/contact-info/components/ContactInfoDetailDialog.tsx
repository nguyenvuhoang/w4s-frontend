import AccessTimeIcon from '@mui/icons-material/AccessTime'
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'
import CloseIcon from '@mui/icons-material/Close'
import PhoneIcon from '@mui/icons-material/Phone'
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography
} from '@mui/material'
import type { ReactNode } from 'react'

import type { ContactInfoDictionary, ContactInfoItem } from '../types'
import {
  commonText,
  contactInfoText,
  displayText,
  getContactStatusColor,
  getContactStatusLabel,
  getContactTypeLabel
} from './contactInfoHelpers'

type Props = {
  dictionary: ContactInfoDictionary
  open: boolean
  loading: boolean
  error: string | null
  contact: ContactInfoItem | null
  onClose: () => void
}

const DetailRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '190px 1fr' }, gap: 1.5 }}>
    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>{label}</Typography>
    <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>{children}</Box>
  </Box>
)

const IconValue = ({ icon, value }: { icon: ReactNode; value: unknown }) => (
  <Stack direction="row" alignItems="center" gap={0.75}>
    {icon}
    <span>{displayText(value)}</span>
  </Stack>
)

const ContactInfoDetailDialog = ({ dictionary, open, loading, error, contact, onClose }: Props) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle sx={{ pr: 7, fontWeight: 800 }}>
      {contactInfoText(dictionary, 'detail_title', 'Project Contact Detail')}
      <IconButton
        aria-label={commonText(dictionary, 'close', 'Close')}
        onClick={onClose}
        sx={{ position: 'absolute', right: 12, top: 10 }}
      >
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent dividers>
      {loading ? (
        <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress /></Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : contact ? (
        <Stack spacing={2}>
          <DetailRow label={contactInfoText(dictionary, 'field_id', 'Contact ID')}>{displayText(contact.id)}</DetailRow>
          <DetailRow label={contactInfoText(dictionary, 'field_project_id', 'Project ID')}>{displayText(contact.project_id)}</DetailRow>
          <DetailRow label={contactInfoText(dictionary, 'field_contact_type', 'Contact Type')}>
            {getContactTypeLabel(dictionary, contact.contact_type)}
          </DetailRow>
          <DetailRow label={contactInfoText(dictionary, 'field_name', 'Name')}>{displayText(contact.name)}</DetailRow>
          <DetailRow label={contactInfoText(dictionary, 'field_phone', 'Phone')}>
            <IconValue icon={<PhoneIcon sx={{ fontSize: 17, color: 'text.secondary' }} />} value={contact.phone} />
          </DetailRow>
          <DetailRow label={contactInfoText(dictionary, 'field_email', 'Email')}>
            <IconValue icon={<AlternateEmailIcon sx={{ fontSize: 17, color: 'text.secondary' }} />} value={contact.email} />
          </DetailRow>
          <DetailRow label={contactInfoText(dictionary, 'field_address', 'Address')}>{displayText(contact.address)}</DetailRow>
          <DetailRow label={contactInfoText(dictionary, 'field_working_hours', 'Working Hours')}>
            <IconValue icon={<AccessTimeIcon sx={{ fontSize: 17, color: 'text.secondary' }} />} value={contact.working_hours} />
          </DetailRow>
          <DetailRow label={contactInfoText(dictionary, 'field_note', 'Note')}>{displayText(contact.note)}</DetailRow>
          <DetailRow label={contactInfoText(dictionary, 'field_display_order', 'Display Order')}>{displayText(contact.display_order)}</DetailRow>
          <DetailRow label={contactInfoText(dictionary, 'field_status', 'Status')}>
            <Chip
              size="small"
              color={getContactStatusColor(contact.status)}
              label={getContactStatusLabel(dictionary, contact.status)}
            />
          </DetailRow>
        </Stack>
      ) : null}
    </DialogContent>
  </Dialog>
)

export default ContactInfoDetailDialog
