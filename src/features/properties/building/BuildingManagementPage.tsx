'use client'

import { useAdminPropertyContext, PropertyActionGuard } from '@/features/properties/PropertyRouteContext'
import { propertyPath } from '@/features/properties/propertyPaths'

import AddIcon from '@mui/icons-material/Add'
import BusinessIcon from '@mui/icons-material/Business'
import { Alert, Button, Paper, Stack, Typography } from '@mui/material'

import PaginationPage from '@/@core/components/jTable/pagination'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import { formatProjectLabel } from '@/shared/services/projectLookupService'
import { useRouter } from '@shared/hooks/useRouter'

import BuildingFilterBar from './BuildingFilterBar'
import { buildingText, commonText } from './buildingHelpers'
import BuildingTable from './BuildingTable'
import { useBuildingSearch } from './hooks/useBuildingSearch'
import type {
  BuildingPageProps,
  BuildingSearchFilter,
  BuildingSearchResponse
} from './types'

type Props = BuildingPageProps & {
  initialFilter: BuildingSearchFilter
  initialData: BuildingSearchResponse
  initialError?: string | null
}

const BuildingManagementPage = ({
  dictionary,
  session,
  locale,
  initialFilter,
  initialData,
  initialError = null
}: Props) => {
  const router = useRouter()
  const admin = useAdminPropertyContext()
  const sessiontoken = session?.user?.token ?? undefined
  const buildings = useBuildingSearch({
    dictionary,
    sessiontoken,
    language: locale,
    initialFilter,
    initialData,
    initialError
  })

  const selectedProject = buildings.selectedProject

  return (
    <ContentWrapper
      title={buildingText(dictionary, 'buildingTitle', 'Building Management')}
      description={buildingText(dictionary, 'buildingSubtitle', 'Manage towers and buildings under each project.')}
      icon={<BusinessIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
        <Stack spacing={3} sx={{ mt: 3 }}>
          <Paper sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" gap={1.5}>
              <Stack spacing={0.25}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {buildingText(dictionary, 'buildingListTitle', 'Building list')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {buildings.selectedProject
                    ? `${buildingText(dictionary, 'viewingProject', 'Viewing')}: ${formatProjectLabel(buildings.selectedProject)}`
                    : buildingText(dictionary, 'selectProjectHint', 'Select a project to view buildings.')}
                </Typography>
              </Stack>
              {/* The total is shown by the pagination below ("n Kết quả"), so the header only keeps the action. */}
              {selectedProject && (
                <PropertyActionGuard href="/properties/building" action="ADD">
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => router.push(`/${locale}${propertyPath('building', admin)}/create`)}
                    sx={{ alignSelf: { xs: 'flex-end', md: 'center' }, flexShrink: 0 }}
                  >
                    {buildingText(dictionary, 'addBuilding', 'Add tower')}
                  </Button>
                </PropertyActionGuard>
              )}
            </Stack>
          </Paper>

          <BuildingFilterBar
            dictionary={dictionary}
            filter={buildings.draftFilter}
            disabled={buildings.loading}
            onChange={buildings.updateDraftFilter}
            onStatusChange={buildings.handleStatusChange}
            onSearch={buildings.handleSearch}
            onReset={buildings.handleReset}
          />

          {buildings.error && (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={() => void buildings.loadData()}>
                  {commonText(dictionary, 'retry', 'Retry')}
                </Button>
              }
            >
              {buildings.error}
            </Alert>
          )}

          <BuildingTable
            dictionary={dictionary}
            locale={locale}
            rows={buildings.rows}
            loading={buildings.loading}
            onOpenDetail={row => router.push(`/${locale}${propertyPath('building', admin)}/${row.id}`)}
          />

          {buildings.totalCount > 0 && (
            <PaginationPage
              page={buildings.filter.page_index}
              pageSize={buildings.filter.page_size}
              totalResults={buildings.totalCount}
              jumpPage={buildings.filter.page_index}
              handlePageSizeChange={buildings.handlePageSizeChange}
              handlePageChange={buildings.handlePageChange}
              handleJumpPage={buildings.handleJumpPage}
              dictionary={dictionary}
            />
          )}
        </Stack>
      </RequireWorkingProject>
    </ContentWrapper>
  )
}

export default BuildingManagementPage
