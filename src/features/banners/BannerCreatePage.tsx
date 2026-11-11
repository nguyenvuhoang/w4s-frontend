'use client'

import { useState } from 'react'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CollectionsOutlinedIcon from '@mui/icons-material/CollectionsOutlined'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import { Box, Button, Divider, Grid, Paper, Skeleton, Stack, TextField, Typography } from '@mui/material'
import Link from 'next/link'
import { useRouter } from '@shared/hooks/useRouter'
import { useSession } from 'next-auth/react'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import SelectFormField from '@/@core/components/form-field/SelectFormField'
import SwalAlert from '@/shared/utils/SwalAlert'
import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import { bannerService } from './service'

import {
  bannerText,
  commonText,
  getBannerTypeLabel
} from './components/bannerHelpers'
import type { BannerCreateFormValues, BannerDictionary } from './types'

type Props = {
  dictionary: BannerDictionary
  locale: string
}

const BannerImagePreview = ({ src, title }: { src: string; title: string }) => {
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
        <Typography variant="body2" color="text.secondary">
          -
        </Typography>
      )}
    </Box>
  )
}

const BannerCreatePage = ({ dictionary, locale }: Props) => {
  const router = useRouter()
  const { data: session } = useSession()
  const workingProject = useWorkingProject()
  const projects = workingProject ? [workingProject] : []
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState<BannerCreateFormValues>({
    project_id: workingProject?.id || '',
    title: '',
    image_url: '',
    link_url: '',
    banner_type: 'BANNER',
    valid_from: '',
    valid_to: '',
    display_order: 1
  })

  const [errors, setErrors] = useState<Partial<Record<keyof BannerCreateFormValues, string>>>({})

  const handleInputChange = (key: keyof BannerCreateFormValues, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    if (!form.project_id || Number(form.project_id) <= 0) {
      newErrors.project_id = bannerText(dictionary, 'validation_project_required', 'Project is required.')
    }

    if (!form.title.trim()) {
      newErrors.title = bannerText(dictionary, 'validation_title_required', 'Title is required.')
    }

    if (!form.image_url.trim()) {
      newErrors.image_url = bannerText(dictionary, 'validation_image_required', 'Image URL is required.')
    }

    if (!form.banner_type) {
      newErrors.banner_type = bannerText(dictionary, 'validation_banner_type_required', 'Banner type is required.')
    }

    if (form.valid_from && form.valid_to) {
      const fromDate = new Date(form.valid_from)
      const toDate = new Date(form.valid_to)
      if (toDate < fromDate) {
        newErrors.valid_to = bannerText(dictionary, 'validation_valid_to_after_from', 'End date must be after start date.')
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm() || !session?.user?.token) return

    setIsSubmitting(true)
    try {
      const result = await bannerService.createBanner({
        sessiontoken: session.user.token,
        language: locale as any,
        data: {
          project_id: Number(form.project_id),
          title: form.title.trim(),
          image_url: form.image_url.trim(),
          link_url: form.link_url.trim() || null,
          banner_type: form.banner_type,
          valid_from: form.valid_from,
          valid_to: form.valid_to,
          display_order: form.display_order ? Number(form.display_order) : null
        }
      })

      const bannerId = result.id

      SwalAlert('success', bannerText(dictionary, 'create_success', 'Banner created successfully.'), 'center', false, false, true, () => {
        if (bannerId) {
          router.push(`/${locale}/banner-list/${bannerId}`)
        } else {
          router.push(`/${locale}/banner-list`)
        }
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : bannerText(dictionary, 'create_error', 'Unable to create banner.')
      const executionId = err instanceof Error && 'execution_id' in err ? (err as any).execution_id : undefined

      SwalAlert('error', executionId ? `ExecutionId: ${executionId}: ${message}` : message, 'center')
    } finally {
      setIsSubmitting(false)
    }
  }

  const bannerTypeOptions = ['BANNER', 'CAROUSEL', 'MODAL', 'POPUP'].map(type => ({
    value: type,
    label: getBannerTypeLabel(dictionary, type)
  }))

  const projectOptions = projects.map(project => ({
    value: String(project.id),
    label: project.name || project.code || String(project.id)
  }))

  return (
    <ContentWrapper
      title={bannerText(dictionary, 'create_page_title', 'Create Banner')}
      description={bannerText(dictionary, 'create_page_subtitle', 'Create a new banner.')}
      icon={<CollectionsOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <RequireWorkingProject dictionary={dictionary} sessiontoken={session?.user?.token as string | undefined} language={locale}>
      <Stack spacing={3} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Button
            component={Link}
            href={`/${locale}/banner-list`}
            variant="outlined"
            startIcon={<ArrowBackIcon />}
          >
            {commonText(dictionary, 'back', 'Back')}
          </Button>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="flex-end"
            gap={1}
            sx={{ minHeight: 36 }}
          >
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={() => router.push(`/${locale}/banner-list`)}
              disabled={isSubmitting}
            >
              {commonText(dictionary, 'cancel', 'Cancel')}
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? bannerText(dictionary, 'create_button_loading', 'Creating...') : bannerText(dictionary, 'create_button', 'Create Banner')}
            </Button>
          </Stack>
        </Stack>

        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
          <Stack spacing={3}>
            <Stack spacing={2}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {bannerText(dictionary, 'section_preview', 'Image Preview')}
              </Typography>
              <BannerImagePreview src={form.image_url} title={form.title} />
            </Stack>

            <Divider />

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <SelectFormField
                  field={{
                    value: String(form.project_id),
                    onChange: (value: any) => handleInputChange('project_id', typeof value === 'string' ? Number(value) : value.target.value),
                    onBlur: () => undefined,
                    name: 'project_id'
                  }}
                  required
                  label={bannerText(dictionary, 'field_project', 'Project')}
                  error={Boolean(errors.project_id)}
                  options={projectOptions}
                />
                {errors.project_id && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.75 }}>
                    {errors.project_id}
                  </Typography>
                )}
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <SelectFormField
                  field={{
                    value: form.banner_type,
                    onChange: (value: any) => handleInputChange('banner_type', typeof value === 'string' ? value : value.target.value),
                    onBlur: () => undefined,
                    name: 'banner_type'
                  }}
                  required
                  label={bannerText(dictionary, 'field_banner_type', 'Banner Type')}
                  error={Boolean(errors.banner_type)}
                  options={bannerTypeOptions}
                />
                {errors.banner_type && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.75 }}>
                    {errors.banner_type}
                  </Typography>
                )}
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  label={bannerText(dictionary, 'field_title', 'Title')}
                  value={form.title}
                  onChange={e => handleInputChange('title', e.target.value)}
                  error={Boolean(errors.title)}
                  helperText={errors.title}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={bannerText(dictionary, 'field_display_order', 'Display Order')}
                  value={form.display_order}
                  onChange={e => handleInputChange('display_order', e.target.value ? Number(e.target.value) : '')}
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  required
                  label={bannerText(dictionary, 'field_image_url', 'Image URL')}
                  value={form.image_url}
                  onChange={e => handleInputChange('image_url', e.target.value)}
                  error={Boolean(errors.image_url)}
                  helperText={errors.image_url}
                  placeholder="https://example.com/image.png"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={bannerText(dictionary, 'field_link_url', 'Link URL')}
                  value={form.link_url}
                  onChange={e => handleInputChange('link_url', e.target.value)}
                  placeholder="https://example.com"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label={bannerText(dictionary, 'field_valid_from', 'Valid From')}
                  value={form.valid_from}
                  onChange={e => handleInputChange('valid_from', e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label={bannerText(dictionary, 'field_valid_to', 'Valid To')}
                  value={form.valid_to}
                  onChange={e => handleInputChange('valid_to', e.target.value)}
                  error={Boolean(errors.valid_to)}
                  helperText={errors.valid_to}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
            </Grid>
          </Stack>
        </Paper>
      </Stack>
      </RequireWorkingProject>
    </ContentWrapper>
  )
}

export default BannerCreatePage
