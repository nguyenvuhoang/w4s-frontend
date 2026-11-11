'use client'

import { useState, type ReactNode } from 'react'

import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import ApartmentIcon from '@mui/icons-material/Apartment'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Alert, Avatar, Box, Button, Chip, Divider, Grid, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { useRouter } from '@shared/hooks/useRouter'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import type { Locale } from '@/configs/i18n'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import PropertiesActionBar from '@/features/properties/components/PropertiesActionBar'
import DetailTabs from '@/shared/components/detail-tabs/DetailTabs'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import { PermissionGuard } from '@shared/permissions/PermissionGuard'

import type { ProjectDetailModel } from '../types'
import ProjectBankInformationTab from './bank/ProjectBankInformationTab'
import { useContextProjectDetail } from './hooks/useContextProjectDetail'
import { formatHandoverDate } from './projectDateHelpers'
import { useProjectProvinceLabel } from './province/useProjectProvinceLabel'
import {
  formatProjectCount,
  formatProjectValue,
  PROJECT_CONTEXT_BASE_PATH,
  PROJECT_BUSINESS_PERMISSION_PATH,
  projectCommonText,
  projectStatusColor,
  projectStatusLabel,
  projectText,
  type ProjectDictionary
} from './projectListHelpers'

const isSupportedLocale = (value: string): value is Locale => value === 'vi' || value === 'en' || value === 'la'

const InfoRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <Stack spacing={0.25} sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{value}</Typography>
  </Stack>
)

const CountTile = ({ label, value }: { label: string; value: string }) => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>{value}</Typography>
  </Paper>
)

/** Summary card of the working project, with the only actions of this screen: View and Modify. */
const ProjectContextCard = ({ dictionary, locale, project }: { dictionary: ProjectDictionary; locale: Locale; project: ProjectDetailModel }) => {
  const router = useRouter()
  const t = (key: string, fallback: string) => projectText(dictionary, key, fallback)
  const provinceLabel = useProjectProvinceLabel(project.province, locale)

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
            <Avatar variant="rounded" src={project.logo_url ?? undefined} alt={project.name} sx={{ width: 64, height: 64, bgcolor: 'background.default' }}>
              <ApartmentIcon color="primary" />
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.dark', overflowWrap: 'anywhere' }}>{project.name}</Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">{project.project_code}</Typography>
                <Chip size="small" color={projectStatusColor(project.status)} label={projectStatusLabel(dictionary, project.status)} sx={{ fontWeight: 700 }} />
              </Stack>
            </Box>
          </Stack>
          <PropertiesActionBar>
            <Button variant="outlined" startIcon={<VisibilityOutlinedIcon />} onClick={() => router.push(`/${locale}${PROJECT_CONTEXT_BASE_PATH}/${project.id}`)}>
              {t('contextView', 'View')}
            </Button>
            <PermissionGuard href={PROJECT_BUSINESS_PERMISSION_PATH} action="MODIFY">
              <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => router.push(`/${locale}${PROJECT_CONTEXT_BASE_PATH}/${project.id}/edit`)}>
                {t('contextModify', 'Modify')}
              </Button>
            </PermissionGuard>
          </PropertiesActionBar>
        </Stack>

        <Divider />

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}><InfoRow label={t('address', 'Address')} value={formatProjectValue(project.address)} /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}><InfoRow label={t('province', 'Province/City')} value={formatProjectValue(provinceLabel)} /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}><InfoRow label={t('handoverDate', 'Handover date')} value={formatHandoverDate(project.handover_date)} /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><InfoRow label={t('investor', 'Investor')} value={formatProjectValue(project.investor)} /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><InfoRow label={projectCommonText(dictionary, 'description', 'Description')} value={formatProjectValue(project.description)} /></Grid>
        </Grid>

        {/* Same project aggregates as the detail (response root); active residents are never total residents. */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 4 }}><CountTile label={t('totalBuildings', 'Total towers')} value={formatProjectCount(project.total_buildings)} /></Grid>
          <Grid size={{ xs: 6, sm: 4 }}><CountTile label={t('totalFloors', 'Total floors')} value={formatProjectCount(project.total_floors)} /></Grid>
          <Grid size={{ xs: 6, sm: 4 }}><CountTile label={t('totalApartments', 'Total apartments')} value={formatProjectCount(project.total_apartments)} /></Grid>
          <Grid size={{ xs: 6, sm: 4 }}><CountTile label={t('totalResidents', 'Total residents')} value={formatProjectCount(project.total_residents)} /></Grid>
          <Grid size={{ xs: 6, sm: 4 }}><CountTile label={t('activeResidents', 'Active residents')} value={formatProjectCount(project.active_residents)} /></Grid>
          <Grid size={{ xs: 6, sm: 4 }}><CountTile label={t('inactiveResidents', 'Inactive residents')} value={formatProjectCount(project.inactive_residents)} /></Grid>
        </Grid>
      </Stack>
    </Paper>
  )
}

type ContextProjectDetail = ReturnType<typeof useContextProjectDetail>

/** "Thông tin dự án": the existing working-project summary card (unchanged), with its loading / error states. */
const ProjectInformationTab = ({ dictionary, locale, detail }: { dictionary: ProjectDictionary; locale: Locale; detail: ContextProjectDetail }) => {
  if (detail.loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }} data-testid="project-context-loading">
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={64} />
          <Skeleton height={24} />
          <Skeleton height={24} width="60%" />
        </Stack>
      </Paper>
    )
  }

  if (detail.error || !detail.project) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={detail.reload}>{projectCommonText(dictionary, 'retry', 'Retry')}</Button>}>
        {detail.error ?? projectText(dictionary, 'projectNotFound', 'Project not found.')}
      </Alert>
    )
  }

  return <ProjectContextCard dictionary={dictionary} locale={locale} project={detail.project} />
}

type ProjectBusinessTab = 'information' | 'bank'

/**
 * Tabs of the working project (local tab state on the same route, like the other Properties detail
 * tabs). Both panels stay mounted: switching tabs neither reloads the project nor touches the project
 * context.
 */
const ProjectBusinessTabs = ({ dictionary, locale, sessiontoken }: { dictionary: ProjectDictionary; locale: Locale; sessiontoken?: string }) => {
  // Source of truth: the working project selected in the header (never the first project of a search).
  const workingProject = useWorkingProject()
  const detail = useContextProjectDetail({ dictionary, sessiontoken, language: locale, projectId: workingProject?.id ?? null })
  const [activeTab, setActiveTab] = useState<ProjectBusinessTab>('information')

  if (!workingProject) return null

  const bankProject = {
    id: workingProject.id,
    name: detail.project?.name || workingProject.name,
    code: detail.project?.project_code || workingProject.code
  }

  return (
    <Stack spacing={2.5}>
      <DetailTabs
        value={activeTab}
        onChange={setActiveTab}
        ariaLabel={projectText(dictionary, 'businessTabsLabel', 'Project tabs')}
        tabs={[
          { value: 'information', label: projectText(dictionary, 'detailTabInfo', 'Project information'), icon: <InfoOutlinedIcon fontSize="small" /> },
          { value: 'bank', label: projectText(dictionary, 'bankInformation', 'Bank information'), icon: <AccountBalanceOutlinedIcon fontSize="small" /> }
        ]}
      />
      <Box role="tabpanel" id="detail-tabpanel-information" aria-labelledby="detail-tab-information" hidden={activeTab !== 'information'}>
        <ProjectInformationTab dictionary={dictionary} locale={locale} detail={detail} />
      </Box>
      <Box role="tabpanel" id="detail-tabpanel-bank" aria-labelledby="detail-tab-bank" hidden={activeTab !== 'bank'}>
        <ProjectBankInformationTab
          dictionary={dictionary}
          project={bankProject}
          accounts={{ operating_bank_account: detail.project?.operating_bank_account, deposit_bank_account: detail.project?.deposit_bank_account }}
          mode="view"
        />
      </Box>
    </Stack>
  )
}

/**
 * Business Project screen (/properties/project): only the project of the current working-project
 * context, with the "Project information" (View / Modify) and "Bank information" tabs. The full catalog (search, filters, create...) lives in
 * System Settings > Project Management. Without a selected project the shared project gate shows
 * its "select a project" state and picker.
 */
const ProjectContextPage = ({ dictionary }: { dictionary: ProjectDictionary }) => {
  const params = useParams<{ locale: string }>()
  const { data: session } = useSession()
  const locale: Locale = isSupportedLocale(params.locale) ? params.locale : 'vi'
  const sessiontoken = session?.user?.token ?? undefined

  return (
    <ContentWrapper
      title={projectText(dictionary, 'contextTitle', 'Project')}
      description={projectText(dictionary, 'contextSubtitle', 'The project you are currently working on.')}
      icon={<ApartmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
    >
      <Box sx={{ mt: 3 }}>
        <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
          <ProjectBusinessTabs dictionary={dictionary} locale={locale} sessiontoken={sessiontoken} />
        </RequireWorkingProject>
      </Box>
    </ContentWrapper>
  )
}

export default ProjectContextPage
