'use client'

import { useAdminPropertyContext, PropertyActionGuard } from '@/features/properties/PropertyRouteContext'
import { propertyPath } from '@/features/properties/propertyPaths'

import { useState } from 'react'

import AddIcon from '@mui/icons-material/Add'
import ApartmentIcon from '@mui/icons-material/Apartment'
import BusinessIcon from '@mui/icons-material/Business'
import DomainIcon from '@mui/icons-material/Domain'
import LayersIcon from '@mui/icons-material/Layers'
import { Alert, Box, Button, InputAdornment, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useRouter } from '@shared/hooks/useRouter'

import PaginationPage from '@/@core/components/jTable/pagination'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import { formatProjectLabel } from '@/shared/services/projectLookupService'
import SwalAlert from '@shared/utils/SwalAlert'

import FloorFilterBar from './FloorFilterBar'
import FloorFormDialog from './FloorFormDialog'
import { commonText, floorText } from './floorHelpers'
import FloorTable from './FloorTable'
import { useFloorForm } from './hooks/useFloorForm'
import { useFloorSearch } from './hooks/useFloorSearch'
import type {
  FloorBuildingOption,
  FloorPageProps,
  FloorSearchFilter,
  FloorSearchItem,
  FloorSearchResponse
} from './types'

type Props = FloorPageProps & {
  initialFilter: FloorSearchFilter
  initialData: FloorSearchResponse
  initialBuildings?: FloorBuildingOption[]
  initialBuildingsError?: string | null
  initialError?: string | null
  /** Tower context from the URL (`?project_id=&building_id=`), restored after coming back from a floor detail. */
  preferredContext?: { project_id: number | null; building_id: number | null }
}

const FloorManagementPage = ({
  dictionary,
  session,
  locale,
  initialFilter,
  initialData,
  initialBuildings = [],
  initialBuildingsError = null,
  initialError = null,
  preferredContext
}: Props) => {
  const router = useRouter()
  const admin = useAdminPropertyContext()
  const sessiontoken = session?.user?.token ?? undefined
  const [navigatingFloorId, setNavigatingFloorId] = useState<number | null>(null)
  const floors = useFloorSearch({
    dictionary,
    sessiontoken,
    language: locale,
    initialFilter,
    initialData,
    initialBuildings,
    initialBuildingsError,
    initialError,
    preferredContext
  })

  // Reload the list only after WF_BO_CREATE_FLOOR succeeded (keeps the current filter and page).
  const floorForm = useFloorForm({
    dictionary,
    sessiontoken,
    language: locale,
    onSaved: async () => {
      SwalAlert('success', floorText(dictionary, 'createFloorSuccess', 'Floor created successfully.'), 'center')
      await floors.loadData()
    }
  })

  const handleViewFloorDetail = (row: FloorSearchItem) => {
    if (!row.id || navigatingFloorId) return

    setNavigatingFloorId(row.id)
    router.push(`/${locale}${propertyPath('floor', admin)}/${row.id}`)
  }

  return (
    <ContentWrapper
      title={floorText(dictionary, 'floorTitle', 'Floor Management')}
      description={floorText(dictionary, 'floorSubtitle', 'Manage floors by project and building.')}
      icon={<LayersIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
      <Stack spacing={3} sx={{ mt: 3 }}>
            <Paper
              sx={{
                overflow: 'hidden',
                borderRadius: 3,
                border: 1,
                borderColor: 'divider',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)'
              }}
            >
              <Box
                sx={{
                  height: 4,
                  background: theme => `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`
                }}
              />
              <Box sx={{ p: { xs: 2.5, md: 3 } }}>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                  justifyContent="space-between"
                  gap={2.5}
                >
                  <Stack direction="row" spacing={1.75} alignItems="center" sx={{ minWidth: 0 }}>
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        flexShrink: 0,
                        borderRadius: 2.5,
                        bgcolor: theme => alpha(theme.palette.primary.main, 0.12),
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <BusinessIcon sx={{ fontSize: 24 }} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                          {floorText(dictionary, 'floorGroups', 'Building groups')}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                        <ApartmentIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                          {floorText(dictionary, 'viewingProject', 'Viewing')}:{' '}
                          <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {floors.selectedProject ? formatProjectLabel(floors.selectedProject) : ''}
                          </Box>
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>

                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    gap={1.5}
                    sx={{ width: { xs: '100%', md: 'auto' }, flexShrink: 0 }}
                  >
                    <TextField
                      select
                      size="small"
                      sx={{
                        width: { xs: '100%', md: 300 },
                        flexShrink: 0,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          bgcolor: 'background.default'
                        }
                      }}
                      label={floorText(dictionary, 'buildingContextSelector', 'Building being managed')}
                      value={floors.selectedBuilding?.id ?? ''}
                      disabled={floors.buildingsLoading || floors.buildingOptions.length === 0}
                      onChange={event => floors.handleBuildingChange(Number(event.target.value))}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <DomainIcon fontSize="small" color={floors.selectedBuilding ? 'primary' : 'disabled'} />
                            </InputAdornment>
                          )
                        }
                      }}
                    >
                      {floors.buildingOptions.map(building => (
                        <MenuItem key={building.id} value={building.id}>
                          {building.name}
                        </MenuItem>
                      ))}
                    </TextField>
                    {/* Shown whenever the working project is set; the managed tower (if any) is preselected in the form. */}
                    {floors.selectedProject && (
                      <PropertyActionGuard href="/properties/floor" action="ADD">
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => floorForm.openCreate(floors.selectedBuilding?.id ?? null, floors.buildingOptions)}
                          sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                        >
                          {floorText(dictionary, 'addFloor', 'Add floor')}
                        </Button>
                      </PropertyActionGuard>
                    )}
                  </Stack>
                </Stack>

                {floors.buildingsError && (
                  <Alert severity="error" sx={{ mt: 2.5 }}>
                    {floors.buildingsError}
                  </Alert>
                )}
              </Box>
            </Paper>

            {!floors.selectedBuilding ? (
              <Alert severity="info">
                {floorText(dictionary, 'selectBuildingForFloors', 'Please select a building to manage floors.')}
              </Alert>
            ) : (
              <>
                <FloorFilterBar
                  dictionary={dictionary}
                  filter={floors.draftFilter}
                  disabled={floors.loading}
                  onChange={floors.updateDraftFilter}
                  onStatusChange={floors.handleStatusChange}
                  onSearch={floors.handleSearch}
                  onReset={floors.handleReset}
                />

                {floors.error && (
                  <Alert
                    severity="error"
                    action={
                      <Button color="inherit" size="small" onClick={() => void floors.loadData()}>
                        {commonText(dictionary, 'retry', 'Retry')}
                      </Button>
                    }
                  >
                    {floors.error}
                  </Alert>
                )}

                <FloorTable
                  dictionary={dictionary}
                  locale={locale}
                  rows={floors.rows}
                  loading={floors.loading}
                  navigatingId={navigatingFloorId}
                  onRowDoubleClick={handleViewFloorDetail}
                />

                {floors.totalCount > 0 && (
                  <PaginationPage
                    page={floors.filter.page_index}
                    pageSize={floors.filter.page_size}
                    totalResults={floors.totalCount}
                    jumpPage={floors.filter.page_index}
                    handlePageSizeChange={floors.handlePageSizeChange}
                    handlePageChange={floors.handlePageChange}
                    handleJumpPage={floors.handleJumpPage}
                    dictionary={dictionary}
                  />
                )}
              </>
            )}
      </Stack>
      </RequireWorkingProject>

      <FloorFormDialog
        dictionary={dictionary}
        open={floorForm.open}
        mode={floorForm.mode}
        values={floorForm.values}
        errors={floorForm.errors}
        submitError={floorForm.submitError}
        buildingsError={floorForm.buildingsError}
        saving={floorForm.saving}
        buildingOptions={floorForm.buildingOptions}
        onChange={floorForm.updateValue}
        onClose={floorForm.close}
        onSubmit={() => void floorForm.submit()}
      />
    </ContentWrapper>
  )
}

export default FloorManagementPage
