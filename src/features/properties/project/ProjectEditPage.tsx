'use client'

import type { ReactNode } from 'react'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CancelIcon from '@mui/icons-material/Cancel'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import { Alert, Button, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { useSession } from 'next-auth/react'

import type { Locale } from '@/configs/i18n'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import type { ProvinceLookupItem } from '@/shared/services/provinceLookupService'
import type { getDictionary } from '@/shared/utils/getDictionary'
import { useRouter } from '@shared/hooks/useRouter'

import type { ProjectDetailModel, PropertyStatus } from '../types'
import ProjectBankAccountsEditSection from './bank/ProjectBankAccountsEditSection'
import type { VietQrBank } from './bank/vietqr'
import { useProjectEditForm } from './hooks/useProjectEditForm'
import ProjectLogoUpload from './logo/ProjectLogoUpload'
import { projectProvinceSelectMessages, type ProjectAccessScope } from './projectListHelpers'
import ProvinceSelect from './province/ProvinceSelect'
import { toProjectProvinceValue } from './province/projectProvinceValue'

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

const text = (dictionary: Dictionary, key: string, fallback: string) => dictionary.projectManagement?.[key] ?? dictionary.propertyManagement?.[key] ?? fallback
const common = (dictionary: Dictionary, key: string, fallback: string) => dictionary.common?.[key] ?? fallback

const FormSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main', mb: 2 }}>{title}</Typography>
    <Grid container spacing={2.5}>{children}</Grid>
  </Paper>
)

type FormProps = {
  dictionary: Dictionary
  locale: Locale
  project: ProjectDetailModel
  initialProvince: ProvinceLookupItem | null
  detailHref: string
  breadcrumb: string
  vietQrBanks: VietQrBank[]
  vietQrBanksError: string | null
  vietQrGenerateAvailable: boolean
}

const ProjectEditForm = ({ dictionary, locale, project, initialProvince, detailHref, breadcrumb, vietQrBanks, vietQrBanksError, vietQrGenerateAvailable }: FormProps) => {
  const { data: session } = useSession()
  const sessiontoken = session?.user?.token ?? undefined
  const form = useProjectEditForm({ dictionary, locale, sessiontoken, project, initialProvince, detailHref, vietQrBanks, vietQrGenerateAvailable })
  const { values, errors } = form

  const provinceHelperText = errors.province
    ?? (form.provinceUnresolved
      ? text(dictionary, 'provinceUnresolved', 'The saved Province/City "{value}" was not found in the list. Please select it again.').replace('{value}', form.storedProvince)
      : undefined)

  return (
    <Stack spacing={3} sx={{ mt: 3 }}>
      <Typography variant="caption" color="text.secondary">{breadcrumb}</Typography>

      {form.submitError && <Alert severity="error">{form.submitError}</Alert>}
      {form.submitWarning && <Alert severity="warning">{form.submitWarning}</Alert>}

      <FormSection title={text(dictionary, 'projectInfoSection', 'Project information')}>
        <Grid size={{ xs: 12 }}>
          <ProjectLogoUpload
            dictionary={dictionary}
            imageUrl={form.logo.previewUrl || form.currentLogoUrl.trim() || null}
            hasSelectedFile={Boolean(form.logo.file)}
            error={form.logo.error}
            disabled={form.saving}
            onSelect={form.logo.select}
            onRemove={form.logo.clear}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            required
            label={text(dictionary, 'projectName', 'Project Name')}
            value={values.name}
            error={Boolean(errors.name)}
            helperText={errors.name}
            disabled={form.saving}
            onChange={event => form.updateValue('name', event.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            required
            label={text(dictionary, 'projectCode', 'Project Code')}
            value={values.project_code}
            error={Boolean(errors.project_code)}
            helperText={errors.project_code}
            disabled={form.saving}
            onChange={event => form.updateValue('project_code', event.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label={text(dictionary, 'investor', 'Investor')}
            value={values.investor}
            disabled={form.saving}
            onChange={event => form.updateValue('investor', event.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          {/* value = province_code, label = province name; the saved row is resolved server-side (no fallback). */}
          <ProvinceSelect
            size="medium"
            showAllOption={false}
            label={text(dictionary, 'province', 'Province/City')}
            value={values.province}
            knownOption={initialProvince}
            getOptionValue={toProjectProvinceValue}
            error={Boolean(errors.province) || form.provinceUnresolved}
            helperText={provinceHelperText}
            disabled={form.saving}
            onChange={value => form.updateValue('province', value)}
            sessiontoken={sessiontoken}
            locale={locale}
            messages={projectProvinceSelectMessages(dictionary)}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label={text(dictionary, 'address', 'Address')}
            value={values.address}
            disabled={form.saving}
            onChange={event => form.updateValue('address', event.target.value)}
          />
        </Grid>
      </FormSection>

      <FormSection title={text(dictionary, 'projectAdditionalSection', 'Additional information')}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            type="date"
            label={text(dictionary, 'handoverDate', 'Handover date')}
            value={values.handover_date}
            disabled={form.saving}
            onChange={event => form.updateValue('handover_date', event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            select
            label={common(dictionary, 'status', 'Status')}
            value={values.status}
            disabled={form.saving}
            onChange={event => form.updateValue('status', event.target.value as PropertyStatus)}
          >
            <MenuItem value="active">{text(dictionary, 'statusProjectActive', 'Active')}</MenuItem>
            <MenuItem value="inactive">{text(dictionary, 'statusProjectInactive', 'Inactive')}</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label={common(dictionary, 'description', 'Description')}
            value={values.description}
            disabled={form.saving}
            onChange={event => form.updateValue('description', event.target.value)}
          />
        </Grid>
      </FormSection>

      {/* Project bank accounts, saved with WF_BO_UPDATE_PROJECT (not the payment gateway / PaymentConfig). */}
      <ProjectBankAccountsEditSection
        dictionary={dictionary}
        accounts={form.bank.accounts}
        values={form.bank.values}
        errors={form.bank.errors}
        banks={vietQrBanks}
        banksError={vietQrBanksError}
        qr={form.bank.qr}
        disabled={form.saving}
        onChange={form.bank.updateValue}
      />

      <Stack direction="row" justifyContent="flex-end" gap={1}>
        <Button variant="outlined" startIcon={<CancelIcon fontSize="small" />} disabled={form.saving} onClick={form.backToDetail}>
          {common(dictionary, 'cancel', 'Cancel')}
        </Button>
        <Button variant="contained" startIcon={<SaveOutlinedIcon fontSize="small" />} disabled={form.saving} onClick={() => void form.submit()}>
          {form.saving
            ? (form.savingLabel ?? common(dictionary, 'processing', 'Processing...'))
            : text(dictionary, 'saveChanges', 'Save changes')}
        </Button>
      </Stack>
    </Stack>
  )
}

type Props = {
  dictionary: Dictionary
  locale: Locale
  projectId: number
  initialProject: ProjectDetailModel | null
  initialProvince: ProvinceLookupItem | null
  initialError?: string | null
  /** VietQR bank list loaded by the server route ([] + error when unavailable). */
  vietQrBanks?: VietQrBank[]
  vietQrBanksError?: string | null
  /** The server has VietQR Generate API credentials (Base64 QR stored in MinIO); else Quick Link URLs. */
  vietQrGenerateAvailable?: boolean
  /** Project area (without locale): business `/properties/project` or System Settings `/system-settings/projects`. */
  listHref: string
  accessScope: ProjectAccessScope
}

/** Dedicated Edit Project page (`.../:id/edit`); data is loaded by the server route. */
const ProjectEditPage = ({ dictionary, locale, projectId, initialProject, initialProvince, initialError, vietQrBanks = [], vietQrBanksError = null, vietQrGenerateAvailable = false, listHref, accessScope }: Props) => {
  const router = useRouter()
  const detailHref = `${listHref}/${projectId}`
  const breadcrumb = accessScope === 'admin'
    ? text(dictionary, 'editProjectBreadcrumbAdmin', 'System Settings / Project Management / Project detail / Edit project')
    : text(dictionary, 'editProjectBreadcrumb', 'Properties / Project / Project detail / Edit project')

  return (
    <ContentWrapper
      title={text(dictionary, 'editProjectPageTitle', 'Edit project')}
      description={text(dictionary, 'editProjectSubtitle', 'Update the project information and configuration.')}
      icon={<EditOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
    >
      {initialError || !initialProject ? (
        <Stack spacing={2} sx={{ mt: 3, alignItems: 'flex-start' }}>
          <Alert severity="error" sx={{ width: '100%' }}>{initialError || text(dictionary, 'projectNotFound', 'Project not found.')}</Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push(`/${locale}${projectId > 0 ? detailHref : listHref}`)}
          >
            {projectId > 0
              ? text(dictionary, 'backToProjectDetail', 'Back to project detail')
              : text(dictionary, 'backToProjectList', 'Back to list')}
          </Button>
        </Stack>
      ) : (
        <ProjectEditForm
          dictionary={dictionary}
          locale={locale}
          project={initialProject}
          initialProvince={initialProvince}
          detailHref={detailHref}
          breadcrumb={breadcrumb}
          vietQrBanks={vietQrBanks}
          vietQrBanksError={vietQrBanksError}
          vietQrGenerateAvailable={vietQrGenerateAvailable}
        />
      )}
    </ContentWrapper>
  )
}

export default ProjectEditPage
