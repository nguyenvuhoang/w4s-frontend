'use client'

import { useAdminPropertyContext, PropertyActionGuard } from '@/features/properties/PropertyRouteContext'
import { propertyPath } from '@/features/properties/propertyPaths'

import { useMemo, useState } from 'react'

import ApartmentIcon from '@mui/icons-material/Apartment'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import BusinessIcon from '@mui/icons-material/Business'
import CategoryIcon from '@mui/icons-material/Category'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ElectricBoltOutlinedIcon from '@mui/icons-material/ElectricBoltOutlined'
import EventOutlinedIcon from '@mui/icons-material/EventOutlined'
import FormatListNumberedOutlinedIcon from '@mui/icons-material/FormatListNumberedOutlined'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LayersIcon from '@mui/icons-material/Layers'
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined'
import PeopleIcon from '@mui/icons-material/People'
import SellOutlinedIcon from '@mui/icons-material/SellOutlined'
import SquareFootIcon from '@mui/icons-material/SquareFoot'
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useSession } from 'next-auth/react'
import { useRouter } from '@shared/hooks/useRouter'

import type { Locale } from '@/configs/i18n'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import PropertiesActionBar from '@/features/properties/components/PropertiesActionBar'
import { formatHandoverDate } from '@/features/properties/project/projectDateHelpers'
import { formatPropertyCount, formatPropertyText } from '@/features/properties/propertyFieldHelpers'
import DetailTabs from '@/shared/components/detail-tabs/DetailTabs'
import EntityAuditHistory from '@/shared/components/entity-audit/EntityAuditHistory'
import { usePermission } from '@shared/permissions/usePermission'
import SwalAlert from '@shared/utils/SwalAlert'

import {
  apartmentText,
  commonText,
  formatApartmentArea,
  getApartmentRecordStatusColor,
  getApartmentRecordStatusLabel
} from './apartmentHelpers'
import ApartmentDeleteDialog from './ApartmentDeleteDialog'
import { useApartmentDelete } from './hooks/useApartmentDelete'
import { getApartmentStatusCaption, useApartmentStatusCodeList } from './hooks/useApartmentStatusCodeList'
import { getApartmentTypeCaption, useApartmentTypeCodeList } from './hooks/useApartmentTypeCodeList'
import { apartmentSearchService } from './services/apartmentSearchService'
import type { ApartmentDetailResult, ApartmentDictionary } from './types'

const ApartmentInfoItem = ({
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

const InfoSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>{title}</Typography>
    <Grid container spacing={2}>{children}</Grid>
  </Paper>
)


type ApartmentDetailTab = 'info' | 'history'

/** First value that is not null / empty / whitespace (name, then its code), "--" when none. */
const firstText = (...values: Array<string | null | undefined>) => formatPropertyText(values.find(value => value?.trim()))

// Change-history labels for the Apartment fields shown on this screen (Backend FieldName -> dictionary key).
// Any other field falls back to the name returned by the audit API.
const APARTMENT_AUDIT_FIELD_LABEL_KEYS: Record<string, [key: string, fallback: string]> = {
  ApartmentCode: ['apartmentCode', 'Full apartment code'],
  UnitNumber: ['apartmentNo', 'Unit Code'],
  RoomCount: ['roomCount', 'Room count'],
  ApartmentStatus: ['apartmentStatus', 'Apartment status'],
  ApartmentType: ['apartmentType', 'Apartment Type'],
  Area: ['area', 'Area'],
  WaterMeterCode: ['waterMeterCode', 'Water Meter Code'],
  ElectricityMeterCode: ['electricityMeterCode', 'Electricity Meter Code'],
  Status: ['status', 'Status'],
  BuildingId: ['building', 'Tower'],
  FloorId: ['floor', 'Floor']
}

type Props = {
  dictionary: ApartmentDictionary
  locale: Locale
  apartmentId: number
  initialDetail: ApartmentDetailResult
  initialError?: string | null
}

const ApartmentDetailPage = ({
  dictionary,
  locale,
  apartmentId,
  initialDetail,
  initialError = null
}: Props) => {
  const router = useRouter()
  const admin = useAdminPropertyContext()
  const { data: session } = useSession()

  const [detail, setDetail] = useState<ApartmentDetailResult>(initialDetail)
  const [error, setError] = useState<string | null>(initialError)
  const [loading, setLoading] = useState(false)
  const permission = usePermission({ href: '/properties/unit' })
  const apartmentStatusCodes = useApartmentStatusCodeList(locale)
  const apartmentTypeCodes = useApartmentTypeCodeList(locale)
  const [activeTab, setActiveTab] = useState<ApartmentDetailTab>('info')
  // The change history is only fetched once its tab is opened, then kept mounted (no refetch when
  // switching tabs); a different apartment id reloads it for that apartment.
  const [historyOpened, setHistoryOpened] = useState(false)
  const auditFieldLabels = useMemo(() => Object.fromEntries(
    Object.entries(APARTMENT_AUDIT_FIELD_LABEL_KEYS).map(([fieldName, [key, fallback]]) => [fieldName, apartmentText(dictionary, key, fallback)])
  ), [dictionary])

  const changeTab = (tab: ApartmentDetailTab) => {
    setActiveTab(tab)
    if (tab === 'history') setHistoryOpened(true)
  }

  const handleDeleteClick = () => {
    if (!admin && !permission.canDelete) {
      SwalAlert('warning', dictionary['common'].nopermissionview, 'center')

      return
    }

    apartmentDelete.requestDelete(apartmentId)
  }

  const refresh = async () => {
    setLoading(true)
    setError(null)

    try {
      const fresh = await apartmentSearchService.getApartmentDetail({
        sessiontoken: session?.user?.token ?? undefined,
        language: locale,
        apartment_id: apartmentId
      })

      if (!fresh.apartment) {
        setError(apartmentText(dictionary, 'apartmentNotFound', 'Apartment not found.'))
      } else {
        setDetail(fresh)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : apartmentText(dictionary, 'apartmentLoadError', 'Unable to load apartment detail.'))
    } finally {
      setLoading(false)
    }
  }

  const backToApartmentList = () => {
    const apt = detail.apartment

    if (apt) router.push(`/${locale}${propertyPath('unit', admin)}?project_id=${apt.project_id}&building_id=${apt.building_id}&floor_id=${apt.floor_id}`)
    else router.push(`/${locale}${propertyPath('unit', admin)}`)
  }

  // Leave the detail for the list (which reloads from the Backend search) only after WF_BO_DELETE_APARTMENT succeeded.
  const apartmentDelete = useApartmentDelete({
    dictionary,
    sessiontoken: session?.user?.token ?? undefined,
    language: locale,
    onDeleted: () => {
      SwalAlert('success', apartmentText(dictionary, 'deleteApartmentSuccess', 'Apartment deleted successfully.'), 'center')
      router.push(`/${locale}${propertyPath('unit', admin)}`)
    }
  })

  if (error || !detail.apartment) {
    return (
      <ContentWrapper
        title={apartmentText(dictionary, 'apartmentDetail', 'Apartment Detail')}
        description=""
        icon={<HomeWorkIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
        dictionary={dictionary}
      >
        <Stack spacing={2} sx={{ mt: 3, alignItems: 'flex-start' }}>
          <Alert severity="error" sx={{ width: '100%' }}>{error || apartmentText(dictionary, 'apartmentNotFound', 'Apartment not found.')}</Alert>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(`/${locale}${propertyPath('unit', admin)}`)}>
            {apartmentText(dictionary, 'backToApartmentList', 'Back to apartment list')}
          </Button>
        </Stack>
      </ContentWrapper>
    )
  }

  const apt = detail.apartment

  // "Thông tin căn hộ": 14 fields, read in rows of 3 on desktop (2 on tablet, 1 on mobile). Every value comes from
  // WF_BO_GET_APARTMENT_DETAIL; a value it does not return shows "--" (0 stays 0).
  const apartmentInfoItems: {
    key: string
    icon: React.ReactNode
    label: string
    value?: React.ReactNode
    valueNode?: React.ReactNode
    size?: { xs: number; sm?: number; md: number }
  }[] = [
    {
      key: 'project',
      icon: <BusinessIcon fontSize="small" />,
      label: apartmentText(dictionary, 'project', 'Project'),
      value: firstText(detail.project?.name, detail.project?.project_code, apt.project_code)
    },
    {
      key: 'building',
      icon: <ApartmentIcon fontSize="small" />,
      label: apartmentText(dictionary, 'building', 'Tower'),
      value: firstText(detail.building?.name, detail.building?.building_code, apt.building_code)
    },
    { key: 'floor', icon: <LayersIcon fontSize="small" />, label: apartmentText(dictionary, 'floor', 'Floor'), value: formatPropertyText(apt.floor) },
    {
      key: 'unit_number',
      icon: <FormatListNumberedOutlinedIcon fontSize="small" />,
      label: apartmentText(dictionary, 'apartmentUnit', 'Unit'),
      value: formatPropertyText(apt.unit_number)
    },
    {
      key: 'apartment_code',
      icon: <SellOutlinedIcon fontSize="small" />,
      label: apartmentText(dictionary, 'apartmentCode', 'Full apartment code'),
      value: formatPropertyText(apt.apartment_code)
    },
    {
      key: 'apartment_type',
      icon: <CategoryIcon fontSize="small" />,
      label: apartmentText(dictionary, 'apartmentType', 'Apartment Type'),
      value: apt.apartment_type.trim() ? getApartmentTypeCaption(apartmentTypeCodes.captionMap, apt.apartment_type) : '--'
    },
    {
      key: 'water_meter_code',
      icon: <WaterDropOutlinedIcon fontSize="small" />,
      label: apartmentText(dictionary, 'waterMeterCode', 'Water Meter Code'),
      value: formatPropertyText(apt.water_meter_code)
    },
    {
      key: 'electric_meter_code',
      icon: <ElectricBoltOutlinedIcon fontSize="small" />,
      label: apartmentText(dictionary, 'electricityMeterCode', 'Electric Meter Code'),
      value: formatPropertyText(apt.electric_meter_code)
    },
    {
      // Business status of the apartment (raw Backend value, no CodeList yet) — never the record status A/I.
      key: 'apartment_status',
      icon: <HomeWorkIcon fontSize="small" />,
      label: apartmentText(dictionary, 'apartmentStatus', 'Apartment status'),
      value: formatPropertyText(getApartmentStatusCaption(apartmentStatusCodes.captionMap, apt.apartment_status))
    },
    {
      key: 'area',
      icon: <SquareFootIcon fontSize="small" />,
      label: apartmentText(dictionary, 'area', 'Area'),
      value: apt.area === null ? '--' : formatApartmentArea(apt.area)
    },
    {
      key: 'room_count',
      icon: <MeetingRoomOutlinedIcon fontSize="small" />,
      label: apartmentText(dictionary, 'roomCount', 'Room count'),
      value: formatPropertyCount(apt.room_count, locale)
    },
    {
      // Apartment handover date (never the project's), shown as the Vietnam calendar day.
      key: 'handover_date',
      icon: <EventOutlinedIcon fontSize="small" />,
      label: apartmentText(dictionary, 'handoverDate', 'Handover date'),
      value: formatHandoverDate(apt.handover_date)
    },
    {
      // Apartment description (never the project's).
      key: 'description',
      icon: <DescriptionOutlinedIcon fontSize="small" />,
      label: commonText(dictionary, 'description', 'Description'),
      value: formatPropertyText(apt.description),
      size: { xs: 12, md: 8 }
    },
    {
      // Record status A / I.
      key: 'status',
      icon: <CheckCircleOutlineIcon fontSize="small" />,
      label: commonText(dictionary, 'status', 'Status'),
      valueNode: <Chip size="small" color={getApartmentRecordStatusColor(apt.status)} label={getApartmentRecordStatusLabel(dictionary, apt.status)} sx={{ mt: 0.5, fontWeight: 700 }} />,
      size: { xs: 12, sm: 6, md: 4 }
    }
  ]

  return (
    <ContentWrapper
      title={apt.apartment_code}
      description={apt.project_code}
      icon={<HomeWorkIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
    >
      <Stack spacing={3.5} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {apartmentText(dictionary, 'apartmentBreadcrumb', 'Properties / Apartment / Apartment detail')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.dark', mt: 0.5 }}>
              {apartmentText(dictionary, 'apartmentDetail', 'Apartment Detail')}
            </Typography>
          </Box>
          <PropertiesActionBar>
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={backToApartmentList}>
              {apartmentText(dictionary, 'backToApartmentList', 'Back to apartment list')}
            </Button>
            <Button variant="outlined" startIcon={<AutorenewIcon />} disabled={loading} onClick={() => void refresh()}>
              {loading ? commonText(dictionary, 'processing', 'Processing...') : commonText(dictionary, 'refresh', 'Refresh')}
            </Button>
            <PropertyActionGuard href="/properties/unit" action="MODIFY">
              <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => router.push(`/${locale}${propertyPath('unit', admin)}/${apt.id}/edit`)}>
                {commonText(dictionary, 'edit', 'Edit')}
              </Button>
            </PropertyActionGuard>
            <Button variant="outlined" startIcon={<PeopleIcon />} onClick={() => router.push(`/${locale}${propertyPath('unit', admin)}/resident-management?apartment_id=${apt.id}`)}>
              {apartmentText(dictionary, 'residentManagement', 'Resident Management')}
            </Button>
            <PropertyActionGuard href="/properties/unit" action="DELETE">
              <Button variant="outlined" color="error" startIcon={<DeleteOutlineIcon />} onClick={handleDeleteClick}>
                {commonText(dictionary, 'delete', 'Delete')}
              </Button>
            </PropertyActionGuard>
          </PropertiesActionBar>
        </Stack>

        <DetailTabs
          value={activeTab}
          onChange={changeTab}
          ariaLabel={apartmentText(dictionary, 'apartmentDetailTabsLabel', 'Apartment detail tabs')}
          tabs={[
            { value: 'info', label: apartmentText(dictionary, 'apartmentInfo', 'Apartment information'), icon: <InfoOutlinedIcon fontSize="small" /> },
            { value: 'history', label: apartmentText(dictionary, 'apartmentDetailTabHistory', 'Change history'), icon: <HistoryOutlinedIcon fontSize="small" /> }
          ]}
        />

        <Box role="tabpanel" id="detail-tabpanel-info" aria-labelledby="detail-tab-info" hidden={activeTab !== 'info'}>
          <InfoSection title={apartmentText(dictionary, 'apartmentInfo', 'Apartment information')}>
            {apartmentInfoItems.map(item => (
              <Grid key={item.key} size={item.size ?? { xs: 12, sm: 6, md: 4 }} data-apartment-field={item.key}>
                <ApartmentInfoItem icon={item.icon} label={item.label} value={item.value} valueNode={item.valueNode} />
              </Grid>
            ))}
          </InfoSection>
        </Box>

        <Box role="tabpanel" id="detail-tabpanel-history" aria-labelledby="detail-tab-history" hidden={activeTab !== 'history'}>
          {historyOpened && (
            <EntityAuditHistory
              active={historyOpened}
              entityName="Apartment"
              entityId={apt.id}
              dictionary={dictionary}
              locale={locale}
              fieldLabels={auditFieldLabels}
            />
          )}
        </Box>
      </Stack>

      <ApartmentDeleteDialog
        dictionary={dictionary}
        open={apartmentDelete.open}
        deleting={apartmentDelete.deleting}
        error={apartmentDelete.error}
        apartmentCode={apt.apartment_code}
        onCancel={apartmentDelete.cancel}
        onConfirm={() => void apartmentDelete.confirm()}
      />

    </ContentWrapper>
  )
}

export default ApartmentDetailPage
