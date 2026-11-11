'use client'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined'
import { Alert, Box, Button, Chip, Divider, Grid, Paper, Stack, Typography } from '@mui/material'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

import type { Locale } from '@/configs/i18n'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import { PermissionGuard } from '@/shared/permissions/PermissionGuard'
import { usePermission } from '@/shared/permissions/usePermission'
import SwalAlert from '@/shared/utils/SwalAlert'
import { useRouter } from '@shared/hooks/useRouter'

import PartnerEditForm from './components/PartnerEditForm'
import { usePartnerDetail } from './hooks/usePartnerDetail'
import { commonText, displayPartnerText, getPartnerStatusColor, getPartnerStatusLabel, partnerText } from './partnerHelpers'
import type { PartnerDictionary, PartnerItem, PartnerWorkflowError } from './types'

type Props = {
  dictionary: PartnerDictionary
  locale: Locale
  partner: PartnerItem | null
  error?: PartnerWorkflowError | null
}

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Grid size={{ xs: 12, md: 6 }}>
    <Stack spacing={0.75}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>{label}</Typography>
      <Box sx={{ minHeight: 28, display: 'flex', alignItems: 'center', minWidth: 0 }}>{children}</Box>
    </Stack>
  </Grid>
)

const PartnerDetailPage = ({ dictionary, locale, partner: initialPartner, error: initialError = null }: Props) => {
  const { data: session } = useSession()
  const detail = usePartnerDetail({ dictionary, sessiontoken: session?.user?.token ?? undefined, language: locale, partner: initialPartner, initialError })
  const router = useRouter()
  const permission = usePermission({ href: '/promotion-management/partners' })
  const listHref = `/${locale}/promotion-management/partners`
  const busy = detail.saving || detail.deleting

  const handleDeleteConfirm = async () => {
    if (!(await detail.remove())) return

    SwalAlert('success', partnerText(dictionary, 'delete_success', 'Partner deleted successfully.'), 'center', false, false, true, () => {
      router.push(listHref)
      router.refresh()
    })
  }

  const handleDeleteClick = () => {
    if (!permission.canDelete) {
      SwalAlert('warning', dictionary['common'].nopermissionview, 'center')

      return
    }

    const confirmMessage = [
      partnerText(dictionary, 'delete_confirm_title', 'Delete Partner?'),
      partnerText(dictionary, 'delete_confirm_message', 'This partner will be deleted. If the partner is still linked to promotions, the system may reject the request.'),
      detail.partner?.partner_name ? `${partnerText(dictionary, 'delete_confirm_item_label', 'Partner')}: ${detail.partner.partner_name}` : undefined
    ].filter(Boolean).join('\n')

    SwalAlert(
      'warning',
      confirmMessage,
      'center',
      false,
      true,
      true,
      () => {
        void handleDeleteConfirm()
      },
      partnerText(dictionary, 'delete_button', 'Delete Partner'),
      { cancelButtonText: commonText(dictionary, 'cancel', 'Cancel') }
    )
  }

  return (
    <ContentWrapper title={partnerText(dictionary, 'detail_page_title', 'Partner Detail')} description={partnerText(dictionary, 'detail_page_subtitle', 'View partner information.')} icon={<HandshakeOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />} dictionary={dictionary} issearch>
      <Stack spacing={3} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Button component={Link} href={listHref} variant="outlined" startIcon={<ArrowBackIcon />} disabled={busy}>
            {commonText(dictionary, 'back', 'Back')}
          </Button>
          {detail.partner && (
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" gap={1}>
              {detail.editing ? (
                <>
                  <Button variant="outlined" onClick={detail.cancelEdit} disabled={detail.saving}>{commonText(dictionary, 'cancel', 'Cancel')}</Button>
                  <Button variant="contained" onClick={() => void detail.save()} disabled={detail.saving}>{detail.saving ? commonText(dictionary, 'processing', 'Processing...') : commonText(dictionary, 'save', 'Save')}</Button>
                </>
              ) : (
                <>
                  <PermissionGuard href="/promotion-management/partners" action="MODIFY">
                    <Button variant="contained" startIcon={<EditOutlinedIcon />} onClick={detail.startEdit} disabled={busy}>
                      {partnerText(dictionary, 'change_button', 'Change')}
                    </Button>
                  </PermissionGuard>
                  <PermissionGuard href="/promotion-management/partners" action="DELETE">
                    <Button variant="contained" color="error" startIcon={<DeleteOutlineIcon />} onClick={handleDeleteClick} disabled={busy}>
                      {detail.deleting ? partnerText(dictionary, 'delete_button_loading', 'Deleting...') : partnerText(dictionary, 'delete_button', 'Delete Partner')}
                    </Button>
                  </PermissionGuard>
                </>
              )}
            </Stack>
          )}
        </Stack>

        {detail.error && <WorkflowErrorAlert title={partnerText(dictionary, 'detail_error_title', 'Unable to load partner detail')} description={detail.error.message} executionId={detail.error.executionId} referenceLabel={partnerText(dictionary, 'error_reference_label', 'Error Reference')} copyLabel={commonText(dictionary, 'copy', 'Copy')} copySuccessMessage={partnerText(dictionary, 'copy_error_reference_success', 'Copied error reference.')} copyFailedMessage={partnerText(dictionary, 'copy_error_reference_failed', 'Unable to copy error reference.')} />}

        {!detail.partner ? (
          <Alert severity={detail.error ? 'warning' : 'info'}>{partnerText(dictionary, 'detail_not_found', 'Partner detail was not found.')}</Alert>
        ) : (
          <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', overflowWrap: 'anywhere' }}>{displayPartnerText(detail.partner.partner_name)}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{displayPartnerText(detail.partner.partner_code)}</Typography>
                </Stack>
                <Chip size="small" color={getPartnerStatusColor(detail.partner.status)} label={getPartnerStatusLabel(dictionary, detail.partner.status)} sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }} />
              </Stack>
              <Divider />
              <Stack spacing={2}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{partnerText(dictionary, 'detail_information_title', 'Partner Information')}</Typography>
                {detail.editing ? (
                  <PartnerEditForm dictionary={dictionary} values={detail.values} errors={detail.fieldErrors} updateValue={detail.updateValue} />
                ) : (
                  <Grid container spacing={3}>
                    <DetailRow label={partnerText(dictionary, 'field_partner_code', 'Partner Code')}><Typography sx={{ fontFamily: 'monospace' }}>{displayPartnerText(detail.partner.partner_code)}</Typography></DetailRow>
                    <DetailRow label={partnerText(dictionary, 'field_partner_name', 'Partner Name')}><Typography sx={{ overflowWrap: 'anywhere' }}>{displayPartnerText(detail.partner.partner_name)}</Typography></DetailRow>
                    <DetailRow label={partnerText(dictionary, 'field_contact_name', 'Contact Person')}><Typography>{displayPartnerText(detail.partner.contact_name)}</Typography></DetailRow>
                    <DetailRow label={partnerText(dictionary, 'field_phone', 'Phone')}><Typography>{displayPartnerText(detail.partner.phone)}</Typography></DetailRow>
                    <DetailRow label={partnerText(dictionary, 'field_email', 'Email')}><Typography sx={{ overflowWrap: 'anywhere' }}>{displayPartnerText(detail.partner.email)}</Typography></DetailRow>
                    <DetailRow label={partnerText(dictionary, 'field_status', 'Status')}><Chip size="small" color={getPartnerStatusColor(detail.partner.status)} label={getPartnerStatusLabel(dictionary, detail.partner.status)} /></DetailRow>
                    <Grid size={{ xs: 12 }}><Stack spacing={0.75}><Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>{partnerText(dictionary, 'field_address', 'Address')}</Typography><Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{displayPartnerText(detail.partner.address)}</Typography></Stack></Grid>
                  </Grid>
                )}
              </Stack>
            </Stack>
          </Paper>
        )}
      </Stack>
    </ContentWrapper>
  )
}

export default PartnerDetailPage
