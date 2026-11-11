'use client'

import { useState } from 'react'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CollectionsOutlinedIcon from '@mui/icons-material/CollectionsOutlined'
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import LinkIcon from '@mui/icons-material/Link'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Alert, Box, Button, Chip, Divider, Grid, Paper, Skeleton, Stack, Typography } from '@mui/material'
import Link from 'next/link'
import { useRouter } from '@shared/hooks/useRouter'
import { useSession } from 'next-auth/react'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import SwalAlert from '@/shared/utils/SwalAlert'
import { PermissionGuard } from '@shared/permissions/PermissionGuard'
import { usePermission } from '@shared/permissions/usePermission'
import { bannerService } from './service'

import {
  bannerText,
  commonText,
  displayBannerText,
  formatBannerEffectiveTime,
  formatBannerProject,
  getBannerActionTypeLabel,
  getBannerStatusColor,
  getBannerStatusLabel,
  getBannerTypeLabel
} from './components/bannerHelpers'
import type { BannerDictionary, BannerItem } from './types'

type Props = {
  dictionary: BannerDictionary
  locale: string
  banner: BannerItem | null
  error?: { message: string; executionId?: string } | null
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

const BannerHeroImage = ({ src, title }: { src: string; title: string }) => {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const showImage = src && !failed

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: { xs: '16 / 9', md: '21 / 9' },
        borderRadius: 2,
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
        bgcolor: 'action.hover',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {showImage && !loaded && (
        <Skeleton variant="rectangular" width="100%" height="100%" sx={{ position: 'absolute', inset: 0 }} />
      )}

      {showImage ? (
        <Box
          component="img"
          src={src}
          alt={title || 'banner'}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: loaded ? 'block' : 'none',
            bgcolor: 'background.default'
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

const BannerDetailPage = ({ dictionary, locale, banner, error = null }: Props) => {
  const router = useRouter()
  const { data: session } = useSession()
  const projectLink = banner?.project_id ? `/${locale}/properties/project/${banner.project_id}` : null
  const [isDeleting, setIsDeleting] = useState(false)
  const permission = usePermission({ href: '/banner-list' })

  const handleDeleteConfirm = async () => {
    if (!banner?.id || !session?.user?.token) return

    setIsDeleting(true)
    try {
      const result = await bannerService.deleteBanner({
        sessiontoken: session.user.token,
        language: locale as any,
        id: Number(banner.id)
      })

      if (result.status === 'D') {
        SwalAlert('success', bannerText(dictionary, 'delete_success', 'Banner deleted successfully.'), 'center', false, false, true, () => {
          router.push(`/${locale}/banner-list`)
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : bannerText(dictionary, 'delete_error', 'Unable to delete banner.')
      const executionId = err instanceof Error && 'execution_id' in err ? (err as any).execution_id : undefined

      SwalAlert('error', executionId ? `ExecutionId: ${executionId}: ${message}` : message, 'center')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteClick = () => {
    if (!permission.canDelete) {
      SwalAlert('warning', dictionary['common'].nopermissionview, 'center')

      return
    }

    const confirmMessage = [
      bannerText(dictionary, 'delete_confirm_title', 'Delete Banner?'),
      bannerText(dictionary, 'delete_confirm_message', 'This banner will be permanently deleted and will no longer be displayed anywhere in the system.'),
      banner?.title ? `${bannerText(dictionary, 'delete_confirm_item_label', 'Banner')}: ${banner.title}` : undefined
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
      bannerText(dictionary, 'delete_button', 'Delete Banner')
    )
  }

  return (
    <ContentWrapper
      title={bannerText(dictionary, 'detail_page_title', 'Banner Detail')}
      description={bannerText(dictionary, 'detail_page_subtitle', 'View banner information.')}
      icon={<CollectionsOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <Stack spacing={3} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Button component={Link} href={`/${locale}/banner-list`} variant="outlined" startIcon={<ArrowBackIcon />}>
            {commonText(dictionary, 'back', 'Back')}
          </Button>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="flex-end"
            gap={1}
            sx={{ minHeight: 36 }}
            aria-label={bannerText(dictionary, 'detail_action_area_label', 'Banner actions')}
          >
            {banner && (
              <>
                <PermissionGuard href="/banner-list" action="MODIFY">
                  <Button
                    component={Link}
                    href={`/${locale}/banner-list/${banner.id}/edit`}
                    variant="contained"
                    startIcon={<EditOutlinedIcon />}
                  >
                    {bannerText(dictionary, 'edit_button', 'Edit')}
                  </Button>
                </PermissionGuard>
                <PermissionGuard href="/banner-list" action="DELETE">
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteOutlineIcon />}
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                  >
                    {isDeleting ? bannerText(dictionary, 'delete_button_loading', 'Deleting...') : bannerText(dictionary, 'delete_button', 'Delete Banner')}
                  </Button>
                </PermissionGuard>
              </>
            )}
          </Stack>
        </Stack>

        {error && (
          <WorkflowErrorAlert
            title={bannerText(dictionary, 'detail_error_title', 'Unable to load banner detail')}
            description={error.message}
            executionId={error.executionId}
            referenceLabel={bannerText(dictionary, 'error_reference_label', 'Error Reference')}
            copyLabel={commonText(dictionary, 'copy', 'Copy')}
            copySuccessMessage={bannerText(dictionary, 'copy_error_reference_success', 'Copied error reference.')}
            copyFailedMessage={bannerText(dictionary, 'copy_error_reference_failed', 'Unable to copy error reference.')}
          />
        )}

        {!banner ? (
          <Alert severity={error ? 'warning' : 'info'}>
            {bannerText(dictionary, 'detail_not_found', 'Banner detail was not found.')}
          </Alert>
        ) : (
          <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                <Stack spacing={0.75} sx={{ minWidth: 0 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', overflowWrap: 'anywhere' }}>
                    {displayBannerText(banner.title)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                    {formatBannerProject(banner)}
                  </Typography>
                </Stack>
                <Chip
                  size="small"
                  color={getBannerStatusColor(banner.status)}
                  label={getBannerStatusLabel(dictionary, banner.status)}
                  sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}
                />
              </Stack>

              <BannerHeroImage src={banner.image_url} title={banner.title} />

              <Divider />

              <Grid container spacing={3}>
                <DetailRow label={bannerText(dictionary, 'field_title', 'Title')}>
                  <Typography sx={{ overflowWrap: 'anywhere' }}>{displayBannerText(banner.title)}</Typography>
                </DetailRow>
                <DetailRow label={bannerText(dictionary, 'field_project', 'Project')}>
                  {projectLink ? (
                    <Button
                      component={Link}
                      href={projectLink}
                      variant="text"
                      size="small"
                      endIcon={<LinkIcon />}
                      sx={{
                        px: 0,
                        minWidth: 0,
                        maxWidth: '100%',
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        textDecoration: 'underline',
                        color: 'primary.main',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      <Typography component="span" sx={{ overflowWrap: 'anywhere', textAlign: 'left' }}>
                        {formatBannerProject(banner)}
                      </Typography>
                    </Button>
                  ) : (
                    <Typography>{formatBannerProject(banner)}</Typography>
                  )}
                </DetailRow>
                <DetailRow label={bannerText(dictionary, 'field_banner_type', 'Banner Type')}>
                  <Chip size="small" variant="outlined" label={getBannerTypeLabel(dictionary, banner.banner_type)} />
                </DetailRow>
                <DetailRow label={bannerText(dictionary, 'field_action_type', 'Action Type')}>
                  <Chip size="small" variant="outlined" label={getBannerActionTypeLabel(dictionary, banner.action_type)} />
                </DetailRow>
                <DetailRow label={bannerText(dictionary, 'field_link_url', 'Link')}>
                  {banner.link_url ? (
                    <Button
                      component="a"
                      href={banner.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      endIcon={<OpenInNewIcon />}
                      sx={{ px: 0, minWidth: 0, maxWidth: '100%', justifyContent: 'flex-start', textTransform: 'none' }}
                    >
                      <Typography component="span" sx={{ overflowWrap: 'anywhere', textAlign: 'left' }}>
                        {banner.link_url}
                      </Typography>
                    </Button>
                  ) : (
                    <Typography>-</Typography>
                  )}
                </DetailRow>
                <DetailRow label={bannerText(dictionary, 'field_effective_time', 'Effective Time')}>
                  <Typography>{formatBannerEffectiveTime(banner.effective_from, banner.effective_to)}</Typography>
                </DetailRow>
                <DetailRow label={bannerText(dictionary, 'field_display_order', 'Display Order')}>
                  <Typography sx={{ fontVariantNumeric: 'tabular-nums' }}>{displayBannerText(banner.display_order)}</Typography>
                </DetailRow>
                <DetailRow label={bannerText(dictionary, 'field_status', 'Status')}>
                  <Chip size="small" color={getBannerStatusColor(banner.status)} label={getBannerStatusLabel(dictionary, banner.status)} />
                </DetailRow>
              </Grid>
            </Stack>
          </Paper>
        )}
      </Stack>
    </ContentWrapper>
  )
}

export default BannerDetailPage
