'use client'

import { useAdminPropertyContext, PropertyActionGuard } from '@/features/properties/PropertyRouteContext'
import { propertyPath } from '@/features/properties/propertyPaths'

import { useState } from 'react'

import AddIcon from '@mui/icons-material/Add'
import ApartmentIcon from '@mui/icons-material/Apartment'
import BusinessIcon from '@mui/icons-material/Business'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useRouter } from '@shared/hooks/useRouter'

import PaginationPage from '@/@core/components/jTable/pagination'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { resolveRowInteractionMode, RowInteractionTip } from '@/shared/components/table'
import { PermissionGuard } from '@shared/permissions/PermissionGuard'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import { formatProjectLabel } from '@/shared/services/projectLookupService'

import ApartmentFilterBar from './ApartmentFilterBar'
import { apartmentText, commonText, formatApartmentBuildingLabel, formatApartmentFloorLabel } from './apartmentHelpers'
import ApartmentTable from './ApartmentTable'
import { useApartmentSearch } from './hooks/useApartmentSearch'
import type {
  ApartmentBuildingOption,
  ApartmentFloorOption,
  ApartmentPageProps,
  ApartmentSearchFilter,
  ApartmentSearchItem,
  ApartmentSearchResponse
} from './types'

type Props = ApartmentPageProps & {
  initialFilter: ApartmentSearchFilter
  initialData: ApartmentSearchResponse
  initialBuildings?: ApartmentBuildingOption[]
  initialBuildingsError?: string | null
  initialFloors?: ApartmentFloorOption[]
  initialFloorsError?: string | null
  initialError?: string | null
}

const ApartmentManagementPage = ({
  dictionary,
  session,
  locale,
  initialFilter,
  initialData,
  initialBuildings = [],
  initialBuildingsError = null,
  initialFloors = [],
  initialFloorsError = null,
  initialError = null
}: Props) => {
  const router = useRouter()
  const admin = useAdminPropertyContext()
  const sessiontoken = session?.user?.token ?? undefined

  const apartments = useApartmentSearch({
    dictionary,
    sessiontoken,
    language: locale,
    initialFilter,
    initialData,
    initialBuildings,
    initialBuildingsError,
    initialFloors,
    initialFloorsError,
    initialError
  })

  const [navigatingApartmentId, setNavigatingApartmentId] = useState<number | null>(null)

  const handleViewApartmentDetail = (row: ApartmentSearchItem) => {
    if (!row.id || navigatingApartmentId) return

    setNavigatingApartmentId(row.id)
    router.push(`/${locale}${propertyPath('unit', admin)}/${row.id}`)
  }

  return (
    <ContentWrapper
      title={apartmentText(dictionary, 'apartmentTitle', 'Apartment Management')}
      description={apartmentText(dictionary, 'apartmentSubtitle', 'Manage apartments through Project -> Building -> Floor hierarchy.')}
      icon={<HomeWorkIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <Stack spacing={3} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 800 }}>
              {apartments.totalCount} {apartmentText(dictionary, 'apartment', 'Apartment')}
            </Typography>
          </Box>
          <Stack direction="row" gap={1} justifyContent="flex-end">
            {!admin && <PermissionGuard href="/properties/unit" action="IMPORT">
              <Tooltip title={apartmentText(dictionary, 'importApartmentButtonTooltip', 'Add apartment profiles in bulk')}>
                <Button
                  variant="outlined"
                  startIcon={<UploadFileIcon />}
                  onClick={() => router.push(`/${locale}${propertyPath('unit', admin)}/import`)}
                >
                  {apartmentText(dictionary, 'bulkAddApartment', 'Bulk add')}
                </Button>
              </Tooltip>
            </PermissionGuard>}
            <PropertyActionGuard href="/properties/unit" action="ADD">
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push(`/${locale}${propertyPath('unit', admin)}/create`)}>
                {apartmentText(dictionary, 'addApartment', 'Add Apartment')}
              </Button>
            </PropertyActionGuard>
          </Stack>
        </Stack>

        <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
          <>
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
                          {apartmentText(dictionary, 'apartmentList', 'Apartment list')}
                        </Typography>
                        {apartments.buildingOptions.length > 0 && (
                          <Chip
                            size="small"
                            label={`${apartments.buildingOptions.length} ${apartmentText(dictionary, 'buildings', 'buildings')}`}
                            sx={{ fontWeight: 700, bgcolor: theme => alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}
                          />
                        )}
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                        <ApartmentIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                          {apartmentText(dictionary, 'viewingProject', 'Viewing')}:{' '}
                          <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {apartments.selectedProject ? formatProjectLabel(apartments.selectedProject) : ''}
                          </Box>
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>

                  <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5}>
                    <TextField
                      select
                      size="small"
                      sx={{ width: { xs: '100%', sm: 220 }, flexShrink: 0, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
                      label={apartmentText(dictionary, 'building', 'Tower')}
                      value={apartments.filter.building_id ?? ''}
                      disabled={apartments.buildingsLoading || apartments.buildingOptions.length === 0}
                      onChange={event => apartments.handleBuildingChange(event.target.value === '' ? null : Number(event.target.value))}
                    >
                      <MenuItem value="">{apartmentText(dictionary, 'allBuildings', 'All towers')}</MenuItem>
                      {apartments.buildingOptions.map(building => (
                        <MenuItem key={building.id} value={building.id}>{formatApartmentBuildingLabel(building)}</MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      select
                      size="small"
                      sx={{ width: { xs: '100%', sm: 220 }, flexShrink: 0, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
                      label={apartmentText(dictionary, 'floor', 'Floor')}
                      value={apartments.filter.floor_id ?? ''}
                      disabled={!apartments.filter.building_id || apartments.floorsLoading || apartments.floorOptions.length === 0}
                      onChange={event => apartments.handleFloorChange(event.target.value === '' ? null : Number(event.target.value))}
                    >
                      <MenuItem value="">{apartmentText(dictionary, 'allFloors', 'All floors')}</MenuItem>
                      {apartments.floorOptions.map(floor => (
                        <MenuItem key={floor.id} value={floor.id}>{formatApartmentFloorLabel(floor)}</MenuItem>
                      ))}
                    </TextField>
                  </Stack>
                </Stack>

                {(apartments.buildingsError || apartments.floorsError) && (
                  <Alert severity="error" sx={{ mt: 2.5 }}>
                    {apartments.buildingsError || apartments.floorsError}
                  </Alert>
                )}
              </Box>
            </Paper>

            <ApartmentFilterBar
              dictionary={dictionary}
              filter={apartments.draftFilter}
              disabled={apartments.loading}
              onChange={apartments.updateDraftFilter}
              onSelectChange={apartments.applyFilter}
              onSearch={apartments.handleSearch}
              onReset={apartments.handleReset}
            />

            {apartments.error && (
              <Alert
                severity="error"
                action={
                  <Button color="inherit" size="small" onClick={() => void apartments.loadData()}>
                    {commonText(dictionary, 'retry', 'Retry')}
                  </Button>
                }
              >
                {apartments.error}
              </Alert>
            )}

            <RowInteractionTip mode={resolveRowInteractionMode()} dictionary={dictionary} />

            <ApartmentTable
              dictionary={dictionary}
              locale={locale}
              rows={apartments.rows}
              projectOptions={apartments.selectedProject ? [apartments.selectedProject] : []}
              buildingOptions={apartments.buildingOptions}
              loading={apartments.loading}
              navigatingId={navigatingApartmentId}
              onRowDoubleClick={handleViewApartmentDetail}
            />

            {apartments.totalCount > 0 && (
              <PaginationPage
                page={apartments.filter.page_index}
                pageSize={apartments.filter.page_size}
                totalResults={apartments.totalCount}
                jumpPage={apartments.filter.page_index}
                handlePageSizeChange={apartments.handlePageSizeChange}
                handlePageChange={apartments.handlePageChange}
                handleJumpPage={apartments.handleJumpPage}
                dictionary={dictionary}
              />
            )}
          </>
        </RequireWorkingProject>
      </Stack>

    </ContentWrapper>
  )
}

export default ApartmentManagementPage
