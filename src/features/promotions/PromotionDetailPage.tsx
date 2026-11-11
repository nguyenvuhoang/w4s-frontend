'use client'

import { useRef, useState } from 'react'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Alert, Box, Button, Chip, Divider, Grid, Paper, Skeleton, Stack, Typography } from '@mui/material'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

import { useWorkingProjectId } from '@/@core/stores/useWorkingProjectStore'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import SwalAlert from '@/shared/utils/SwalAlert'
import { useRouter } from '@shared/hooks/useRouter'
import { PermissionGuard } from '@shared/permissions/PermissionGuard'
import { usePermission } from '@shared/permissions/usePermission'

import {
  commonText,
  displayPromotionText,
  formatPromotionValidPeriod,
  getPromotionEditHref,
  getPromotionLifecycleColor,
  getPromotionLifecycleLabel,
  getPromotionLifecycleStatus,
  getPromotionStatusColor,
  getPromotionListHref,
  getPromotionStatusLabel,
  getPromotionWebViewLabel,
  promotionText
} from './components/promotionHelpers'
import { usePromotionDetail } from './hooks/usePromotionDetail'
import { promotionService } from './service'
import type { PromotionDictionary, PromotionItem, PromotionWorkflowError } from './types'

type Props = {
  dictionary: PromotionDictionary
  locale: string
  id: number | string
  promotion: PromotionItem | null
  error?: PromotionWorkflowError | null
}

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Grid size={{ xs: 12, md: 6 }}>
    <Stack spacing={0.75}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Box sx={{ minHeight: 28, display: 'flex', alignItems: 'center', minWidth: 0 }}>
        {children}
      </Box>
    </Stack>
  </Grid>
)

const PromotionHeroImage = ({ src, title }: { src: string; title: string }) => {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(src) && !failed

  return (
    <Box
      sx={{
        position: 'relative',
        width: { xs: '100%', md: 260 },
        height: { xs: 200, md: 180 },
        borderRadius: 2,
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
        bgcolor: 'action.hover',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      {showImage && !loaded && (
        <Skeleton variant="rectangular" width="100%" height="100%" sx={{ position: 'absolute', inset: 0 }} />
      )}

      {showImage ? (
        <Box
          component="img"
          src={src}
          alt={title || 'promotion'}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: loaded ? 'block' : 'none'
          }}
        />
      ) : (
        <Stack spacing={1} alignItems="center" color="text.secondary">
          <ImageNotSupportedOutlinedIcon fontSize="large" />
          <Typography variant="body2">-</Typography>
        </Stack>
      )}
    </Box>
  )
}

const PromotionQrCode = ({ src }: { src: string }) => {
  const [failed, setFailed] = useState(false)

  if (!src || failed) return null

  return (
    <Box
      sx={{
        width: 160,
        height: 160,
        borderRadius: 2,
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Box
        component="img"
        src={src}
        alt="QR code"
        onError={() => setFailed(true)}
        sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </Box>
  )
}

const PromotionDetailPage = ({ dictionary, locale, id, promotion: initialPromotion, error: initialError = null }: Props) => {
  const router = useRouter()
  const { data: session } = useSession()
  const sessiontoken = session?.user?.token as string | undefined
  const workingProjectId = useWorkingProjectId()
  const permission = usePermission({ href: '/promotion-management' })
  const [isDeleting, setIsDeleting] = useState(false)
  const isDeletingRef = useRef(false)
  const { promotion, error, loading } = usePromotionDetail({
    dictionary,
    sessiontoken,
    language: locale,
    id,
    initialPromotion,
    initialError
  })

  const lifecycle = promotion ? getPromotionLifecycleStatus(promotion.valid_from, promotion.valid_to) : 'unknown'
  // `id` is the promotion id from the path; project_id comes from the record or the working project.
  const projectId = promotion?.project_id ?? workingProjectId ?? null
  const listHref = getPromotionListHref(locale, projectId)

  const handleDeleteConfirm = async () => {
    if (!promotion || !sessiontoken || isDeletingRef.current) return

    isDeletingRef.current = true
    setIsDeleting(true)
    try {
      await promotionService.deletePromotion({ sessiontoken, language: locale as any, id: promotion.id })

      SwalAlert('success', promotionText(dictionary, 'delete_success', 'Promotion deleted successfully.'), 'center', false, false, true, () => {
        router.push(listHref)
        router.refresh()
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : promotionText(dictionary, 'delete_error', 'Unable to delete promotion.')
      const executionId = err instanceof Error && 'execution_id' in err ? String((err as any).execution_id || '') : ''

      SwalAlert('error', executionId ? `ExecutionId: ${executionId}: ${message}` : message, 'center')
    } finally {
      isDeletingRef.current = false
      setIsDeleting(false)
    }
  }

  const handleDeleteClick = () => {
    if (!permission.canDelete) {
      SwalAlert('warning', dictionary['common'].nopermissionview, 'center')

      return
    }

    const confirmMessage = [
      promotionText(dictionary, 'delete_confirm_title', 'Delete Promotion?'),
      promotionText(dictionary, 'delete_confirm_message', 'This promotion will be permanently deleted and will no longer be displayed to residents.'),
      promotion?.title ? `${promotionText(dictionary, 'delete_confirm_item_label', 'Promotion')}: ${promotion.title}` : undefined
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
      promotionText(dictionary, 'delete_button', 'Delete Promotion'),
      { cancelButtonText: commonText(dictionary, 'cancel', 'Cancel') }
    )
  }

  return (
    <ContentWrapper
      title={promotionText(dictionary, 'detail_page_title', 'Promotion Detail')}
      description={promotionText(dictionary, 'detail_page_subtitle', 'View promotion information.')}
      icon={<LocalOfferOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
        <Stack spacing={3} sx={{ mt: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
            <Button component={Link} href={listHref} variant="outlined" startIcon={<ArrowBackIcon />}>
              {commonText(dictionary, 'back', 'Back')}
            </Button>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="flex-end"
              gap={1}
              sx={{ minHeight: 36 }}
              aria-label={promotionText(dictionary, 'detail_action_area_label', 'Promotion actions')}
            >
              {promotion && promotion.id !== null && (
                <>
                  <PermissionGuard href="/promotion-management" action="MODIFY">
                    <Button
                      component={Link}
                      href={getPromotionEditHref(locale, promotion.id, projectId)}
                      variant="contained"
                      startIcon={<EditOutlinedIcon />}
                      disabled={isDeleting}
                    >
                      {promotionText(dictionary, 'edit_button', 'Edit')}
                    </Button>
                  </PermissionGuard>
                  <PermissionGuard href="/promotion-management" action="DELETE">
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<DeleteOutlineIcon />}
                      onClick={handleDeleteClick}
                      disabled={isDeleting}
                    >
                      {isDeleting ? promotionText(dictionary, 'delete_button_loading', 'Deleting...') : promotionText(dictionary, 'delete_button', 'Delete Promotion')}
                    </Button>
                  </PermissionGuard>
                </>
              )}
            </Stack>
          </Stack>

          {error && (
            <WorkflowErrorAlert
              title={promotionText(dictionary, 'detail_error_title', 'Unable to load promotion detail')}
              description={error.message}
              executionId={error.executionId}
              referenceLabel={promotionText(dictionary, 'error_reference_label', 'Error Reference')}
              copyLabel={commonText(dictionary, 'copy', 'Copy')}
              copySuccessMessage={promotionText(dictionary, 'copy_error_reference_success', 'Copied error reference.')}
              copyFailedMessage={promotionText(dictionary, 'copy_error_reference_failed', 'Unable to copy error reference.')}
            />
          )}

          {!promotion ? (
            loading ? (
              <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                <Stack spacing={2}>
                  <Skeleton variant="rounded" width="100%" height={180} />
                  <Skeleton width="40%" height={32} />
                  <Skeleton width="60%" height={24} />
                </Stack>
              </Paper>
            ) : (
              <Alert severity={error ? 'warning' : 'info'}>
                {promotionText(dictionary, 'detail_not_found', 'Promotion detail was not found.')}
              </Alert>
            )
          ) : (
            <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
              <Stack spacing={3}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5}>
                  <PromotionHeroImage src={promotion.image_url} title={promotion.title} />

                  <Stack spacing={1} sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', overflowWrap: 'anywhere' }}>
                        {displayPromotionText(promotion.title)}
                      </Typography>
                      <Stack direction="row" spacing={0.75} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}>
                        <Chip size="small" color={getPromotionStatusColor(promotion.status)} label={getPromotionStatusLabel(dictionary, promotion.status)} />
                        {lifecycle !== 'unknown' && (
                          <Chip size="small" variant="outlined" color={getPromotionLifecycleColor(lifecycle)} label={getPromotionLifecycleLabel(dictionary, lifecycle)} />
                        )}
                      </Stack>
                    </Stack>

                    {promotion.summary && (
                      <Typography variant="body1" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                        {promotion.summary}
                      </Typography>
                    )}

                    <Stack direction="row" spacing={3} flexWrap="wrap" sx={{ mt: 1 }}>
                      <Stack spacing={0.25}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                          {promotionText(dictionary, 'field_partner_name', 'Partner')}
                        </Typography>
                        <Typography>{displayPromotionText(promotion.partner_name)}</Typography>
                      </Stack>
                      <Stack spacing={0.25}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                          {promotionText(dictionary, 'field_voucher_code', 'Voucher Code')}
                        </Typography>
                        <Typography sx={{ fontFamily: 'monospace' }}>{displayPromotionText(promotion.voucher_code)}</Typography>
                      </Stack>
                      <Stack spacing={0.25}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                          {promotionText(dictionary, 'field_valid_period', 'Valid Period')}
                        </Typography>
                        <Typography>{formatPromotionValidPeriod(promotion.valid_from, promotion.valid_to)}</Typography>
                      </Stack>
                    </Stack>

                    {promotion.external_link && (
                      <Box>
                        <Button
                          component="a"
                          href={promotion.external_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="outlined"
                          endIcon={<OpenInNewIcon />}
                          sx={{ mt: 1 }}
                        >
                          {promotionText(dictionary, 'view_partner_page', 'View partner page')}
                        </Button>
                      </Box>
                    )}
                  </Stack>
                </Stack>

                <Divider />

                <Grid container spacing={3}>
                  <DetailRow label={promotionText(dictionary, 'field_promotion_code', 'Promotion Code')}>
                    <Typography sx={{ fontFamily: 'monospace' }}>{displayPromotionText(promotion.promotion_code)}</Typography>
                  </DetailRow>
                  <DetailRow label={promotionText(dictionary, 'field_partner_name', 'Partner')}>
                    <Typography sx={{ overflowWrap: 'anywhere' }}>{displayPromotionText(promotion.partner_name)}</Typography>
                  </DetailRow>
                  <DetailRow label={promotionText(dictionary, 'field_voucher_code', 'Voucher Code')}>
                    <Typography sx={{ fontFamily: 'monospace' }}>{displayPromotionText(promotion.voucher_code)}</Typography>
                  </DetailRow>
                  <DetailRow label={promotionText(dictionary, 'field_project_id', 'Project ID')}>
                    <Typography>{displayPromotionText(promotion.project_id)}</Typography>
                  </DetailRow>
                  <DetailRow label={promotionText(dictionary, 'field_building_id', 'Building ID')}>
                    <Typography>{displayPromotionText(promotion.building_id)}</Typography>
                  </DetailRow>
                  <DetailRow label={promotionText(dictionary, 'field_display_order', 'Display Order')}>
                    <Typography sx={{ fontVariantNumeric: 'tabular-nums' }}>{displayPromotionText(promotion.display_order)}</Typography>
                  </DetailRow>
                  <DetailRow label={promotionText(dictionary, 'field_voucher_quantity', 'Voucher Quantity')}>
                    <Typography sx={{ fontVariantNumeric: 'tabular-nums' }}>{displayPromotionText(promotion.voucher_quantity)}</Typography>
                  </DetailRow>
                  <DetailRow label={promotionText(dictionary, 'field_is_web_view', 'Open as Web View')}>
                    <Typography>{getPromotionWebViewLabel(dictionary, promotion.is_web_view)}</Typography>
                  </DetailRow>
                  <DetailRow label={promotionText(dictionary, 'field_valid_from', 'Valid From')}>
                    <Typography>{displayPromotionText(promotion.valid_from)}</Typography>
                  </DetailRow>
                  <DetailRow label={promotionText(dictionary, 'field_valid_to', 'Valid To')}>
                    <Typography>{displayPromotionText(promotion.valid_to)}</Typography>
                  </DetailRow>
                  <DetailRow label={promotionText(dictionary, 'field_external_link', 'External Link')}>
                    {promotion.external_link ? (
                      <Button
                        component="a"
                        href={promotion.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        endIcon={<OpenInNewIcon />}
                        sx={{ px: 0, minWidth: 0, maxWidth: '100%', justifyContent: 'flex-start', textTransform: 'none' }}
                      >
                        <Typography component="span" sx={{ overflowWrap: 'anywhere', textAlign: 'left' }}>
                          {promotion.external_link}
                        </Typography>
                      </Button>
                    ) : (
                      <Typography>-</Typography>
                    )}
                  </DetailRow>
                  <DetailRow label={promotionText(dictionary, 'field_status', 'Status')}>
                    <Chip size="small" color={getPromotionStatusColor(promotion.status)} label={getPromotionStatusLabel(dictionary, promotion.status)} />
                  </DetailRow>
                </Grid>

                {promotion.qr_code_url && (
                  <>
                    <Divider />
                    <Stack spacing={1.5}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {promotionText(dictionary, 'field_qr_code', 'QR Code')}
                      </Typography>
                      <PromotionQrCode src={promotion.qr_code_url} />
                    </Stack>
                  </>
                )}

                {promotion.content && (
                  <>
                    <Divider />
                    <Stack spacing={1}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {promotionText(dictionary, 'section_content', 'Promotion Content')}
                      </Typography>
                      <Typography sx={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{promotion.content}</Typography>
                    </Stack>
                  </>
                )}

                {promotion.terms && (
                  <>
                    <Divider />
                    <Stack spacing={1}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {promotionText(dictionary, 'section_terms', 'Terms & Conditions')}
                      </Typography>
                      <Typography color="text.secondary" sx={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{promotion.terms}</Typography>
                    </Stack>
                  </>
                )}
              </Stack>
            </Paper>
          )}
        </Stack>
      </RequireWorkingProject>
    </ContentWrapper>
  )
}

export default PromotionDetailPage
