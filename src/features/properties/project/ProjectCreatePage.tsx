'use client'

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import ApartmentIcon from '@mui/icons-material/Apartment'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CancelIcon from '@mui/icons-material/Cancel'
import {
  Alert,
  Button,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import type { getDictionary } from '@/shared/utils/getDictionary'

import ProjectBankAccountGroups from './bank/ProjectBankAccountGroups'
import { normalizeProjectCode, useProjectCreateForm } from './hooks/useProjectCreateForm'
import ProjectLogoUpload from './logo/ProjectLogoUpload'
import { projectProvinceSelectMessages } from './projectListHelpers'
import ProvinceSelect from './province/ProvinceSelect'
import { toProjectProvinceValue } from './province/projectProvinceValue'

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

const text = (dictionary: Dictionary, key: string, fallback: string) => dictionary.projectManagement?.[key] ?? fallback
const common = (dictionary: Dictionary, key: string, fallback: string) => dictionary.common?.[key] ?? fallback

type Props = {
  dictionary: Dictionary
  locale: string
  sessiontoken?: string
  /** Project catalog area (defaults to System Settings > Project Management). */
  basePath?: string
}

const ProjectCreatePage = ({ dictionary, locale, sessiontoken, basePath }: Props) => {
  const projectForm = useProjectCreateForm({ dictionary, locale, sessiontoken, basePath })

  return (
    <ContentWrapper
      title={text(dictionary, 'addProject', 'Add Project')}
      description={text(dictionary, 'createProjectPageSubtitle', 'Fill in the information to create a new project in the system.')}
      icon={<ApartmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <Stack spacing={3} sx={{ mt: 3 }}>
        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">
            {text(dictionary, 'createProjectBreadcrumb', 'Properties / Project / Create Project')}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={projectForm.goBack}
            sx={{ alignSelf: 'flex-start' }}
          >
            {common(dictionary, 'back', 'Back')}
          </Button>
        </Stack>

        {projectForm.submitError && <Alert severity="error">{projectForm.submitError}</Alert>}

        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
          <Stack spacing={3}>
            <Stack spacing={0.5}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {text(dictionary, 'createProjectFormTitle', 'Project Information')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {text(dictionary, 'formDescription', 'Configure project identity and management information.')}
              </Typography>
            </Stack>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  label={text(dictionary, 'projectName', 'Project Name')}
                  value={projectForm.values.project_name}
                  error={Boolean(projectForm.errors.project_name)}
                  helperText={projectForm.errors.project_name}
                  disabled={projectForm.saving}
                  onChange={event => projectForm.updateValue('project_name', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  label={text(dictionary, 'projectCode', 'Project Code')}
                  value={projectForm.values.project_code}
                  error={Boolean(projectForm.errors.project_code)}
                  helperText={projectForm.errors.project_code}
                  disabled={projectForm.saving}
                  onChange={event => projectForm.updateValue('project_code', normalizeProjectCode(event.target.value))}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                {/* Shared Province master lookup; the value sent is the Project contract representation. */}
                <ProvinceSelect
                  size="medium"
                  required
                  showAllOption={false}
                  label={text(dictionary, 'province', 'Province/City')}
                  value={projectForm.values.province}
                  getOptionValue={toProjectProvinceValue}
                  error={Boolean(projectForm.errors.province)}
                  helperText={projectForm.errors.province}
                  disabled={projectForm.saving}
                  onChange={value => projectForm.updateValue('province', value)}
                  sessiontoken={sessiontoken}
                  locale={locale}
                  messages={projectProvinceSelectMessages(dictionary)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={text(dictionary, 'investor', 'Investor')}
                  value={projectForm.values.investor}
                  disabled={projectForm.saving}
                  onChange={event => projectForm.updateValue('investor', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label={text(dictionary, 'handoverDate', 'Handover date')}
                  value={projectForm.values.handover_date}
                  disabled={projectForm.saving}
                  onChange={event => projectForm.updateValue('handover_date', event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={text(dictionary, 'address', 'Address')}
                  value={projectForm.values.address}
                  disabled={projectForm.saving}
                  onChange={event => projectForm.updateValue('address', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <ProjectLogoUpload
                  dictionary={dictionary}
                  imageUrl={projectForm.logo.previewUrl}
                  hasSelectedFile={Boolean(projectForm.logo.file)}
                  error={projectForm.logo.error}
                  disabled={projectForm.saving}
                  onSelect={projectForm.logo.select}
                  onRemove={projectForm.logo.clear}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  label={common(dictionary, 'description', 'Description')}
                  value={projectForm.values.description}
                  error={Boolean(projectForm.errors.description)}
                  helperText={projectForm.errors.description ?? `${projectForm.values.description.length}/500`}
                  disabled={projectForm.saving}
                  onChange={event => projectForm.updateValue('description', event.target.value)}
                />
              </Grid>
            </Grid>

            <Divider />

            {/* Optional operating / deposit accounts of WF_BO_CREATE_PROJECT (same cards as the Bank information tab). */}
            <Stack spacing={2} data-bank-section="create">
              <Stack spacing={0.5}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  {text(dictionary, 'bankInformation', 'Bank information')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {text(dictionary, 'bankInformationSubtitle', 'Manage receiving accounts and payment instructions for this project.')}
                </Typography>
              </Stack>
              <ProjectBankAccountGroups
                dictionary={dictionary}
                accounts={{
                  operating_bank_account: projectForm.values.operating_bank_account,
                  deposit_bank_account: projectForm.values.deposit_bank_account
                }}
                editing={{ disabled: projectForm.saving, onChange: projectForm.updateBankAccount }}
              />
            </Stack>

            <Stack direction="row" justifyContent="flex-end" gap={1}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon fontSize="small" />}
                onClick={projectForm.goBack}
                disabled={projectForm.saving}
                sx={{ height: 40, px: 2.5, borderRadius: 2 }}
              >
                {common(dictionary, 'cancel', 'Cancel')}
              </Button>
              <Button
                variant="contained"
                startIcon={<AddCircleOutlineIcon fontSize="small" />}
                disabled={projectForm.saving}
                onClick={() => void projectForm.submit()}
                sx={{ height: 40, px: 2.5, borderRadius: 2 }}
              >
                {projectForm.saving
                  ? common(dictionary, 'processing', 'Processing...')
                  : text(dictionary, 'createProjectAction', 'Create Project')}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </ContentWrapper>
  )
}

export default ProjectCreatePage
