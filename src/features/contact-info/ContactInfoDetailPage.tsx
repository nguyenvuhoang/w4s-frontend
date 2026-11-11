'use client'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ContactPhoneIcon from '@mui/icons-material/ContactPhone'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'
import PhoneIcon from '@mui/icons-material/Phone'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Typography
} from '@mui/material'
import Link from 'next/link'
import { useRouter } from '@shared/hooks/useRouter'
import { useState } from 'react'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { PermissionGuard } from '@shared/permissions/PermissionGuard'
import { usePermission } from '@shared/permissions/usePermission'

import ContactInfoDeleteDialog from './components/ContactInfoDeleteDialog'
import {
  commonText,
  contactInfoText,
  displayText,
  getContactStatusColor,
  getContactStatusLabel,
  getContactTypeLabel
} from './components/contactInfoHelpers'
import { contactInfoService } from './service'
import type { ContactInfoDictionary, ContactInfoItem } from './types'

type Props = {
  dictionary: ContactInfoDictionary
  locale: string
  sessiontoken?: string
  contact: ContactInfoItem | null
  error?: string | null
}

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px 1fr' }, gap: 1.5 }}>
    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>{label}</Typography>
    <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>{children}</Box>
  </Box>
)

const IconValue = ({ icon, value }: { icon: React.ReactNode; value: unknown }) => (
  <Stack direction="row" alignItems="center" gap={0.75}>
    {icon}
    <span>{displayText(value)}</span>
  </Stack>
)

const ContactInfoDetailPage = ({ dictionary, locale, sessiontoken, contact, error = null }: Props) => {
  const router = useRouter()
  const permission = usePermission({ href: '/contact-info-view-detail' })
  const [deleteTarget, setDeleteTarget] = useState<ContactInfoItem | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const closeDeleteConfirm = () => {
    if (deleteLoading) return
    setDeleteTarget(null)
    setDeleteError(null)
  }

  const deleteContact = async () => {
    if (!deleteTarget?.id) return

    setDeleteLoading(true)
    setDeleteError(null)

    try {
      await contactInfoService.deleteProjectContact({
        sessiontoken,
        language: locale as any,
        id: deleteTarget.id
      })

      setDeleteTarget(null)
      setNotice(contactInfoText(dictionary, 'delete_success', 'Project contact has been deleted.'))
      router.push(`/${locale}/contact-info`)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : contactInfoText(dictionary, 'delete_failed', 'Unable to delete project contact.'))
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <ContentWrapper
      title={contactInfoText(dictionary, 'detail_title', 'Project Contact Detail')}
      description={contactInfoText(dictionary, 'page_subtitle', 'View project contact information and available actions.')}
      icon={<ContactPhoneIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <Stack spacing={3} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(`/${locale}/contact-info`)}>
            {commonText(dictionary, 'back', 'Back')}
          </Button>

          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" gap={1}>
            {!permission.resolved ? (
              <Skeleton variant="rounded" width={220} height={36} />
            ) : (
              <>
                <PermissionGuard href="/contact-info-view-detail" action="DELETE">
                  <Button
                    color="error"
                    variant="outlined"
                    startIcon={<DeleteOutlineIcon />}
                    disabled={!contact?.id}
                    onClick={() => contact && setDeleteTarget(contact)}
                  >
                    {contactInfoText(dictionary, 'delete', 'Delete')}
                  </Button>
                </PermissionGuard>
                <PermissionGuard href="/contact-info-view-detail" action="MODIFY">
                  <Button
                    component={Link}
                    href={`/${locale}/contact-info-view-detail/${contact?.id}/edit`}
                    variant="contained"
                    startIcon={<EditOutlinedIcon />}
                    disabled={!contact?.id}
                  >
                    {contactInfoText(dictionary, 'edit', 'Edit')}
                  </Button>
                </PermissionGuard>
              </>
            )}
          </Stack>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        {!contact ? (
          <Alert severity={error ? 'warning' : 'info'}>
            {contactInfoText(dictionary, 'detail_not_found', 'Project contact detail was not found.')}
          </Alert>
        ) : (
          <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
            <Stack spacing={2.5}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                <Stack spacing={0.5}>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main' }}>
                    {displayText(contact.name)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getContactTypeLabel(dictionary, contact.contact_type)}
                  </Typography>
                </Stack>
                <Chip
                  size="small"
                  color={getContactStatusColor(contact.status)}
                  label={getContactStatusLabel(dictionary, contact.status)}
                  sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}
                />
              </Stack>

              <Divider />

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
            </Stack>
          </Paper>
        )}
      </Stack>

      <ContactInfoDeleteDialog
        dictionary={dictionary}
        contact={deleteTarget}
        loading={deleteLoading}
        error={deleteError}
        onClose={closeDeleteConfirm}
        onConfirm={() => void deleteContact()}
      />

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={3000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      </Snackbar>
    </ContentWrapper>
  )
}

export default ContactInfoDetailPage
