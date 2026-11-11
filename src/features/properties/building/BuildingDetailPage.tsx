'use client'

import { useAdminPropertyContext, PropertyActionGuard } from '@/features/properties/PropertyRouteContext'
import { propertyPath } from '@/features/properties/propertyPaths'

import { useState } from 'react'

import ApartmentIcon from '@mui/icons-material/Apartment'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import LayersIcon from '@mui/icons-material/Layers'
import PeopleIcon from '@mui/icons-material/People'
import SellOutlinedIcon from '@mui/icons-material/SellOutlined'
import { Alert, Box, Button, Chip, Grid, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useSession } from 'next-auth/react'
import { useRouter } from '@shared/hooks/useRouter'

import type { Locale } from '@/configs/i18n'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import PropertiesActionBar from '@/features/properties/components/PropertiesActionBar'
import { formatPropertyCount, formatPropertyText } from '@/features/properties/propertyFieldHelpers'
import EntityAuditHistory from '@/shared/components/entity-audit/EntityAuditHistory'
import SwalAlert from '@shared/utils/SwalAlert'

import BuildingDeleteDialog from './BuildingDeleteDialog'
import BuildingFormDialog from './BuildingFormDialog'
import { buildingText, commonText, getBuildingStatusColor, getBuildingStatusLabel } from './buildingHelpers'
import { buildingService } from './buildingService'
import { useBuildingDelete } from './hooks/useBuildingDelete'
import { useBuildingForm } from './hooks/useBuildingForm'
import type { BuildingDetailModel, BuildingDictionary, ProjectBuildingSummaryModel } from './types'

const defaultBuildingImageUrl = '/images/illustrations/building.jpg'
const defaultProjectBuildingSummary: ProjectBuildingSummaryModel = {
  total_floors: 0,
  total_apartments: 0,
  total_residents: 0
}
const numberFormat = new Intl.NumberFormat('vi-VN')

const BuildingInfoItem = ({
  icon,
  label,
  value,
  valueNode
}: {
  icon: React.ReactNode
  label: string
  value?: React.ReactNode
  valueNode?: React.ReactNode
}) => (
  <Stack
    direction="row"
    spacing={1.5}
    alignItems="flex-start"
    sx={{
      p: '14px 16px',
      borderRadius: 2,
      border: 1,
      borderColor: 'divider',
      bgcolor: 'background.paper',
      height: '100%'
    }}
  >
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        bgcolor: theme => alpha(theme.palette.primary.main, 0.12),
        color: 'primary.main',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      {valueNode ?? (
        <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25, wordBreak: 'break-word' }}>
          {value}
        </Typography>
      )}
    </Box>
  </Stack>
)

const BuildingDetailPage = ({
  dictionary,
  locale,
  buildingId,
  initialBuilding,
  initialProjectBuildingSummary,
  initialError
}: {
  dictionary: BuildingDictionary
  locale: Locale
  buildingId: number
  initialBuilding: BuildingDetailModel | null
  initialProjectBuildingSummary?: ProjectBuildingSummaryModel
  initialError?: string | null
}) => {
  const router = useRouter()
  const admin = useAdminPropertyContext()
  const { data: session } = useSession()

  const [building, setBuilding] = useState<BuildingDetailModel | null>(initialBuilding)
  const [projectBuildingSummary, setProjectBuildingSummary] = useState<ProjectBuildingSummaryModel>(
    initialProjectBuildingSummary ?? defaultProjectBuildingSummary
  )
  const [error, setError] = useState<string | null>(initialError ?? null)
  const [loading, setLoading] = useState(false)

  const refresh = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await buildingService.getBuildingById({
        sessiontoken: session?.user?.token ?? undefined,
        language: locale,
        id: buildingId
      })

      const fresh_building = response.building

      if (!fresh_building) {
        setError(buildingText(dictionary, 'buildingNotFound', 'Tower not found.'))
      } else {
        setBuilding(fresh_building)
        setProjectBuildingSummary(response.summary)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : buildingText(dictionary, 'buildingLoadError', 'Unable to load tower detail.'))
    } finally {
      setLoading(false)
    }
  }

  const sessiontoken = session?.user?.token ?? undefined

  // The tower list is scoped by the working project (persisted per user), so navigating back keeps it.
  const backToTowerList = () => router.push(`/${locale}${propertyPath('building', admin)}`)

  const buildingForm = useBuildingForm({
    dictionary,
    sessiontoken,
    language: locale,
    onSaved: async () => {
      SwalAlert('success', buildingText(dictionary, 'updateBuildingSuccess', 'Tower updated successfully.'), 'center')
      await refresh()
    }
  })

  // Leave the detail for the tower list (which reloads) only after WF_BO_DELETE_BUILDING succeeded.
  const buildingDelete = useBuildingDelete({
    dictionary,
    sessiontoken,
    language: locale,
    onDeleted: () => {
      SwalAlert('success', buildingText(dictionary, 'deleteBuildingSuccess', 'Tower deleted successfully.'), 'center')
      backToTowerList()
    }
  })

  if (error || !building) {
    return (
      <ContentWrapper
        title={buildingText(dictionary, 'buildingDetail', 'Tower Detail')}
        description=""
        icon={<ApartmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
        dictionary={dictionary}
      >
        <Stack spacing={2} sx={{ mt: 3, alignItems: 'flex-start' }}>
          <Alert severity="error" sx={{ width: '100%' }}>{error || buildingText(dictionary, 'buildingNotFound', 'Tower not found.')}</Alert>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={backToTowerList}>
            {buildingText(dictionary, 'backToTowerList', 'Back to tower list')}
          </Button>
        </Stack>
      </ContentWrapper>
    )
  }

  const building_image_url = building.image_url?.trim() || defaultBuildingImageUrl
  const status_label = getBuildingStatusLabel(dictionary, building.status)
  const status_color = getBuildingStatusColor(building.status)

  return (
    <ContentWrapper
      title={building.name}
      description={building.building_code}
      icon={<ApartmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
    >
      <Stack spacing={3.5} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {buildingText(dictionary, 'buildingBreadcrumb', 'Properties / Tower / Tower detail')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.dark', mt: 0.5 }}>
              {buildingText(dictionary, 'buildingDetail', 'Tower Detail')}
            </Typography>
          </Box>
          <PropertiesActionBar>
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={backToTowerList}>
              {buildingText(dictionary, 'backToTowerList', 'Back to tower list')}
            </Button>
            <Button variant="outlined" startIcon={<AutorenewIcon />} disabled={loading} onClick={() => void refresh()}>
              {loading ? commonText(dictionary, 'processing', 'Processing...') : commonText(dictionary, 'refresh', 'Refresh')}
            </Button>
            <PropertyActionGuard href="/properties/building" action="MODIFY">
              <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => buildingForm.openEdit(building)}>
                {commonText(dictionary, 'edit', 'Edit')}
              </Button>
            </PropertyActionGuard>
            <PropertyActionGuard href="/properties/building" action="DELETE">
              <Button variant="outlined" color="error" startIcon={<DeleteOutlineIcon />} onClick={() => buildingDelete.requestDelete(building.id)}>
                {commonText(dictionary, 'delete', 'Delete')}
              </Button>
            </PropertyActionGuard>
          </PropertiesActionBar>
        </Stack>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', height: '100%' }}>
              <Box
                sx={{
                  height: 210,
                  borderRadius: 1.5,
                  bgcolor: 'background.default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}
              >
                <Box component="img" src={building_image_url} alt={building.name} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </Box>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <BuildingInfoItem
                  icon={<LayersIcon fontSize="small" />}
                  label={buildingText(dictionary, 'totalFloors', 'Total floors')}
                  value={numberFormat.format(projectBuildingSummary.total_floors)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <BuildingInfoItem
                  icon={<ApartmentIcon fontSize="small" />}
                  label={buildingText(dictionary, 'totalUnits', 'Total units')}
                  value={numberFormat.format(projectBuildingSummary.total_apartments)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                {/* Aggregate total_residents of WF_BO_GET_BUILDING_BY_ID — not the tower's resident_count field below. */}
                <BuildingInfoItem
                  icon={<PeopleIcon fontSize="small" />}
                  label={buildingText(dictionary, 'totalResidents', 'Total residents')}
                  value={numberFormat.format(projectBuildingSummary.total_residents)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <BuildingInfoItem
                  icon={<SellOutlinedIcon fontSize="small" />}
                  label={buildingText(dictionary, 'buildingCode', 'Tower Code')}
                  value={building.building_code || '-'}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <BuildingInfoItem
                  icon={<ApartmentIcon fontSize="small" />}
                  label={buildingText(dictionary, 'buildingName', 'Tower Name')}
                  value={building.name || '-'}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <BuildingInfoItem
                  icon={<LayersIcon fontSize="small" />}
                  label={buildingText(dictionary, 'floorCount', 'Floor Count')}
                  value={formatPropertyCount(building.floor_count, locale)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                {/* The tower's resident_count field, shown as returned (null -> "--", 0 -> "0"). */}
                <BuildingInfoItem
                  icon={<PeopleIcon fontSize="small" />}
                  label={buildingText(dictionary, 'residentCount', 'Resident count')}
                  value={formatPropertyCount(building.resident_count, locale)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <BuildingInfoItem
                  icon={<CheckCircleOutlineIcon fontSize="small" />}
                  label={commonText(dictionary, 'status', 'Status')}
                  valueNode={<Chip size="small" color={status_color} label={status_label} sx={{ mt: 0.5, fontWeight: 700 }} />}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <BuildingInfoItem
                  icon={<DescriptionOutlinedIcon fontSize="small" />}
                  label={commonText(dictionary, 'description', 'Description')}
                  value={formatPropertyText(building.description)}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Backend entity name of the Tower screens is "Building". */}
        <EntityAuditHistory entityName="Building" entityId={building.id} dictionary={dictionary} locale={locale} />
      </Stack>

      <BuildingFormDialog
        dictionary={dictionary}
        open={buildingForm.open}
        values={buildingForm.values}
        errors={buildingForm.errors}
        submitError={buildingForm.submitError}
        saving={buildingForm.saving}
        onChange={buildingForm.updateValue}
        onClose={buildingForm.close}
        onSubmit={() => void buildingForm.submit()}
      />

      <BuildingDeleteDialog
        dictionary={dictionary}
        open={buildingDelete.open}
        deleting={buildingDelete.deleting}
        error={buildingDelete.error}
        onCancel={buildingDelete.cancel}
        onConfirm={() => void buildingDelete.confirm()}
      />
    </ContentWrapper>
  )
}

export default BuildingDetailPage
