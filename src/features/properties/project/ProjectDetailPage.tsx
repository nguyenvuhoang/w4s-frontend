'use client'

import { propertyPath } from '../propertyPaths'
import { useEffect, useMemo, useState } from 'react'

import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import ApartmentIcon from '@mui/icons-material/Apartment'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import BusinessIcon from '@mui/icons-material/Business'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ContactPhoneOutlinedIcon from '@mui/icons-material/ContactPhoneOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import EventOutlinedIcon from '@mui/icons-material/EventOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LayersIcon from '@mui/icons-material/Layers'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined'
import PeopleIcon from '@mui/icons-material/People'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import SellOutlinedIcon from '@mui/icons-material/SellOutlined'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Popover,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import NextLink from 'next/link'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { useRouter } from '@shared/hooks/useRouter'

import type { Locale } from '@/configs/i18n'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import PropertiesActionBar from '@/features/properties/components/PropertiesActionBar'
import DetailTabs from '@/shared/components/detail-tabs/DetailTabs'
import EntityAuditHistory from '@/shared/components/entity-audit/EntityAuditHistory'
import type { getDictionary } from '@/shared/utils/getDictionary'
import { PermissionGuard } from '@shared/permissions/PermissionGuard'
import SwalAlert from '@shared/utils/SwalAlert'

import { formatProvinceLabel, type ProvinceLookupItem } from '@/shared/services/provinceLookupService'

import { propertyAggregateService } from '../propertyAggregateService'
import ProjectBankInformationTab from './bank/ProjectBankInformationTab'
import ProjectNotificationTemplatesTab from './notification-templates/ProjectNotificationTemplatesTab'
import ProjectDeleteDialog from './ProjectDeleteDialog'
import { useProjectDelete } from './hooks/useProjectDelete'
import { formatHandoverDate } from './projectDateHelpers'
import {
  PROJECT_BUSINESS_PERMISSION_PATH,
  PROJECT_CONTEXT_BASE_PATH,
  formatProjectCount,
  formatProjectValue,
  type ProjectAccessScope
} from './projectListHelpers'
import type {
  BuildingModel,
  ProjectBuildingModel,
  ProjectBuildingSummaryModel,
  ProjectContactItemModel,
  ProjectDetailModel,
  ProjectSitePlanItem,
  ProjectSitePlanModel,
  PropertyStatus
} from '../types'

type Dictionary = Awaited<ReturnType<typeof getDictionary>>
type ProjectDetailTab = 'info' | 'bank' | 'templates' | 'history'

// Project Type was removed from the Project business/UI; its historical audit changes are not shown.
const PROJECT_AUDIT_HIDDEN_FIELDS = ['ProjectType'] as const
type HoverState = { anchor_el: HTMLElement; item: ProjectSitePlanItem } | null

const defaultProjectImageUrl = '/images/illustrations/building.jpg'
const number_format = new Intl.NumberFormat('vi-VN')

const isSupportedLocale = (value: string): value is Locale => value === 'vi' || value === 'en' || value === 'la'

const text = (dictionary: Dictionary, key: string, fallback: string) => dictionary.projectManagement?.[key] ?? dictionary.propertyManagement?.[key] ?? fallback
const common = (dictionary: Dictionary, key: string, fallback: string) => dictionary.common?.[key] ?? fallback

const statusColor = (status: PropertyStatus) => {
  if (status === 'active') return 'success'
  if (status === 'inactive') return 'error'
  if (status === 'draft' || status === 'paused' || status === 'pending') return 'warning'

  return 'default'
}

const points = (items: Array<{ x: number; y: number }>) => items.map(item => `${item.x},${item.y}`).join(' ')

const getBlockGeometry = (item: ProjectSitePlanItem) => {
  const height = Math.min(Math.max(item.height_level * 4.5, 48), 170)
  const depth_x = item.depth * 0.58
  const depth_y = item.depth * 0.36
  const x = item.position_x
  const y = item.position_y
  const w = item.width

  const t1 = { x, y: y - height }
  const t2 = { x: x + w, y: y - height - depth_y }
  const t3 = { x: x + w + depth_x, y: y - height }
  const t4 = { x: x + depth_x, y: y - height + depth_y }
  const b1 = { x, y }
  const b2 = { x: x + w, y: y - depth_y }
  const b3 = { x: x + w + depth_x, y }
  const b4 = { x: x + depth_x, y: y + depth_y }

  return { top: [t1, t2, t3, t4], front: [t4, t3, b3, b4], left: [t1, t4, b4, b1], right: [t2, t3, b3, b2], shadow: [b1, b2, b3, b4] }
}

const ProjectBuildingBlock3D = ({
  item,
  selected,
  on_hover,
  on_leave,
  on_click,
  on_double_click
}: {
  item: ProjectSitePlanItem
  selected: boolean
  on_hover: (event: React.MouseEvent<SVGGElement>, item: ProjectSitePlanItem) => void
  on_leave: () => void
  on_click: (item: ProjectSitePlanItem) => void
  on_double_click: (item: ProjectSitePlanItem) => void
}) => {
  const geometry = getBlockGeometry(item)
  const label_x = item.position_x + item.width * 0.5 + item.depth * 0.28
  const label_y = item.position_y - Math.min(Math.max(item.height_level * 4.5, 48), 170) - 14

  return (
    <g
      role="button"
      tabIndex={0}
      onMouseEnter={event => on_hover(event, item)}
      onMouseLeave={on_leave}
      onClick={() => on_click(item)}
      onDoubleClick={() => on_double_click(item)}
      style={{ cursor: 'pointer', outline: 'none' }}
    >
      <polygon points={points(geometry.shadow)} fill="rgba(34,80,135,0.12)" transform="translate(18 22)" />
      <polygon points={points(geometry.left)} fill={selected ? '#7FB7DA' : '#A9CCE3'} stroke={selected ? '#225087' : '#6EA8CA'} strokeWidth={selected ? 3 : 1.5} />
      <polygon points={points(geometry.right)} fill={selected ? '#5E9FC9' : '#86B9D7'} stroke={selected ? '#225087' : '#6EA8CA'} strokeWidth={selected ? 3 : 1.5} />
      <polygon points={points(geometry.front)} fill={selected ? '#3F86B3' : '#6FA8CA'} stroke={selected ? '#225087' : '#5F9DBD'} strokeWidth={selected ? 3 : 1.5} />
      <polygon points={points(geometry.top)} fill={selected ? '#DFF3FF' : '#EFF9FF'} stroke={selected ? '#225087' : '#8DC5DF'} strokeWidth={selected ? 3 : 1.5} />
      {Array.from({ length: Math.min(item.total_floors, 18) }).map((_, index) => (
        <line
          key={index}
          x1={geometry.front[0].x + 6}
          y1={geometry.front[0].y + 10 + index * 8}
          x2={geometry.front[2].x - 8}
          y2={geometry.front[2].y + 10 + index * 8}
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={1}
        />
      ))}
      <rect x={label_x - 72} y={label_y - 24} width={144} height={48} rx={8} fill="rgba(255,255,255,0.92)" stroke={selected ? '#225087' : 'rgba(34,80,135,0.18)'} />
      <text x={label_x} y={label_y - 4} textAnchor="middle" fontSize="14" fontWeight="800" fill="#225087">
        {item.building_name}
      </text>
      <text x={label_x} y={label_y + 15} textAnchor="middle" fontSize="11" fontWeight="600" fill="#6D788D">
        {item.total_floors} floors · {item.total_units} units
      </text>
    </g>
  )
}

const ProjectSitePlanCanvas = ({
  dictionary,
  plan,
  selected_code,
  on_select,
  on_hover,
  on_leave,
  on_double_click
}: {
  dictionary: Dictionary
  plan: ProjectSitePlanModel
  selected_code: string
  on_select: (item: ProjectSitePlanItem) => void
  on_hover: (event: React.MouseEvent<SVGGElement>, item: ProjectSitePlanItem) => void
  on_leave: () => void
  on_double_click: (item: ProjectSitePlanItem) => void
}) => (
  <Paper
    sx={{
      p: { xs: 2, md: 3 },
      borderRadius: 2,
      border: 1,
      borderColor: 'divider',
      bgcolor: '#F8FBFF',
      overflowX: 'auto',
      backgroundImage: 'linear-gradient(rgba(34, 80, 135, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 80, 135, 0.06) 1px, transparent 1px)',
      backgroundSize: '28px 28px'
    }}
  >
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.dark' }}>
            {text(dictionary, 'projectSitePlanTitle', 'Project site plan schematic')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {text(dictionary, 'projectSitePlanSubtitle', 'Isometric building layout based on project configuration.')}
          </Typography>
        </Box>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Chip size="small" label={plan.layout_type} />
          <Chip size="small" color="primary" label={plan.site_plan.view_mode} />
        </Stack>
      </Stack>
      <Box sx={{ minWidth: 860, borderRadius: 2, overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${plan.site_plan.canvas_width} ${plan.site_plan.canvas_height}`} width="100%" height="520" role="img">
          <defs>
            <linearGradient id="site-road" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#D9E8F2" />
              <stop offset="100%" stopColor="#BFD7E8" />
            </linearGradient>
          </defs>
          <rect width="1200" height="700" fill="transparent" />
          <path d="M120 570 C290 460 430 520 590 410 C730 310 860 340 1040 230" stroke="url(#site-road)" strokeWidth="42" strokeLinecap="round" fill="none" />
          <path d="M120 570 C290 460 430 520 590 410 C730 310 860 340 1040 230" stroke="rgba(255,255,255,0.72)" strokeWidth="4" strokeDasharray="14 18" fill="none" />
          <ellipse cx="745" cy="515" rx="138" ry="58" fill="rgba(0,100,0,0.08)" stroke="rgba(0,100,0,0.22)" strokeDasharray="8 8" />
          <text x="1050" y="88" textAnchor="middle" fontSize="13" fontWeight="800" fill="#225087">N</text>
          <path d="M1050 104 L1038 138 L1050 130 L1062 138 Z" fill="#225087" opacity="0.72" />
          {[...plan.site_plan.items].sort((left, right) => left.display_order - right.display_order).map(item => (
            <ProjectBuildingBlock3D
              key={item.building_code}
              item={item}
              selected={selected_code === item.building_code}
              on_hover={on_hover}
              on_leave={on_leave}
              on_click={on_select}
              on_double_click={on_double_click}
            />
          ))}
        </svg>
      </Box>
    </Stack>
  </Paper>
)

const BuildingPopover = ({ dictionary, hover }: { dictionary: Dictionary; hover: HoverState }) => (
  <Popover
    open={Boolean(hover)}
    anchorEl={hover?.anchor_el ?? null}
    onClose={() => undefined}
    disableRestoreFocus
    sx={{ pointerEvents: 'none' }}
    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    slotProps={{ paper: { sx: { p: 2, width: 300, borderRadius: 2, boxShadow: '0 18px 48px rgba(34,80,135,0.18)' } } }}
  >
    {hover && (
      <Stack spacing={1.1}>
        <Stack direction="row" justifyContent="space-between" gap={1}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{hover.item.building_name}</Typography>
            <Typography variant="caption" color="text.secondary">{hover.item.building_code}</Typography>
          </Box>
          <Chip size="small" color={statusColor(hover.item.status)} label={text(dictionary, `status${hover.item.status}`, hover.item.status)} />
        </Stack>
        {[
          [text(dictionary, 'totalFloors', 'Total Floors'), number_format.format(hover.item.total_floors)],
          [text(dictionary, 'totalUnits', 'Total Units'), number_format.format(hover.item.total_units)],
          [text(dictionary, 'activeResidents', 'Active Residents'), number_format.format(hover.item.active_residents)],
          [text(dictionary, 'lastModified', 'Last Modified'), hover.item.last_modified]
        ].map(([label, value]) => (
          <Stack key={label} direction="row" justifyContent="space-between" gap={2}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, textAlign: 'right' }}>{value}</Typography>
          </Stack>
        ))}
      </Stack>
    )}
  </Popover>
)

const sortProjectBuildings = (buildings: ProjectBuildingModel[]) => (
  [...buildings].sort((left, right) => {
    const has_left_order = typeof left.display_order === 'number'
    const has_right_order = typeof right.display_order === 'number'

    if (has_left_order && has_right_order) return (left.display_order as number) - (right.display_order as number)
    if (has_left_order) return -1
    if (has_right_order) return 1

    return left.building_id - right.building_id || left.building_code.localeCompare(right.building_code)
  })
)


const BuildingListSection = ({
  dictionary,
  locale,
  buildings,
  admin,
  loading,
  error
}: {
  dictionary: Dictionary
  locale: Locale
  buildings: ProjectBuildingModel[]
  admin: boolean
  loading: boolean
  error: string | null
}) => {
  const sorted_buildings = useMemo(() => sortProjectBuildings(buildings), [buildings])

  return (
    <Paper sx={{ borderRadius: 2, border: 1, borderColor: 'divider', overflow: 'hidden' }}>
      <Box sx={{ p: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main' }}>{text(dictionary, 'buildingList', 'Building list')}</Typography>
        <Typography variant="body2" color="text.secondary">{text(dictionary, 'buildingListSubtitle', 'Buildings configured under this project.')}</Typography>
      </Box>
      {loading ? (
        <Box sx={{ p: 3 }}>
          <Skeleton variant="rounded" height={160} />
        </Box>
      ) : error ? (
        <Box sx={{ p: 3, pt: 0 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      ) : sorted_buildings.length === 0 ? (
        <Box sx={{ p: 5, textAlign: 'center' }}>
          <BusinessIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>{text(dictionary, 'noBuildings', 'No buildings yet')}</Typography>
          <Typography variant="body2" color="text.secondary">{text(dictionary, 'noBuildingsDescription', 'This project has no buildings configured.')}</Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {[text(dictionary, 'buildingName', 'Building Name'), text(dictionary, 'buildingCode', 'Building Code'), text(dictionary, 'totalFloors', 'Total Floors'), text(dictionary, 'totalUnits', 'Total Units'), text(dictionary, 'activeResidents', 'Active Residents'), common(dictionary, 'status', 'Status'), common(dictionary, 'actions', 'Actions')].map(label => (
                  <TableCell key={label} sx={{ fontWeight: 800 }}>{label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted_buildings.map((building, index) => {
                const building_id = building.building_id ?? building.id
                const can_view_detail = Boolean(building_id) && Number(building_id) > 0

                return (
                  <TableRow key={`${building.building_code || building.building_id}-${index}`} hover>
                  <TableCell sx={{ fontWeight: 800 }}>{building.name}</TableCell>
                  <TableCell>{building.building_code}</TableCell>
                  <TableCell>{number_format.format(building.floor_count ?? 0)}</TableCell>
                  <TableCell>{formatProjectCount(building.total_apartments)}</TableCell>
                  <TableCell>{formatProjectCount(building.active_residents)}</TableCell>
                  <TableCell><Chip size="small" color={statusColor(building.status)} label={text(dictionary, `status${building.status}`, building.status)} /></TableCell>
                  <TableCell>
                    {can_view_detail ? (
                      <Button
                        size="small"
                        component={NextLink}
                        href={`/${locale}${propertyPath('building', admin)}/${building_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {text(dictionary, 'viewDetail', 'View Detail')}
                      </Button>
                    ) : (
                      <Button size="small" disabled>
                        {text(dictionary, 'buildingIdUnavailable', 'Chưa có ID')}
                      </Button>
                    )}
                  </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  )
}

const sortProjectContacts = (contacts: ProjectContactItemModel[]) => (
  [...contacts].sort((left, right) => {
    const has_left_order = typeof left.display_order === 'number'
    const has_right_order = typeof right.display_order === 'number'

    if (has_left_order && has_right_order) return (left.display_order as number) - (right.display_order as number)
    if (has_left_order) return -1
    if (has_right_order) return 1

    return 0
  })
)

const projectContactTypeIcon = (contact_type: string) => {
  const normalized = (contact_type || '').trim().toUpperCase()

  if (normalized === 'MANAGEMENT') return <GroupsOutlinedIcon fontSize="small" />
  if (normalized === 'SECURITY') return <ShieldOutlinedIcon fontSize="small" />
  if (normalized === 'EMERGENCY') return <ReportProblemOutlinedIcon fontSize="small" />

  return <ContactPhoneOutlinedIcon fontSize="small" />
}

const projectContactTypeLabel = (dictionary: Dictionary, contact_type: string) => {
  const normalized = (contact_type || '').trim().toUpperCase()

  if (normalized === 'MANAGEMENT') return text(dictionary, 'contactmanagement_board', 'Management Board')
  if (normalized === 'SECURITY') return text(dictionary, 'contactsecurity', 'Security')
  if (normalized === 'EMERGENCY') return text(dictionary, 'contactemergency', 'Emergency')

  return contact_type || text(dictionary, 'contactOther', 'Other')
}

const ProjectContactDetailRow = ({ icon, value }: { icon: React.ReactNode; value: React.ReactNode }) => (
  <Stack direction="row" spacing={0.75} alignItems="flex-start">
    <Box sx={{ color: 'text.secondary', display: 'inline-flex', mt: '2px' }}>{icon}</Box>
    <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
      {value}
    </Typography>
  </Stack>
)

const ProjectContactCard = ({ dictionary, contact }: { dictionary: Dictionary; contact: ProjectContactItemModel }) => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: 'divider' }}>
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
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
        {projectContactTypeIcon(contact.contact_type)}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap">
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            {contact.name || '-'}
          </Typography>
          <Chip size="small" label={projectContactTypeLabel(dictionary, contact.contact_type)} />
        </Stack>
        <Stack spacing={0.5} sx={{ mt: 1 }}>
          {contact.phone && <ProjectContactDetailRow icon={<PhoneOutlinedIcon fontSize="inherit" />} value={contact.phone} />}
          {contact.email && <ProjectContactDetailRow icon={<EmailOutlinedIcon fontSize="inherit" />} value={contact.email} />}
          {contact.address && <ProjectContactDetailRow icon={<LocationOnOutlinedIcon fontSize="inherit" />} value={contact.address} />}
          {contact.working_hours && <ProjectContactDetailRow icon={<AccessTimeOutlinedIcon fontSize="inherit" />} value={contact.working_hours} />}
          {contact.note && <ProjectContactDetailRow icon={<DescriptionOutlinedIcon fontSize="inherit" />} value={contact.note} />}
        </Stack>
      </Box>
    </Stack>
  </Paper>
)

const ProjectContactsSection = ({
  dictionary,
  contacts,
  loading,
  error
}: {
  dictionary: Dictionary
  contacts: ProjectContactItemModel[]
  loading: boolean
  error: string | null
}) => {
  const sorted_contacts = useMemo(() => sortProjectContacts(contacts), [contacts])

  return (
    <Paper sx={{ p: 2.5, borderRadius: 2, border: 1, borderColor: 'divider', height: '100%' }}>
      <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main' }}>{text(dictionary, 'projectContacts', 'Project Contacts')}</Typography>
      {loading ? (
        <Box sx={{ mt: 2 }}>
          <Skeleton variant="rounded" height={160} />
        </Box>
      ) : error ? (
        <Box sx={{ mt: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      ) : sorted_contacts.length === 0 ? (
        <Box sx={{ mt: 2, textAlign: 'center', py: 3 }}>
          <ContactPhoneOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{text(dictionary, 'noProjectContacts', 'No project contacts yet')}</Typography>
          <Typography variant="caption" color="text.secondary">{text(dictionary, 'noProjectContactsDescription', 'This project has no contact information configured.')}</Typography>
        </Box>
      ) : (
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          {sorted_contacts.map((contact, index) => (
            <ProjectContactCard key={`${contact.contact_type}-${contact.phone ?? contact.name}-${index}`} dictionary={dictionary} contact={contact} />
          ))}
        </Stack>
      )}
    </Paper>
  )
}

const ProjectInfoItem = ({
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

/**
 * Project-level aggregates of WF_BO_GET_PROJECT_DETAIL (response root, next to `project`). Shown as returned:
 * an explicit 0 stays 0, only a missing value is "--"; no fallback to other sources, and active residents are
 * never taken from total residents.
 */
export const projectDetailMetrics = (dictionary: Dictionary, project: ProjectDetailModel) => [
  { key: 'total_buildings', label: text(dictionary, 'totalBuildings', 'Total towers'), value: project.total_buildings, icon: <BusinessIcon /> },
  { key: 'total_floors', label: text(dictionary, 'totalFloors', 'Total floors'), value: project.total_floors, icon: <LayersIcon /> },
  { key: 'total_apartments', label: text(dictionary, 'totalApartments', 'Total apartments'), value: project.total_apartments, icon: <ApartmentIcon /> },
  { key: 'total_residents', label: text(dictionary, 'totalResidents', 'Total residents'), value: project.total_residents, icon: <GroupsOutlinedIcon /> },
  { key: 'active_residents', label: text(dictionary, 'activeResidents', 'Active residents'), value: project.active_residents, icon: <PeopleIcon /> },
  { key: 'inactive_residents', label: text(dictionary, 'inactiveResidents', 'Inactive residents'), value: project.inactive_residents, icon: <PeopleIcon /> }
]

const ProjectOverviewSection = ({
  dictionary,
  project,
  provinceLabel
}: {
  dictionary: Dictionary
  project: ProjectDetailModel
  /** Province name resolved from the master; the raw stored value is shown when it could not be resolved. */
  provinceLabel?: string | null
}) => {
  const project_image_url = project.logo_url?.trim() || defaultProjectImageUrl
  const project_status_label = project.status === 'active'
    ? text(dictionary, 'statusProjectActive', 'Active')
    : text(dictionary, 'statusProjectInactive', 'Inactive')

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Paper sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', height: '100%' }}>
          <Box sx={{ height: 210, borderRadius: 1.5, bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <Box component="img" src={project_image_url} alt={project.name} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </Box>
        </Paper>
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <Grid container spacing={1.5}>
          {/* 6 metrics: 3 per row on tablet/desktop (3 x 2), 2 per row on mobile. */}
          {projectDetailMetrics(dictionary, project).map(metric => (
            <Grid key={metric.key} size={{ xs: 6, sm: 4 }}>
              <Paper sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', height: '100%' }} data-metric={metric.key}>
                <Stack direction="row" gap={1} alignItems="center">
                  <Box sx={{ color: 'primary.main', display: 'inline-flex' }}>{metric.icon}</Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{formatProjectCount(metric.value)}</Typography>
                    <Typography variant="caption" color="text.secondary">{metric.label}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
          <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ProjectInfoItem
                  icon={<SellOutlinedIcon fontSize="small" />}
                  label={text(dictionary, 'projectCode', 'Project Code')}
                  value={project.project_code}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ProjectInfoItem
                  icon={<LocationOnOutlinedIcon fontSize="small" />}
                  label={text(dictionary, 'province', 'Province/City')}
                  value={formatProjectValue(provinceLabel || project.province)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ProjectInfoItem
                  icon={<LocationOnOutlinedIcon fontSize="small" />}
                  label={text(dictionary, 'address', 'Address')}
                  value={formatProjectValue(project.address)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ProjectInfoItem
                  icon={<BusinessIcon fontSize="small" />}
                  label={text(dictionary, 'investor', 'Investor')}
                  value={formatProjectValue(project.investor)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ProjectInfoItem
                  icon={<CheckCircleOutlineIcon fontSize="small" />}
                  label={common(dictionary, 'status', 'Status')}
                  valueNode={
                    <Chip
                      size="small"
                      color={statusColor(project.status)}
                      label={project_status_label}
                      sx={{ mt: 0.5, fontWeight: 700 }}
                    />
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ProjectInfoItem
                  icon={<DescriptionOutlinedIcon fontSize="small" />}
                  label={common(dictionary, 'description', 'Description')}
                  value={formatProjectValue(project.description)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ProjectInfoItem
                  icon={<EventOutlinedIcon fontSize="small" />}
                  label={text(dictionary, 'handoverDate', 'Handover date')}
                  value={formatHandoverDate(project.handover_date)}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  )
}

const ProjectDetailPage = ({
  dictionary,
  projectId,
  initialProject,
  initialError,
  initialBuildings,
  initialBuildingsError,
  initialContacts,
  initialContactsError,
  initialProvince = null,
  listHref = PROJECT_CONTEXT_BASE_PATH,
  accessScope = 'business'
}: {
  dictionary: Dictionary
  projectId: number
  initialProject: ProjectDetailModel | null
  initialError?: string | null
  initialBuildings?: ProjectBuildingModel[]
  /** Totals of the building workflow; not used for the project metrics (they come from the detail response). */
  initialBuildingSummary?: ProjectBuildingSummaryModel
  initialBuildingsError?: string | null
  initialContacts?: ProjectContactItemModel[]
  initialContactsError?: string | null
  /** Where "Back to list" goes: the business project screen, or System Settings > Project Management. */
  listHref?: string
  /** Master row of the stored `province` (resolved by the server route), for the province name. */
  initialProvince?: ProvinceLookupItem | null
  /** business: Modify follows the business Project MODIFY right; admin: System Settings boundary already passed. */
  accessScope?: ProjectAccessScope
}) => {
  const router = useRouter()
  const params = useParams<{ locale: string }>()
  const locale: Locale = isSupportedLocale(params.locale) ? params.locale : 'vi'

  // Loaded by the server route; after an edit the Edit page returns here and the route reloads it.
  const project = initialProject
  const detailError = initialError ?? null
  const [activeTab, setActiveTab] = useState<ProjectDetailTab>('info')
  // The change history is only fetched once its tab is opened, then kept mounted so switching tabs
  // does not refetch it (a different project id still reloads it).
  const [historyOpened, setHistoryOpened] = useState(false)
  // Same lazy pattern for the notification templates (System Settings detail only).
  const [templatesOpened, setTemplatesOpened] = useState(false)

  const changeTab = (tab: ProjectDetailTab) => {
    setActiveTab(tab)
    if (tab === 'history') setHistoryOpened(true)
    if (tab === 'templates') setTemplatesOpened(true)
  }

  // Buildings/contacts are loaded by the server page; the manual "Refresh" action was removed from this screen.
  const projectBuildings = useMemo<ProjectBuildingModel[]>(() => initialBuildings ?? [], [initialBuildings])
  const projectBuildingsError = initialBuildingsError ?? null
  const projectContacts: ProjectContactItemModel[] = initialContacts ?? []
  const projectContactsError = initialContactsError ?? null

  const [buildings, setBuildings] = useState<BuildingModel[]>([])
  const [sitePlan, setSitePlan] = useState<ProjectSitePlanModel | null>(null)
  const [selectedBuildingCode, setSelectedBuildingCode] = useState('')
  const [hover, setHover] = useState<HoverState>(null)
  const [sectionsLoading, setSectionsLoading] = useState(true)

  const selectedBuilding = useMemo(() => buildings.find(building => building.building_code === selectedBuildingCode) ?? buildings[0] ?? null, [buildings, selectedBuildingCode])


  const loadSections = async (project_code: string) => {
    setSectionsLoading(true)

    try {
      const [building_data, site_plan_data] = await Promise.all([
        propertyAggregateService.get_project_buildings(project_code),
        propertyAggregateService.get_project_site_plan(project_code)
      ])

      setBuildings(building_data)
      setSitePlan(site_plan_data)
      setSelectedBuildingCode(current => current || building_data[0]?.building_code || '')
    } finally {
      setSectionsLoading(false)
    }
  }

  useEffect(() => {
    if (project?.project_code) {
      void loadSections(project.project_code)
    } else {
      setSectionsLoading(false)
    }
  }, [project?.project_code])

  // Edit is a dedicated page (`.../:id/edit`), no longer a dialog.
  const openEditPage = () => router.push(`/${locale}${listHref}/${projectId}/edit`)

  const { data: session } = useSession()

  // WF_BO_DELETE_PROJECT with the route project id; leave for the list (reloaded by its server route)
  // only after the user closes the success alert. Failures stay in the dialog on this page.
  const projectDelete = useProjectDelete({
    projectId,
    sessiontoken: session?.user?.token ?? undefined,
    language: locale,
    fallbackError: text(dictionary, 'deleteProjectFailed', 'Unable to delete project.'),
    onDeleted: () => {
      SwalAlert(
        'success',
        text(dictionary, 'deleteProjectSuccess', 'Project deleted successfully.'),
        'center',
        false,
        false,
        true,
        () => {
          router.push(`/${locale}${listHref}`)
          router.refresh()
        }
      )
    }
  })

  if (detailError || !project) {
    return (
      <ContentWrapper title={text(dictionary, 'projectDetail', 'Project Detail')} description="" icon={<BusinessIcon sx={{ fontSize: 40, color: 'primary.main' }} />} dictionary={dictionary}>
        <Stack spacing={2} sx={{ mt: 3, alignItems: 'flex-start' }}>
          <Alert severity="error" sx={{ width: '100%' }}>{detailError || text(dictionary, 'projectNotFound', 'Project not found.')}</Alert>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(`/${locale}${listHref}`)}>
            {text(dictionary, 'backToProjectList', 'Back to list')}
          </Button>
        </Stack>
      </ContentWrapper>
    )
  }

  const deleteButton = (
    <Button variant="outlined" color="error" startIcon={<DeleteOutlineIcon />} disabled={projectDelete.deleting} onClick={projectDelete.requestDelete}>
      {text(dictionary, 'deleteProject', 'Delete project')}
    </Button>
  )

  return (
    <ContentWrapper
      title={project.name}
      description={`${project.project_code} · ${project.address?.trim() || text(dictionary, 'addressNotUpdated', 'Not updated')}`}
      icon={<BusinessIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <Stack spacing={3.5} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {text(dictionary, 'propertyBreadcrumb', 'Properties / Project / Project detail')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.dark', mt: 0.5 }}>
              {text(dictionary, 'projectDetail', 'Project Detail')}
            </Typography>
          </Box>
          <PropertiesActionBar>
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(`/${locale}${listHref}`)}>
              {text(dictionary, 'backToProjectList', 'Back to list')}
            </Button>
            {accessScope === 'admin' ? (
              <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={openEditPage}>{common(dictionary, 'edit', 'Edit')}</Button>
            ) : (
              <PermissionGuard href={PROJECT_BUSINESS_PERMISSION_PATH} action="MODIFY">
                <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={openEditPage}>{common(dictionary, 'edit', 'Edit')}</Button>
              </PermissionGuard>
            )}
            {accessScope === 'admin' ? (
              deleteButton
            ) : (
              <PermissionGuard href={PROJECT_BUSINESS_PERMISSION_PATH} action="DELETE">
                {deleteButton}
              </PermissionGuard>
            )}
          </PropertiesActionBar>
        </Stack>

        <DetailTabs
          value={activeTab}
          onChange={changeTab}
          ariaLabel={text(dictionary, 'detailTabsLabel', 'Project detail tabs')}
          tabs={[
            { value: 'info', label: text(dictionary, 'detailTabInfo', 'Project information'), icon: <InfoOutlinedIcon fontSize="small" /> },
            // Bank configuration of the project: System Settings (admin) detail only; the business detail keeps 2 tabs.
            ...(accessScope === 'admin'
              ? [
                  { value: 'bank' as const, label: text(dictionary, 'bankInformation', 'Bank information'), icon: <AccountBalanceOutlinedIcon fontSize="small" /> },
                  { value: 'templates' as const, label: text(dictionary, 'notificationTemplatesTab', 'Notification templates'), icon: <MarkEmailReadOutlinedIcon fontSize="small" /> }
                ]
              : []),
            { value: 'history', label: text(dictionary, 'detailTabHistory', 'Change history'), icon: <HistoryOutlinedIcon fontSize="small" /> }
          ]}
        />

        <Box role="tabpanel" id="detail-tabpanel-info" aria-labelledby="detail-tab-info" hidden={activeTab !== 'info'}>
          <Stack spacing={3.5}>
            <ProjectOverviewSection dictionary={dictionary} project={project} provinceLabel={initialProvince ? formatProvinceLabel(initialProvince, locale) : null} />

            {sectionsLoading ? (
              <Skeleton variant="rounded" height={420} />
            ) : sitePlan && sitePlan.site_plan.items.length > 0 ? (
              <Grid container spacing={2.5} alignItems="stretch">
                <Grid size={{ xs: 12, lg: 8.5 }}>
                  <ProjectSitePlanCanvas
                    dictionary={dictionary}
                    plan={sitePlan}
                    selected_code={selectedBuilding?.building_code ?? ''}
                    on_select={item => setSelectedBuildingCode(item.building_code)}
                    on_hover={(event, item) => setHover({ anchor_el: event.currentTarget as unknown as HTMLElement, item })}
                    on_leave={() => setHover(null)}
                    on_double_click={item => router.push(`/${locale}${propertyPath('floor', listHref === '/system-settings/projects')}?project_code=${project.project_code}&building_code=${item.building_code}`)}
                  />
                </Grid>
                <Grid size={{ xs: 12, lg: 3.5 }}>
                  <Paper sx={{ p: 2.5, borderRadius: 2, border: 1, borderColor: 'divider', height: '100%' }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main' }}>
                      {selectedBuilding?.building_name ?? text(dictionary, 'buildingDetail', 'Building Detail')}
                    </Typography>
                    {selectedBuilding && (
                      <Stack spacing={1.5} sx={{ mt: 2 }}>
                        {[
                          [text(dictionary, 'buildingCode', 'Building Code'), selectedBuilding.building_code],
                          [text(dictionary, 'totalFloors', 'Total Floors'), number_format.format(selectedBuilding.total_floors)],
                          [text(dictionary, 'totalUnits', 'Total Units'), number_format.format(selectedBuilding.total_units)],
                          [text(dictionary, 'activeResidents', 'Active Residents'), number_format.format(selectedBuilding.active_residents)]
                        ].map(([label, value]) => (
                          <Stack key={label} direction="row" justifyContent="space-between" gap={2}>
                            <Typography variant="body2" color="text.secondary">{label}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, textAlign: 'right' }}>{value}</Typography>
                          </Stack>
                        ))}
                        <Chip color={statusColor(selectedBuilding.status)} label={text(dictionary, `status${selectedBuilding.status}`, selectedBuilding.status)} sx={{ alignSelf: 'flex-start' }} />
                        <Divider />
                        <Button variant="contained" startIcon={<VisibilityOutlinedIcon />}>{text(dictionary, 'viewBuildingDetail', 'View building detail')}</Button>
                        <Button variant="outlined" startIcon={<LayersIcon />} onClick={() => router.push(`/${locale}${propertyPath('floor', listHref === '/system-settings/projects')}?project_code=${project.project_code}&building_code=${selectedBuilding.building_code}`)}>{text(dictionary, 'manageFloors', 'Manage Floors')}</Button>
                        <Button variant="outlined" startIcon={<ApartmentIcon />} onClick={() => router.push(`/${locale}/properties/stacking-plan`)}>{text(dictionary, 'viewStackingPlan', 'View stacking plan')}</Button>
                        <Button variant="text" startIcon={<EditOutlinedIcon />}>{text(dictionary, 'editBuilding', 'Edit Building')}</Button>
                      </Stack>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            ) : null}

            <BuildingListSection
              admin={listHref === '/system-settings/projects'}
              dictionary={dictionary}
              locale={locale as Locale}
              buildings={projectBuildings}
              loading={false}
              error={projectBuildingsError}
            />

            <ProjectContactsSection
              dictionary={dictionary}
              contacts={projectContacts}
              loading={false}
              error={projectContactsError}
            />
          </Stack>
        </Box>

        {accessScope === 'admin' && (
          <Box role="tabpanel" id="detail-tabpanel-bank" aria-labelledby="detail-tab-bank" hidden={activeTab !== 'bank'}>
            {/* Project identity from this detail route (never the working project context). */}
            <ProjectBankInformationTab
              dictionary={dictionary}
              project={{ id: project.id, name: project.name, code: project.project_code }}
              accounts={{ operating_bank_account: project.operating_bank_account, deposit_bank_account: project.deposit_bank_account }}
              mode="manage"
            />
          </Box>
        )}

        {accessScope === 'admin' && (
          <Box role="tabpanel" id="detail-tabpanel-templates" aria-labelledby="detail-tab-templates" hidden={activeTab !== 'templates'}>
            {templatesOpened && (
              <ProjectNotificationTemplatesTab
                dictionary={dictionary}
                locale={locale}
                project={{ id: projectId, name: project.name, code: project.project_code }}
              />
            )}
          </Box>
        )}

        <Box role="tabpanel" id="detail-tabpanel-history" aria-labelledby="detail-tab-history" hidden={activeTab !== 'history'}>
          {historyOpened && (
            <EntityAuditHistory active={historyOpened} entityName="Project" entityId={project.id} dictionary={dictionary} locale={locale} hiddenFields={PROJECT_AUDIT_HIDDEN_FIELDS} />
          )}
        </Box>
      </Stack>

      <BuildingPopover dictionary={dictionary} hover={hover} />

      <ProjectDeleteDialog
        open={projectDelete.open}
        deleting={projectDelete.deleting}
        error={projectDelete.error}
        labels={{
          title: text(dictionary, 'deleteProjectConfirmTitle', 'Confirm project deletion'),
          message: text(dictionary, 'deleteProjectConfirmMessage', 'Are you sure you want to delete this project? This action may not be undone.'),
          cancel: common(dictionary, 'cancel', 'Cancel'),
          confirm: text(dictionary, 'deleteProject', 'Delete project'),
          processing: common(dictionary, 'processing', 'Processing...')
        }}
        onCancel={projectDelete.cancel}
        onConfirm={() => void projectDelete.confirm()}
      />

    </ContentWrapper>
  )
}

export default ProjectDetailPage
