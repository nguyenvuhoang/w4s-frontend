'use client'

import { useEffect, useMemo, useState } from 'react'

import AddIcon from '@mui/icons-material/Add'
import ApartmentIcon from '@mui/icons-material/Apartment'
import DomainIcon from '@mui/icons-material/Domain'
import SearchIcon from '@mui/icons-material/Search'
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Popper,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'
import { useSession } from 'next-auth/react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { useRouter } from '@shared/hooks/useRouter'

import PaginationPage from '@/@core/components/jTable/pagination'
import { useWorkingProjectIsSuperAdmin, useWorkingProjectList } from '@/@core/stores/useWorkingProjectStore'
import type { Locale } from '@/configs/i18n'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'

import { propertyAggregateService } from '../propertyAggregateService'
import ProjectCollectionView from './ProjectCollectionView'
import ProjectViewToggle from './ProjectViewToggle'
import {
  DEFAULT_PROJECT_VIEW_MODE,
  EMPTY_PROJECT_FILTER,
  formatProjectCount,
  formatProjectValue,
  PROJECT_MANAGEMENT_BASE_PATH,
  PROJECT_PAGE_SIZE_OPTIONS,
  projectProvinceSelectMessages,
  PROJECT_STATUS_FILTER_OPTIONS,
  projectCommonText,
  projectStatusFilterLabel,
  projectText,
  resetProjectFilter,
  withProjectProvince,
  withProjectStatus
} from './projectListHelpers'
import type { ProjectDictionary, ProjectViewMode } from './projectListHelpers'
import ProvinceSelect from './province/ProvinceSelect'
import { toProjectProvinceValue } from './province/projectProvinceValue'
import { useProjectProvinceLabel } from './province/useProjectProvinceLabel'
import type {
  ProjectFilterModel,
  ProjectModel,
  ProjectPayload,
  ProjectStatusFilter,
  PropertyStatus
} from '../types'

type Dictionary = ProjectDictionary
type DrawerMode = 'create' | 'edit'
type ConfirmAction = { type: 'delete' | 'status'; row: ProjectModel } | null

const emptyForm: ProjectPayload = {
  project_name: '',
  project_code: '',
  image_url: '',
  investor: '',
  management_company: '',
  address: '',
  province: '',
  status: 'active',
  description: ''
}

const numberFormat = new Intl.NumberFormat('vi-VN')

const text = projectText
const common = projectCommonText

const normalizeCode = (value: string) => value.toUpperCase().replace(/\s+/g, '_')

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Stack direction="row" justifyContent="space-between" gap={2}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Box
      component="span"
      sx={{
        typography: 'body2',
        fontWeight: 600,
        textAlign: 'right',
        display: 'inline-flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        minWidth: 0
      }}
    >
      {value}
    </Box>
  </Stack>
)

// The search item only carries the stored province (code): show its master name.
const ProjectProvinceRow = ({ dictionary, province, locale }: { dictionary: Dictionary; province: string; locale: string }) => {
  const provinceLabel = useProjectProvinceLabel(province, locale)

  return <DetailRow label={text(dictionary, 'province', 'Province/City')} value={formatProjectValue(provinceLabel)} />
}

const ProjectDetailPanel = ({ dictionary, project, locale }: { dictionary: Dictionary; project: ProjectModel; locale: string }) => (
  <Stack spacing={1.4} sx={{ width: { xs: '100%', sm: 360 }, p: 2 }}>
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
        {project.project_name}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {project.project_code}
      </Typography>
    </Box>
    <Divider />
    {/* Quick preview: only what WF_BO_SIMPLE_SEARCH_PROJECTS returns (no extra request on hover). */}
    <DetailRow label={text(dictionary, 'address', 'Address')} value={formatProjectValue(project.address)} />
    <ProjectProvinceRow dictionary={dictionary} province={project.province} locale={locale} />
    <DetailRow label={text(dictionary, 'totalBuildings', 'Total towers')} value={formatProjectCount(project.total_buildings)} />
    <DetailRow label={text(dictionary, 'totalFloors', 'Total floors')} value={formatProjectCount(project.total_floors)} />
    <DetailRow label={text(dictionary, 'totalApartments', 'Total apartments')} value={formatProjectCount(project.total_units)} />
  </Stack>
)

const ProjectSkeletonGrid = () => (
  <Grid container spacing={3}>
    {Array.from({ length: 6 }).map((_, index) => (
      <Grid key={index} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Skeleton variant="rectangular" height={146} />
          <Stack spacing={1.5} sx={{ p: 2 }}>
            <Skeleton height={28} width="70%" />
            <Skeleton height={20} width="50%" />
            <Skeleton height={52} />
          </Stack>
        </Card>
      </Grid>
    ))}
  </Grid>
)

/**
 * Full project catalog management (System Settings > Project Management). `basePath` is where its
 * create / detail routes live (`${basePath}/create`, `${basePath}/:id`). Access is the System Settings
 * admin boundary enforced by the routes (AuthorizedLayout + static super-admin policy), so the
 * management actions are not filtered by the business Project rights.
 */
const ProjectManagementPage = ({ dictionary, basePath = PROJECT_MANAGEMENT_BASE_PATH }: { dictionary: Dictionary; basePath?: string }) => {
  const theme = useTheme()
  const params = useParams<{ locale: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const isSuperAdmin = useWorkingProjectIsSuperAdmin()
  const authorizedProjects = useWorkingProjectList()
  const isTouch = useMediaQuery(theme.breakpoints.down('md'))
  const [filter, setFilter] = useState<ProjectFilterModel>(EMPTY_PROJECT_FILTER)
  const [projects, setProjects] = useState<ProjectModel[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null)
  const [selected, setSelected] = useState<ProjectModel | null>(null)
  const [formValues, setFormValues] = useState<ProjectPayload>(emptyForm)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProjectPayload, string>>>({})
  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [hoverAnchor, setHoverAnchor] = useState<HTMLElement | null>(null)
  const [hoverProject, setHoverProject] = useState<ProjectModel | null>(null)
  const [viewMode, setViewMode] = useState<ProjectViewMode>(DEFAULT_PROJECT_VIEW_MODE)

  const labels = useMemo(
    () => ({
      title: text(dictionary, 'title', 'Project Management'),
      subtitle: text(dictionary, 'subtitle', 'Manage apartment projects, buildings, floors and units.')
    }),
    [dictionary]
  )

  const loadProjects = async (nextFilter: ProjectFilterModel = filter) => {
    setLoading(true)
    setError(null)

    try {
      const response = await propertyAggregateService.simpleSearchProjects({
        sessiontoken: session?.user?.token ?? undefined,
        language: params.locale as Locale,
        filter: nextFilter,
        isSuperAdmin,
        authorizedProjects
      })
      const project_data = response.items

      setProjects(project_data)
      setTotalCount(response.total_count)
      setTotalPages(response.total_pages)
      setFilter({ ...nextFilter, page_index: response.page_index })
    } catch (err) {
      setError(err instanceof Error ? err.message : text(dictionary, 'loadError', 'Unable to load projects.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProjects(EMPTY_PROJECT_FILTER)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.token, params.locale])

  const activeProjects = projects.filter(project => project.status === 'active').length

  const resetFilter = () => {
    const next_filter = resetProjectFilter()

    setFilter(next_filter)
    void loadProjects(next_filter)
  }

  const handleStatusChange = (status: ProjectStatusFilter) => {
    void loadProjects(withProjectStatus(filter, status))
  }

  const handleProvinceChange = (province: string) => {
    void loadProjects(withProjectProvince(filter, province))
  }

  const handleSearch = () => {
    void loadProjects({ ...filter, page_index: 0 })
  }

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    const page_size = Number(event.target.value)

    void loadProjects({ ...filter, page_size, page_index: 0 })
  }

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    void loadProjects({ ...filter, page_index: Math.max(page - 1, 0) })
  }

  const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const page = Math.min(Math.max(Number(event.target.value) || 1, 1), Math.max(totalPages, 1))

    void loadProjects({ ...filter, page_index: page - 1 })
  }

  const closeDrawer = () => {
    setDrawerMode(null)
    setSelected(null)
    setFormValues(emptyForm)
    setFormErrors({})
  }

  const updateFormValue = <K extends keyof ProjectPayload>(key: K, value: ProjectPayload[K]) => {
    setFormValues(current => ({ ...current, [key]: value }))
    setFormErrors(current => ({ ...current, [key]: undefined }))
  }

  const validateForm = () => {
    const errors: Partial<Record<keyof ProjectPayload, string>> = {}

    if (!formValues.project_name.trim()) errors.project_name = text(dictionary, 'projectNameRequired', 'Project Name is required.')
    if (!formValues.project_code.trim()) errors.project_code = text(dictionary, 'projectCodeRequired', 'Project Code is required.')
    if (!formValues.province) errors.province = text(dictionary, 'provinceRequired', 'Province/City is required.')
    if (formValues.description && formValues.description.length > 500) errors.description = text(dictionary, 'descriptionMax', 'Description must not exceed 500 characters.')
    if (formValues.project_code.trim() && propertyAggregateService.is_duplicate_project_code(formValues.project_code, selected?.id)) {
      errors.project_code = text(dictionary, 'projectCodeDuplicated', 'Project Code already exists.')
    }

    setFormErrors(errors)

    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)

    try {
      if (drawerMode === 'edit' && selected) {
        await propertyAggregateService.update_project(selected.id, formValues)
      } else {
        await propertyAggregateService.create_project(formValues)
      }

      closeDrawer()
      await loadProjects()
    } finally {
      setSaving(false)
    }
  }

  const handleConfirm = async () => {
    if (!confirmAction) return

    if (confirmAction.type === 'delete') {
      await propertyAggregateService.delete_project(confirmAction.row.id)
    } else {
      await propertyAggregateService.change_project_status(
        confirmAction.row.id,
        confirmAction.row.status === 'active' ? 'inactive' : 'active'
      )
    }

    setConfirmAction(null)
    await loadProjects()
  }

  const openProjectDetail = (project: ProjectModel) => {
    router.push(`/${params.locale}${basePath}/${project.id}`)
  }

  const openHover = (event: React.MouseEvent<HTMLElement>, project: ProjectModel) => {
    if (isTouch) return
    setHoverAnchor(event.currentTarget)
    setHoverProject(project)
  }

  const closeHover = () => {
    setHoverAnchor(null)
    setHoverProject(null)
  }

  return (
    <ContentWrapper
      title={labels.title}
      description={labels.subtitle}
      icon={<ApartmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <Stack spacing={3} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5}>
            <Chip icon={<DomainIcon />} label={`${numberFormat.format(totalCount)} ${text(dictionary, 'projects', 'projects')}`} sx={{ fontWeight: 700 }} />
            <Chip color="success" icon={<ApartmentIcon />} label={`${activeProjects} ${text(dictionary, 'activeProjects', 'active')}`} sx={{ fontWeight: 700 }} />
          </Stack>
          <Stack direction="row" gap={1} justifyContent="flex-end" alignItems="center" sx={{ flexShrink: 0 }}>
            {/* Switching view only changes presentation: same loaded page, search, filters and pagination. */}
            <ProjectViewToggle dictionary={dictionary} value={viewMode} onChange={setViewMode} />
            {/* Admin area: the System Settings route boundary already authorized the user, no business right checked here. */}
            <Button
              component={NextLink}
              href={`/${params.locale}${basePath}/create`}
              variant="contained"
              startIcon={<AddIcon />}
            >
              {text(dictionary, 'addProject', 'Add Project')}
            </Button>
          </Stack>
        </Stack>

        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
            <TextField
              fullWidth
              size="small"
              label={common(dictionary, 'search', 'Search')}
              placeholder={text(dictionary, 'searchPlaceholder', 'Search by project name or code')}
              value={filter.search_text}
              onChange={event => setFilter(current => ({ ...current, search_text: event.target.value }))}
              onKeyDown={event => {
                if (event.key === 'Enter') handleSearch()
              }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
              sx={{ flex: 1 }}
            />
            {/* The authorized-project list of non super admins is searched locally and carries no status/province,
                so these server-side filters are only offered on the workflow search (super admin). */}
            {isSuperAdmin && (
              <>
                <TextField
                  select
                  size="small"
                  label={common(dictionary, 'status', 'Status')}
                  value={filter.status}
                  onChange={event => handleStatusChange(event.target.value as ProjectStatusFilter)}
                  slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
                  sx={{ width: { xs: '100%', md: 200 }, flexShrink: 0 }}
                >
                  {PROJECT_STATUS_FILTER_OPTIONS.map(option => (
                    <MenuItem key={option || 'all'} value={option}>
                      {projectStatusFilterLabel(dictionary, option)}
                    </MenuItem>
                  ))}
                </TextField>
                <ProvinceSelect
                  label={text(dictionary, 'province', 'Province/City')}
                  emptyLabel={text(dictionary, 'provinceAllOption', 'All provinces/cities')}
                  value={filter.province}
                  onChange={handleProvinceChange}
                  sessiontoken={session?.user?.token ?? undefined}
                  locale={params.locale}
                  messages={projectProvinceSelectMessages(dictionary)}
                  sx={{ width: { xs: '100%', md: 260 }, flexShrink: 0 }}
                />
              </>
            )}
            <Stack direction="row" gap={1} sx={{ width: { xs: '100%', md: 'auto' }, flexShrink: 0 }}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                sx={{ flex: { xs: 1, md: '0 0 auto' }, height: 40, minWidth: 128 }}
              >
                {common(dictionary, 'search', 'Search')}
              </Button>
              <Button
                variant="outlined"
                onClick={resetFilter}
                sx={{ flex: { xs: 1, md: '0 0 auto' }, height: 40, minWidth: 128 }}
              >
                {common(dictionary, 'reset', 'Reset')}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void loadProjects()}>{common(dictionary, 'retry', 'Retry')}</Button>}>
            {error}
          </Alert>
        )}

        {loading ? (
          <ProjectSkeletonGrid />
        ) : projects.length === 0 ? (
          <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2 }}>
            <ApartmentIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {text(dictionary, 'emptyTitle', 'No projects found')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {text(dictionary, 'emptyDescription', 'No projects match the current filters.')}
            </Typography>
          </Paper>
        ) : (
          <ProjectCollectionView
            dictionary={dictionary}
            viewMode={viewMode}
            projects={projects}
            onOpenProject={openProjectDetail}
            onHoverStart={openHover}
            onHoverEnd={closeHover}
          />
        )}

        {totalCount > 0 && (
          <PaginationPage
            page={filter.page_index + 1}
            pageSize={filter.page_size}
            totalResults={totalCount}
            jumpPage={filter.page_index + 1}
            handlePageSizeChange={handlePageSizeChange}
            handlePageChange={handlePageChange}
            handleJumpPage={handleJumpPage}
            dictionary={dictionary}
            pageSizeOptions={PROJECT_PAGE_SIZE_OPTIONS}
          />
        )}

      </Stack>

      {/* Hover quick-view: Popper (not Popover/Modal) so the page keeps its scroll while it is open. */}
      <Popper
        open={Boolean(hoverAnchor && hoverProject)}
        anchorEl={hoverAnchor}
        placement="right"
        modifiers={[
          { name: 'offset', options: { offset: [0, 12] } },
          { name: 'flip', options: { fallbackPlacements: ['left', 'bottom', 'top'] } },
          { name: 'preventOverflow', options: { padding: 8 } }
        ]}
        sx={{ pointerEvents: 'none', zIndex: theme => theme.zIndex.modal }}
      >
        <Paper sx={{ borderRadius: 2, boxShadow: 6, border: 1, borderColor: 'divider', overflow: 'hidden' }}>
          {hoverProject && <ProjectDetailPanel dictionary={dictionary} project={hoverProject} locale={params.locale} />}
        </Paper>
      </Popper>

      <Drawer anchor="right" open={Boolean(drawerMode)} onClose={closeDrawer} PaperProps={{ sx: { width: { xs: '100%', sm: 620 } } }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
            {drawerMode === 'create'
              ? text(dictionary, 'addProject', 'Add Project')
              : text(dictionary, 'editProject', 'Edit Project')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {text(dictionary, 'formDescription', 'Configure project identity and management information.')}
          </Typography>
        </Box>
        <Divider />
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <TextField
            fullWidth
            required
            label={text(dictionary, 'projectName', 'Project Name')}
            value={formValues.project_name}
            error={Boolean(formErrors.project_name)}
            helperText={formErrors.project_name}
            onChange={event => updateFormValue('project_name', event.target.value)}
          />
          <TextField
            fullWidth
            required
            label={text(dictionary, 'projectCode', 'Project Code')}
            value={formValues.project_code}
            error={Boolean(formErrors.project_code)}
            helperText={formErrors.project_code}
            onChange={event => updateFormValue('project_code', normalizeCode(event.target.value))}
          />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <ProvinceSelect
                size="medium"
                required
                showAllOption={false}
                label={text(dictionary, 'province', 'Province/City')}
                value={formValues.province}
                getOptionValue={toProjectProvinceValue}
                error={Boolean(formErrors.province)}
                helperText={formErrors.province}
                onChange={value => updateFormValue('province', value)}
                sessiontoken={session?.user?.token ?? undefined}
                locale={params.locale}
                messages={projectProvinceSelectMessages(dictionary)}
              />
            </Grid>
          </Grid>
          <TextField
            fullWidth
            label={text(dictionary, 'investor', 'Investor')}
            value={formValues.investor}
            onChange={event => updateFormValue('investor', event.target.value)}
          />
          <TextField
            fullWidth
            label={text(dictionary, 'managementCompany', 'Management Company')}
            value={formValues.management_company}
            onChange={event => updateFormValue('management_company', event.target.value)}
          />
          <TextField
            fullWidth
            label={text(dictionary, 'address', 'Address')}
            value={formValues.address}
            onChange={event => updateFormValue('address', event.target.value)}
          />
          <TextField
            fullWidth
            label={text(dictionary, 'imageUrl', 'Image URL')}
            placeholder={text(dictionary, 'imageUrlPlaceholder', 'Optional project banner URL')}
            value={formValues.image_url}
            onChange={event => updateFormValue('image_url', event.target.value)}
          />
          <TextField
            fullWidth
            select
            label={common(dictionary, 'status', 'Status')}
            value={formValues.status}
            onChange={event => updateFormValue('status', event.target.value as PropertyStatus)}
          >
            {(['active', 'inactive', 'draft'] as PropertyStatus[]).map(option => (
              <MenuItem key={option} value={option}>
                {text(dictionary, `status${option}`, option)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label={common(dictionary, 'description', 'Description')}
            value={formValues.description}
            error={Boolean(formErrors.description)}
            helperText={formErrors.description ?? `${formValues.description?.length ?? 0}/500`}
            onChange={event => updateFormValue('description', event.target.value)}
          />
        </Stack>
        <Box sx={{ mt: 'auto', p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="flex-end" gap={1}>
            <Button onClick={closeDrawer}>{common(dictionary, 'cancel', 'Cancel')}</Button>
            <Button variant="contained" disabled={saving} onClick={() => void handleSave()}>
              {saving ? common(dictionary, 'processing', 'Processing...') : common(dictionary, 'save', 'Save')}
            </Button>
          </Stack>
        </Box>
      </Drawer>

      <Dialog open={Boolean(confirmAction)} onClose={() => setConfirmAction(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{common(dictionary, 'confirm', 'Confirm')}</DialogTitle>
        <DialogContent>
          <Typography>
            {confirmAction?.type === 'delete'
              ? text(dictionary, 'deleteConfirm', 'Are you sure you want to delete this project?')
              : text(dictionary, 'statusConfirm', 'Are you sure you want to change this project status?')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAction(null)}>{common(dictionary, 'cancel', 'Cancel')}</Button>
          <Button color={confirmAction?.type === 'delete' ? 'error' : 'primary'} variant="contained" onClick={() => void handleConfirm()}>
            {common(dictionary, 'confirm', 'Confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </ContentWrapper>
  )
}

export default ProjectManagementPage
