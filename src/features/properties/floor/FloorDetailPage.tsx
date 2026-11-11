'use client'

import { useAdminPropertyContext, PropertyActionGuard } from '@/features/properties/PropertyRouteContext'
import { propertyPath } from '@/features/properties/propertyPaths'

import { useRef, useState } from 'react'

import ApartmentIcon from '@mui/icons-material/Apartment'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import BusinessIcon from '@mui/icons-material/Business'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import LayersIcon from '@mui/icons-material/Layers'
import NorthEastIcon from '@mui/icons-material/NorthEast'
import PeopleIcon from '@mui/icons-material/People'
import SellOutlinedIcon from '@mui/icons-material/SellOutlined'
import { Alert, Box, Button, Chip, Grid, Link as MuiLink, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useSession } from 'next-auth/react'
import NextLink from 'next/link'
import { useRouter } from '@shared/hooks/useRouter'

import type { Locale } from '@/configs/i18n'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import PropertiesActionBar from '@/features/properties/components/PropertiesActionBar'
import { formatPropertyText } from '@/features/properties/propertyFieldHelpers'
import EntityAuditHistory from '@/shared/components/entity-audit/EntityAuditHistory'
import SwalAlert from '@shared/utils/SwalAlert'

import FloorDeleteDialog from './FloorDeleteDialog'
import FloorFormDialog from './FloorFormDialog'
import { commonText, displayResidentCount, floorText, getFloorStatusColor, getFloorStatusLabel } from './floorHelpers'
import { floorService } from './floorService'
import { useFloorDelete } from './hooks/useFloorDelete'
import { useFloorForm } from './hooks/useFloorForm'
import type { FloorDetailModel, FloorDictionary } from './types'

const FloorInfoItem = ({
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

const FloorLinkValue = ({ id, href }: { id: number | null | undefined; href: string }) => {
  if (!id) {
    return (
      <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25 }}>
        -
      </Typography>
    )
  }

  return (
    <MuiLink
      component={NextLink}
      href={href}
      underline="hover"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        mt: 0.25,
        fontWeight: 700,
        color: 'primary.main',
        cursor: 'pointer',
        borderRadius: 1,
        px: 0.5,
        mx: -0.5,
        '&:hover': {
          bgcolor: theme => alpha(theme.palette.primary.main, 0.08)
        }
      }}
    >
      {id}
      <NorthEastIcon sx={{ fontSize: 14 }} />
    </MuiLink>
  )
}

const FloorDetailPage = ({
  dictionary,
  locale,
  floorId,
  initialFloor,
  initialError
}: {
  dictionary: FloorDictionary
  locale: Locale
  floorId: number
  initialFloor: FloorDetailModel | null
  initialError?: string | null
}) => {
  const router = useRouter()
  const admin = useAdminPropertyContext()
  const { data: session } = useSession()

  const [floor, setFloor] = useState<FloorDetailModel | null>(initialFloor)
  const [error, setError] = useState<string | null>(initialError ?? null)
  const [loading, setLoading] = useState(false)
  // Bumped only after WF_BO_UPDATE_FLOOR succeeded, so "Lịch sử thay đổi" reloads without F5.
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  // Only the latest detail request may update the screen (consecutive saves / manual refresh).
  const refreshSeqRef = useRef(0)

  const refresh = async () => {
    const seq = ++refreshSeqRef.current

    setLoading(true)
    setError(null)

    try {
      const fresh_floor = await floorService.getFloorById({
        sessiontoken: session?.user?.token ?? undefined,
        language: locale,
        id: floorId
      })

      if (seq !== refreshSeqRef.current) return

      if (!fresh_floor) {
        setError(floorText(dictionary, 'floorNotFound', 'Floor not found.'))
      } else {
        setFloor(fresh_floor)
      }
    } catch (err) {
      if (seq !== refreshSeqRef.current) return
      setError(err instanceof Error ? err.message : floorText(dictionary, 'floorLoadError', 'Unable to load floor detail.'))
    } finally {
      if (seq === refreshSeqRef.current) setLoading(false)
    }
  }

  const sessiontoken = session?.user?.token ?? undefined

  const floorForm = useFloorForm({
    dictionary,
    sessiontoken,
    language: locale,
    onSaved: async () => {
      SwalAlert('success', floorText(dictionary, 'updateFloorSuccess', 'Floor updated successfully.'), 'center')
      setHistoryRefreshKey(value => value + 1)
      await refresh()
    }
  })

  // Leave the detail (back to the list, which reloads) only after WF_BO_DELETE_FLOOR succeeded.
  const floorDelete = useFloorDelete({
    dictionary,
    sessiontoken,
    language: locale,
    onDeleted: () => {
      SwalAlert('success', floorText(dictionary, 'deleteFloorSuccess', 'Floor deleted successfully.'), 'center')
      backToFloorList()
    }
  })

  const backToFloorList = () => {
    if (floor) router.push(`/${locale}${propertyPath('floor', admin)}?project_id=${floor.project_id}&building_id=${floor.building_id}`)
    else router.push(`/${locale}${propertyPath('floor', admin)}`)
  }

  if (error || !floor) {
    return (
      <ContentWrapper
        title={floorText(dictionary, 'floorDetail', 'Floor Detail')}
        description=""
        icon={<LayersIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
        dictionary={dictionary}
      >
        <Stack spacing={2} sx={{ mt: 3, alignItems: 'flex-start' }}>
          <Alert severity="error" sx={{ width: '100%' }}>{error || floorText(dictionary, 'floorNotFound', 'Floor not found.')}</Alert>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(`/${locale}${propertyPath('floor', admin)}`)}>
            {floorText(dictionary, 'backToFloorList', 'Back to floor list')}
          </Button>
        </Stack>
      </ContentWrapper>
    )
  }

  const status_label = getFloorStatusLabel(dictionary, floor.status)
  const status_color = getFloorStatusColor(floor.status)

  return (
    <ContentWrapper
      title={floor.name || floor.floor_code}
      description={floor.floor_code}
      icon={<LayersIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
    >
      <Stack spacing={3.5} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {floorText(dictionary, 'floorBreadcrumb', 'Properties / Floor / Floor detail')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.dark', mt: 0.5 }}>
              {floorText(dictionary, 'floorDetail', 'Floor Detail')}
            </Typography>
          </Box>
          <PropertiesActionBar>
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={backToFloorList}>
              {floorText(dictionary, 'backToFloorList', 'Back to floor list')}
            </Button>
            <Button variant="outlined" startIcon={<AutorenewIcon />} disabled={loading} onClick={() => void refresh()}>
              {loading ? commonText(dictionary, 'processing', 'Processing...') : commonText(dictionary, 'refresh', 'Refresh')}
            </Button>
            <PropertyActionGuard href="/properties/floor" action="MODIFY">
              <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => floorForm.openEdit(floor)}>
                {commonText(dictionary, 'edit', 'Edit')}
              </Button>
            </PropertyActionGuard>
            <PropertyActionGuard href="/properties/floor" action="DELETE">
              <Button variant="outlined" color="error" startIcon={<DeleteOutlineIcon />} onClick={() => floorDelete.requestDelete(floor.id)}>
                {commonText(dictionary, 'delete', 'Delete')}
              </Button>
            </PropertyActionGuard>
          </PropertiesActionBar>
        </Stack>

        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FloorInfoItem
                icon={<SellOutlinedIcon fontSize="small" />}
                label={floorText(dictionary, 'floorCode', 'Floor Code')}
                value={floor.floor_code || '-'}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FloorInfoItem
                icon={<LayersIcon fontSize="small" />}
                label={floorText(dictionary, 'floorName', 'Floor Name')}
                value={floor.name || '-'}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FloorInfoItem
                icon={<ApartmentIcon fontSize="small" />}
                label={floorText(dictionary, 'projectId', 'Project')}
                valueNode={<FloorLinkValue id={floor.project_id} href={`/${locale}/properties/project/${floor.project_id}`} />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FloorInfoItem
                icon={<BusinessIcon fontSize="small" />}
                label={floorText(dictionary, 'buildingId', 'Building')}
                valueNode={<FloorLinkValue id={floor.building_id} href={`/${locale}${propertyPath('building', admin)}/${floor.building_id}`} />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FloorInfoItem
                icon={<PeopleIcon fontSize="small" />}
                label={floorText(dictionary, 'residentCount', 'Resident count')}
                value={displayResidentCount(floor.resident_count, locale)}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FloorInfoItem
                icon={<DescriptionOutlinedIcon fontSize="small" />}
                label={commonText(dictionary, 'description', 'Description')}
                value={formatPropertyText(floor.description)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FloorInfoItem
                icon={<CheckCircleOutlineIcon fontSize="small" />}
                label={commonText(dictionary, 'status', 'Status')}
                valueNode={<Chip size="small" color={status_color} label={status_label} sx={{ mt: 0.5, fontWeight: 700 }} />}
              />
            </Grid>
          </Grid>
        </Paper>

        <EntityAuditHistory entityName="Floor" entityId={floor.id} dictionary={dictionary} locale={locale} refreshKey={historyRefreshKey} />
      </Stack>

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

      <FloorDeleteDialog
        dictionary={dictionary}
        open={floorDelete.open}
        deleting={floorDelete.deleting}
        error={floorDelete.error}
        onCancel={floorDelete.cancel}
        onConfirm={() => void floorDelete.confirm()}
      />
    </ContentWrapper>
  )
}

export default FloorDetailPage
