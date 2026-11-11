'use client'

import { useEffect, useRef, useState } from 'react'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CancelIcon from '@mui/icons-material/Cancel'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import SaveIcon from '@mui/icons-material/Save'
import { Alert, Box, Button, CircularProgress, Divider, Grid, Paper, Skeleton, Stack, TextField, Typography } from '@mui/material'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

import SelectFormField from '@/@core/components/form-field/SelectFormField'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import PartnerLookup from '@/shared/components/partner-lookup/PartnerLookup'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import SwalAlert from '@/shared/utils/SwalAlert'
import { useRouter } from '@shared/hooks/useRouter'
import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'

import {
  commonText,
  getPromotionDetailHref,
  getPromotionListHref,
  getPromotionStatusLabel,
  promotionText,
  toPromotionDateInput
} from './components/promotionHelpers'
import { usePromotionDetail } from './hooks/usePromotionDetail'
import { promotionImageUploadService, validatePromotionImageFile } from './promotionImageUploadService'
import { promotionService } from './service'
import type { PromotionCreateFormValues, PromotionDictionary, PromotionItem, PromotionWorkflowError } from './types'
import type { PartnerItem } from '@/features/partners/types'

type Props = {
  dictionary: PromotionDictionary
  locale: string
  /** Edit mode only: the promotion id from the route path (never the project_id query param). */
  id?: number | string
  promotion?: PromotionItem | null
  error?: PromotionWorkflowError | null
}

const initialForm: PromotionCreateFormValues = {
  promotion_code: '', title: '', summary: '', content: '', image_url: '', partner_name: '', voucher_code: '',
  qr_code_url: '', external_link: '', valid_from: '', valid_to: '', terms: '', display_order: 1,
  status: 'A', voucher_quantity: '', is_web_view: ''
}

const PROMOTION_STATUS_OPTIONS = ['A', 'I', 'DRAFT']

const toFormValues = (promotion: PromotionItem): PromotionCreateFormValues => ({
  promotion_code: promotion.promotion_code, title: promotion.title, summary: promotion.summary, content: promotion.content,
  image_url: promotion.image_url, partner_name: promotion.partner_name, voucher_code: promotion.voucher_code ?? '',
  qr_code_url: promotion.qr_code_url ?? '', external_link: promotion.external_link ?? '',
  valid_from: toPromotionDateInput(promotion.valid_from), valid_to: toPromotionDateInput(promotion.valid_to),
  terms: promotion.terms, display_order: promotion.display_order ?? '', status: promotion.status,
  voucher_quantity: promotion.voucher_quantity === null ? '' : String(promotion.voucher_quantity),
  is_web_view: promotion.is_web_view === null ? '' : promotion.is_web_view ? 'true' : 'false'
})

/** Create and edit share this form; edit mode is enabled by passing the promotion `id`. */
const PromotionCreatePage = ({ dictionary, locale, id, promotion: initialPromotion = null, error: initialError = null }: Props) => {
  const editId = id ?? ''
  const isEdit = editId !== ''
  const router = useRouter()
  const { data: session } = useSession()
  const sessiontoken = session?.user?.token ?? undefined
  const workingProject = useWorkingProject()
  const { promotion, error: loadError, loading } = usePromotionDetail({
    dictionary,
    sessiontoken,
    language: locale,
    id: editId,
    initialPromotion,
    initialError
  })
  const [form, setForm] = useState<PromotionCreateFormValues>(() => initialPromotion ? toFormValues(initialPromotion) : initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof PromotionCreateFormValues, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [selectedPartner, setSelectedPartner] = useState<PartnerItem | null>(null)
  const isPopulatedRef = useRef(Boolean(initialPromotion))
  const isSubmittingRef = useRef(false)
  const text = (key: string, fallback: string) => promotionText(dictionary, key, fallback)
  const projectId = (isEdit ? promotion?.project_id : null) ?? workingProject?.id ?? null
  const listHref = getPromotionListHref(locale, projectId)
  const backHref = isEdit ? getPromotionDetailHref(locale, editId, projectId) : listHref

  // The detail hook may resolve the promotion client-side; populate the form once when it arrives.
  useEffect(() => {
    if (!promotion || isPopulatedRef.current) return
    isPopulatedRef.current = true
    setForm(toFormValues(promotion))
  }, [promotion])

  const statusOptions = [...PROMOTION_STATUS_OPTIONS, ...(form.status && !PROMOTION_STATUS_OPTIONS.includes(form.status) ? [form.status] : [])]
    .map(status => ({ value: status, label: getPromotionStatusLabel(dictionary, status) }))
  const webViewOptions = [
    { value: '', label: '-' },
    { value: 'true', label: text('boolean_yes', 'Yes') },
    { value: 'false', label: text('boolean_no', 'No') }
  ]

  const handleInputChange = (key: keyof PromotionCreateFormValues, value: string | number) => {
    setForm(current => ({ ...current, [key]: value }))
    setErrors(current => ({ ...current, [key]: undefined }))
  }

  const validateForm = () => {
    const nextErrors: typeof errors = {}
    const requiredFields: Array<[keyof PromotionCreateFormValues, string]> = [
      ...(isEdit ? [] : [['promotion_code', 'validation_promotion_code_required'] as [keyof PromotionCreateFormValues, string]]),
      ['title', 'validation_title_required'],
      ['summary', 'validation_summary_required'], ['content', 'validation_content_required'],
      ['terms', 'validation_terms_required'],
      ['valid_from', 'validation_valid_from_required'], ['valid_to', 'validation_valid_to_required'],
      ['image_url', 'validation_image_required']
    ]
    requiredFields.forEach(([field, key]) => {
      if (!String(form[field] ?? '').trim()) nextErrors[field] = text(key, 'This field is required.')
    })
    if (!form.partner_name.trim()) {
      nextErrors.partner_name = text('validation_partner_name_required', 'Please select a partner.')
    }
    if (form.display_order === '' || !Number.isFinite(Number(form.display_order)) || Number(form.display_order) < 0) {
      nextErrors.display_order = text('validation_display_order_required', 'Display order must be zero or greater.')
    }
    if (form.valid_from && form.valid_to && form.valid_to < form.valid_from) {
      nextErrors.valid_to = text('validation_valid_to_after_from', 'End date must be on or after start date.')
    }
    if (isEdit && !form.status) {
      nextErrors.status = text('validation_status_required', 'Status is required.')
    }
    if (isEdit && form.voucher_quantity.trim() !== '' && (!Number.isInteger(Number(form.voucher_quantity)) || Number(form.voucher_quantity) < 0)) {
      nextErrors.voucher_quantity = text('validation_voucher_quantity_invalid', 'Voucher quantity must be a whole number of zero or greater.')
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleImageSelect = async (file?: File) => {
    if (!file || !projectId || isUploading) return
    if (!validatePromotionImageFile(file)) {
      setUploadError(text('upload_invalid_file', 'Choose a PNG, JPG, JPEG, or WEBP image up to 5MB.'))
      return
    }
    setUploadError('')
    setIsUploading(true)
    try {
      handleInputChange('image_url', await promotionImageUploadService.upload(file, projectId))
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : text('upload_failed', 'Unable to upload image.'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (isSubmittingRef.current || isUploading || !sessiontoken || !validateForm()) return
    if (isEdit ? !promotion : !workingProject) return
    isSubmittingRef.current = true
    setIsSubmitting(true)
    try {
      if (isEdit && promotion) {
        await promotionService.updatePromotion({
          sessiontoken,
          language: locale as any,
          data: {
            id: Number(promotion.id), title: form.title.trim(), summary: form.summary.trim(), content: form.content.trim(),
            display_order: Number(form.display_order), terms: form.terms.trim(), partner_name: form.partner_name,
            valid_from: form.valid_from, valid_to: form.valid_to, status: form.status, external_link: form.external_link.trim(),
            voucher_quantity: form.voucher_quantity.trim() === '' ? '' : Number(form.voucher_quantity),
            is_web_view: form.is_web_view === '' ? '' : form.is_web_view === 'true',
            image_url: form.image_url, qr_code_url: form.qr_code_url.trim(), voucher_code: form.voucher_code.trim()
          }
        })
        SwalAlert('success', text('update_success', 'Promotion updated successfully.'), 'center', false, false, true, () => {
          router.push(getPromotionDetailHref(locale, editId, projectId))
          router.refresh()
        })
      } else if (workingProject) {
        await promotionService.createPromotion({
          sessiontoken,
          language: locale as any,
          data: {
            display_order: Number(form.display_order), project_id: workingProject.id, terms: form.terms.trim(),
            partner_name: form.partner_name, valid_from: form.valid_from, valid_to: form.valid_to,
            external_link: form.external_link.trim(), image_url: form.image_url, summary: form.summary.trim(),
            title: form.title.trim(), promotion_code: form.promotion_code.trim(), qr_code_url: form.qr_code_url.trim(),
            voucher_code: form.voucher_code.trim(), content: form.content.trim()
          }
        })
        SwalAlert('success', text('create_success', 'Promotion created successfully.'), 'center', false, false, true, () => {
          router.push(getPromotionListHref(locale, workingProject.id))
          router.refresh()
        })
      }
    } catch (error) {
      const executionId = error instanceof Error && 'executionId' in error ? String((error as any).executionId || '') : ''
      const fallback = isEdit ? text('update_error', 'Unable to update promotion.') : text('create_error', 'Unable to create promotion.')
      const message = error instanceof Error ? error.message : fallback
      SwalAlert('error', executionId ? `${message}\n${text('error_reference_label', 'Error Reference')}: ${executionId}` : message, 'center')
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  const field = (key: keyof PromotionCreateFormValues, labelKey: string, fallback: string, props: any = {}) => (
    <TextField fullWidth required={props.required} label={text(labelKey, fallback)} value={form[key]} onChange={e => handleInputChange(key, e.target.value)} error={Boolean(errors[key])} helperText={errors[key]} {...props} />
  )

  const selectField = (key: 'status' | 'is_web_view', labelKey: string, fallback: string, options: { value: string; label: string }[], required = false) => (
    <>
      <SelectFormField
        field={{ value: form[key], onChange: (value: any) => handleInputChange(key, typeof value === 'string' ? value : value.target.value), onBlur: () => undefined, name: key }}
        required={required}
        label={text(labelKey, fallback)}
        error={Boolean(errors[key])}
        disabled={isSubmitting}
        options={options}
      />
      {errors[key] && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5, mx: 1.75 }}>{errors[key]}</Typography>}
    </>
  )

  const isBusy = isSubmitting || isUploading
  const isFormReady = !isEdit || Boolean(promotion)

  return <ContentWrapper title={isEdit ? text('edit_page_title', 'Edit Promotion') : text('create_page_title', 'Create Promotion')} description={isEdit ? text('edit_page_subtitle', 'Update promotion information.') : text('create_page_subtitle', 'Create a new promotion.')} icon={<LocalOfferOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />} dictionary={dictionary} issearch>
    <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
      <Stack spacing={3} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Button component={Link} href={backHref} variant="outlined" startIcon={<ArrowBackIcon />}>{commonText(dictionary, 'back', 'Back')}</Button>
          {isFormReady && <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" gap={1}>
            <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => router.push(backHref)} disabled={isBusy}>{commonText(dictionary, 'cancel', 'Cancel')}</Button>
            <Button variant="contained" startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />} onClick={handleSubmit} disabled={isBusy}>
              {isEdit
                ? (isSubmitting ? text('update_button_loading', 'Saving...') : text('update_submit_button', 'Save changes'))
                : (isSubmitting ? text('create_button_loading', 'Creating...') : text('create_submit_button', 'Create Promotion'))}
            </Button>
          </Stack>}
        </Stack>
        <Typography variant="body2" color="text.secondary">{isEdit ? text('breadcrumb_edit', 'Promotion list / Edit') : text('breadcrumb_create', 'Promotion list / Create new')}</Typography>
        {isEdit && loadError && (
          <WorkflowErrorAlert
            title={text('detail_error_title', 'Unable to load promotion detail')}
            description={loadError.message}
            executionId={loadError.executionId}
            referenceLabel={text('error_reference_label', 'Error Reference')}
            copyLabel={commonText(dictionary, 'copy', 'Copy')}
            copySuccessMessage={text('copy_error_reference_success', 'Copied error reference.')}
            copyFailedMessage={text('copy_error_reference_failed', 'Unable to copy error reference.')}
          />
        )}
        {!isFormReady ? (
          loading ? (
            <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}><Stack spacing={2}><Skeleton width="40%" height={32} /><Skeleton variant="rounded" width="100%" height={56} /><Skeleton variant="rounded" width="100%" height={120} /></Stack></Paper>
          ) : (
            <Alert severity={loadError ? 'warning' : 'info'}>{text('detail_not_found', 'Promotion detail was not found.')}</Alert>
          )
        ) : <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}><Stack spacing={3}>
          <Stack spacing={0.5}><Typography variant="h6" fontWeight={700}>{text('section_program_information', 'Promotion Information')}</Typography><Typography variant="body2" color="text.secondary">{text('field_project', 'Project')}: {workingProject?.name || workingProject?.code || '-'}</Typography></Stack>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>{field('promotion_code', 'field_promotion_code', 'Promotion Code', { required: !isEdit, disabled: isEdit })}</Grid><Grid size={{ xs: 12, md: 6 }}>{field('title', 'field_title', 'Title', { required: true })}</Grid>
            {isEdit && <Grid size={{ xs: 12, md: 6 }}>{selectField('status', 'field_status', 'Status', statusOptions, true)}</Grid>}
            <Grid size={{ xs: 12 }}>{field('summary', 'field_summary', 'Summary', { required: true, multiline: true, minRows: 2 })}</Grid><Grid size={{ xs: 12 }}>{field('content', 'field_content', 'Content', { required: true, multiline: true, minRows: 4 })}</Grid><Grid size={{ xs: 12 }}>{field('terms', 'field_terms', 'Terms & Conditions', { required: true, multiline: true, minRows: 3 })}</Grid>
          </Grid>
          <Divider /><Typography variant="h6" fontWeight={700}>{text('section_partner_voucher', 'Partner / Voucher')}</Typography>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <PartnerLookup
                sessiontoken={sessiontoken}
                language={locale}
                label={text('field_partner_name', 'Partner')}
                required
                value={selectedPartner?.id ?? null}
                displayValue={form.partner_name}
                error={Boolean(errors.partner_name)}
                helperText={errors.partner_name}
                placeholder={text('partner_lookup_placeholder', 'Select partner...')}
                onChange={partner => {
                  setSelectedPartner(partner)
                  handleInputChange('partner_name', partner?.partner_name ?? '')
                }}
                messages={{
                  searchTitle: text('partner_lookup_title', 'Search partner'),
                  searchLabel: text('partner_lookup_search_label', 'Search partner'),
                  partnerCodeLabel: text('field_partner_code', 'Partner Code'),
                  searchButtonLabel: commonText(dictionary, 'search', 'Search'),
                  selectLabel: text('partner_lookup_select', 'Select partner'),
                  emptyText: text('partner_lookup_empty', 'No partners found.')
                }}
              />
              {selectedPartner && <Stack spacing={0.25} sx={{ mt: 1 }}><Typography variant="body2" fontWeight={700}>{selectedPartner.partner_name}</Typography><Typography variant="caption" color="text.secondary">{text('partner_code_display', 'Partner code')}: {selectedPartner.partner_code || '-'}</Typography></Stack>}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>{field('voucher_code', 'field_voucher_code', 'Voucher Code')}</Grid>
            {isEdit && <Grid size={{ xs: 12, md: 6 }}>{field('voucher_quantity', 'field_voucher_quantity', 'Voucher Quantity', { type: 'number', inputProps: { min: 0, step: 1 } })}</Grid>}
          </Grid>
          <Divider /><Typography variant="h6" fontWeight={700}>{text('section_validity', 'Validity')}</Typography>
          <Grid container spacing={2.5}><Grid size={{ xs: 12, md: 6 }}>{field('valid_from', 'field_valid_from', 'Valid From', { required: true, type: 'date', slotProps: { inputLabel: { shrink: true } } })}</Grid><Grid size={{ xs: 12, md: 6 }}>{field('valid_to', 'field_valid_to', 'Valid To', { required: true, type: 'date', slotProps: { inputLabel: { shrink: true } } })}</Grid></Grid>
          <Divider /><Typography variant="h6" fontWeight={700}>{text('section_display', 'Display')}</Typography>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}><Stack spacing={1.5} sx={{ p: 2, border: 1, borderColor: errors.image_url ? 'error.main' : 'divider', borderRadius: 2 }}><Typography variant="subtitle2">{text('field_image', 'Image')} *</Typography>{form.image_url && <Box component="img" src={form.image_url} alt={form.title || text('field_image', 'Image')} sx={{ width: '100%', maxWidth: 540, maxHeight: 300, objectFit: 'contain', borderRadius: 1.5, border: 1, borderColor: 'divider' }} />}<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap><Button component="label" variant="outlined" startIcon={isUploading ? <CircularProgress size={16} /> : <CloudUploadOutlinedIcon />} disabled={isBusy}>{form.image_url ? text('change_image', 'Change image') : text('upload_image', 'Upload image')}<input hidden type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={event => { void handleImageSelect(event.target.files?.[0]); event.target.value = '' }} /></Button>{form.image_url && <Button variant="outlined" color="error" startIcon={<DeleteOutlineIcon />} disabled={isBusy} onClick={() => handleInputChange('image_url', '')}>{text('remove_image', 'Remove image')}</Button>}</Stack><Typography variant="caption" color="text.secondary">{isUploading ? text('uploading_image', 'Uploading image...') : text('upload_image_helper', 'PNG, JPG, JPEG or WEBP. Maximum 5MB.')}</Typography>{(uploadError || errors.image_url) && <Alert severity="error">{uploadError || errors.image_url}</Alert>}</Stack></Grid>
            <Grid size={{ xs: 12, md: 4 }}>{field('display_order', 'field_display_order', 'Display Order', { type: 'number', inputProps: { min: 0 } })}</Grid><Grid size={{ xs: 12, md: 4 }}>{field('external_link', 'field_external_link', 'External Link')}</Grid><Grid size={{ xs: 12, md: 4 }}>{field('qr_code_url', 'field_qr_code', 'QR Code URL')}</Grid>
            {isEdit && <Grid size={{ xs: 12, md: 4 }}>{selectField('is_web_view', 'field_is_web_view', 'Open as Web View', webViewOptions)}</Grid>}
          </Grid>
        </Stack></Paper>}
      </Stack>
    </RequireWorkingProject>
  </ContentWrapper>
}

export default PromotionCreatePage
