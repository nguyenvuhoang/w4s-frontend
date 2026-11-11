'use client'

import { useEffect, useMemo, useState } from 'react'

import ApartmentIcon from '@mui/icons-material/Apartment'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import BuildIcon from '@mui/icons-material/Build'
import DoorSlidingIcon from '@mui/icons-material/DoorSliding'
import DownloadIcon from '@mui/icons-material/Download'
import ElevatorIcon from '@mui/icons-material/Elevator'
import GridViewIcon from '@mui/icons-material/GridView'
import HistoryIcon from '@mui/icons-material/History'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import PeopleIcon from '@mui/icons-material/People'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import SearchIcon from '@mui/icons-material/Search'
import StairsIcon from '@mui/icons-material/Stairs'
import ViewComfyIcon from '@mui/icons-material/ViewComfy'
import ViewListIcon from '@mui/icons-material/ViewList'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Popover,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import type { getDictionary } from '@/shared/utils/getDictionary'

import { propertyAggregateService } from '../propertyAggregateService'
import type {
  ApartmentDetailModel,
  ApartmentStatus,
  FloorPlanApartmentItem,
  FloorPlanFacilityItem,
  FloorPlanLayoutItem,
  FloorPlanSummary,
  StackingPlanFilterModel,
  StackingPlanFloorModel,
  StackingPlanModel
} from '../types'

type Dictionary = Awaited<ReturnType<typeof getDictionary>>
type ViewMode = 'floor_plan' | 'list'
type HoverState = { anchor_el: HTMLElement; item: FloorPlanApartmentItem; floor: StackingPlanFloorModel } | null

const text = (dictionary: Dictionary, key: string, fallback: string) => dictionary.propertyManagement?.[key] ?? fallback
const common = (dictionary: Dictionary, key: string, fallback: string) => dictionary.common?.[key] ?? fallback

const empty_filter: StackingPlanFilterModel = {
  project_code: 'PRJ_IPS_CENTRAL',
  building_code: 'TOWER_A',
  floor_code: '',
  apartment_status: 'all',
  keyword: ''
}

const apartment_status_options: StackingPlanFilterModel['apartment_status'][] = ['all', 'occupied', 'vacant', 'handed_over', 'locked']
const currency_format = new Intl.NumberFormat('vi-VN')

const status_style_map: Record<ApartmentStatus, { border: string; background: string; chip_color: 'success' | 'default' | 'info' | 'error'; accent: string }> = {
  occupied: {
    border: '#006400',
    background: 'rgba(0, 100, 0, 0.08)',
    chip_color: 'success',
    accent: '#006400'
  },
  vacant: {
    border: '#9CA3AF',
    background: 'rgba(156, 163, 175, 0.16)',
    chip_color: 'default',
    accent: '#6B7280'
  },
  handed_over: {
    border: '#0288D1',
    background: 'rgba(2, 136, 209, 0.09)',
    chip_color: 'info',
    accent: '#0288D1'
  },
  locked: {
    border: '#D32F2F',
    background: 'rgba(211, 47, 47, 0.09)',
    chip_color: 'error',
    accent: '#D32F2F'
  }
}

const facility_meta_map: Record<FloorPlanFacilityItem['item_type'], { icon: React.ReactNode; label: string }> = {
  elevator: { icon: <ElevatorIcon fontSize="small" />, label: 'Elevator' },
  stair: { icon: <StairsIcon fontSize="small" />, label: 'Stair' },
  technical: { icon: <BuildIcon fontSize="small" />, label: 'Technical' },
  service: { icon: <LocalFireDepartmentIcon fontSize="small" />, label: 'Service' },
  corridor: { icon: <DoorSlidingIcon fontSize="small" />, label: 'Corridor' }
}

const summarizePlan = (plan: StackingPlanModel | null): FloorPlanSummary =>
  (plan?.floors ?? []).reduce(
    (summary, floor) => ({
      total_units: summary.total_units + floor.summary.total_units,
      occupied_units: summary.occupied_units + floor.summary.occupied_units,
      vacant_units: summary.vacant_units + floor.summary.vacant_units,
      handed_over_units: summary.handed_over_units + floor.summary.handed_over_units,
      locked_units: summary.locked_units + floor.summary.locked_units,
      qr_enabled_units: summary.qr_enabled_units + floor.summary.qr_enabled_units
    }),
    {
      total_units: 0,
      occupied_units: 0,
      vacant_units: 0,
      handed_over_units: 0,
      locked_units: 0,
      qr_enabled_units: 0
    }
  )

const StackingPlanFilter = ({
  dictionary,
  filter,
  project_options,
  building_options,
  floor_options,
  view_mode,
  on_filter_change,
  on_view_mode_change,
  on_refresh
}: {
  dictionary: Dictionary
  filter: StackingPlanFilterModel
  project_options: ReturnType<typeof propertyAggregateService.get_project_options>
  building_options: ReturnType<typeof propertyAggregateService.get_building_options>
  floor_options: ReturnType<typeof propertyAggregateService.get_floor_options>
  view_mode: ViewMode
  on_filter_change: (filter: StackingPlanFilterModel) => void
  on_view_mode_change: (mode: ViewMode) => void
  on_refresh: () => void
}) => (
  <Paper
    sx={{
      p: { xs: 2, md: 2.5 },
      borderRadius: 2,
      border: 1,
      borderColor: 'divider',
      boxShadow: '0 12px 30px rgba(34, 80, 135, 0.08)'
    }}
  >
    <Grid container spacing={2} alignItems="center">
      <Grid size={{ xs: 12, sm: 6, lg: 2.2 }}>
        <TextField
          fullWidth
          select
          size="small"
          label={text(dictionary, 'project', 'Project')}
          value={filter.project_code}
          onChange={event => on_filter_change({ ...filter, project_code: event.target.value, building_code: '', floor_code: '' })}
        >
          {project_options.map(project => (
            <MenuItem key={project.project_code} value={project.project_code}>
              {project.project_name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
        <TextField
          fullWidth
          select
          size="small"
          label={text(dictionary, 'building', 'Building')}
          value={filter.building_code}
          onChange={event => on_filter_change({ ...filter, building_code: event.target.value, floor_code: '' })}
        >
          {building_options.map(building => (
            <MenuItem key={building.building_code} value={building.building_code}>
              {building.building_name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 1.7 }}>
        <TextField
          fullWidth
          select
          size="small"
          label={text(dictionary, 'floor', 'Floor')}
          value={filter.floor_code}
          onChange={event => on_filter_change({ ...filter, floor_code: event.target.value })}
        >
          <MenuItem value="">{text(dictionary, 'allFloors', 'All floors')}</MenuItem>
          {floor_options.map(floor => (
            <MenuItem key={floor.floor_code} value={floor.floor_code}>
              {floor.floor_name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 1.8 }}>
        <TextField
          fullWidth
          select
          size="small"
          label={text(dictionary, 'apartmentStatus', 'Apartment Status')}
          value={filter.apartment_status}
          onChange={event => on_filter_change({ ...filter, apartment_status: event.target.value as StackingPlanFilterModel['apartment_status'] })}
        >
          {apartment_status_options.map(option => (
            <MenuItem key={option} value={option}>
              {text(dictionary, `status${option}`, option)}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, lg: 2.3 }}>
        <TextField
          fullWidth
          size="small"
          label={common(dictionary, 'search', 'Search')}
          placeholder={text(dictionary, 'apartmentSearchPlaceholder', 'Search full apartment code or owner')}
          value={filter.keyword}
          onChange={event => on_filter_change({ ...filter, keyword: event.target.value })}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
        />
      </Grid>
      <Grid size={{ xs: 12, lg: 2 }}>
        <Stack direction="row" spacing={1} justifyContent={{ xs: 'stretch', lg: 'flex-end' }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={view_mode}
            onChange={(_, value: ViewMode | null) => value && on_view_mode_change(value)}
            sx={{ '& .MuiToggleButton-root': { px: 1.25 } }}
          >
            <ToggleButton value="floor_plan">
              <ViewComfyIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="list">
              <ViewListIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
          <Button variant="outlined" size="small" startIcon={<AutorenewIcon />} onClick={on_refresh}>
            {common(dictionary, 'refresh', 'Refresh')}
          </Button>
        </Stack>
      </Grid>
    </Grid>
  </Paper>
)

const StackingPlanSummary = ({ dictionary, summary }: { dictionary: Dictionary; summary: FloorPlanSummary }) => {
  const items = [
    { label: text(dictionary, 'totalUnits', 'Total units'), value: summary.total_units, icon: <HomeWorkIcon fontSize="small" />, color: 'primary.main' },
    { label: text(dictionary, 'statusoccupied', 'Occupied'), value: summary.occupied_units, icon: <PeopleIcon fontSize="small" />, color: 'success.main' },
    { label: text(dictionary, 'statusvacant', 'Vacant'), value: summary.vacant_units, icon: <ApartmentIcon fontSize="small" />, color: 'text.secondary' },
    { label: text(dictionary, 'statushanded_over', 'Handed over'), value: summary.handed_over_units, icon: <DoorSlidingIcon fontSize="small" />, color: 'info.main' },
    { label: text(dictionary, 'statuslocked', 'Locked'), value: summary.locked_units, icon: <LocalFireDepartmentIcon fontSize="small" />, color: 'error.main' },
    { label: text(dictionary, 'qrEnabled', 'QR enabled'), value: summary.qr_enabled_units, icon: <QrCode2Icon fontSize="small" />, color: 'primary.dark' }
  ]

  return (
    <Grid container spacing={1.5}>
      {items.map(item => (
        <Grid key={item.label} size={{ xs: 6, sm: 4, lg: 2 }}>
          <Paper sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ color: item.color, display: 'inline-flex' }}>{item.icon}</Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {item.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {item.label}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  )
}

const FloorPlanLegend = ({ dictionary }: { dictionary: Dictionary }) => (
  <Stack direction="row" gap={1.5} flexWrap="wrap">
    {(['occupied', 'vacant', 'handed_over', 'locked'] as ApartmentStatus[]).map(status => (
      <Stack key={status} direction="row" gap={0.75} alignItems="center">
        <Box sx={{ width: 14, height: 14, borderRadius: 0.75, bgcolor: status_style_map[status].background, border: 1.5, borderColor: status_style_map[status].border }} />
        <Typography variant="caption">{text(dictionary, `status${status}`, status)}</Typography>
      </Stack>
    ))}
    <Stack direction="row" gap={0.75} alignItems="center">
      <QrCode2Icon sx={{ fontSize: 15, color: 'primary.main' }} />
      <Typography variant="caption">{text(dictionary, 'qrEnabled', 'QR enabled')}</Typography>
    </Stack>
  </Stack>
)

const ApartmentBlock = ({
  dictionary,
  item,
  selected,
  on_hover,
  on_leave,
  on_click
}: {
  dictionary: Dictionary
  item: FloorPlanApartmentItem
  selected: boolean
  on_hover: (event: React.MouseEvent<HTMLElement>, item: FloorPlanApartmentItem) => void
  on_leave: () => void
  on_click: (item: FloorPlanApartmentItem) => void
}) => {
  const styles = status_style_map[item.status]

  return (
    <Box
      component="button"
      type="button"
      onMouseEnter={event => on_hover(event, item)}
      onMouseLeave={on_leave}
      onClick={() => on_click(item)}
      sx={{
        minHeight: 116,
        minWidth: { xs: 158, sm: 172 },
        p: 1.5,
        textAlign: 'left',
        borderRadius: 1.5,
        border: 2,
        borderColor: selected ? 'primary.main' : styles.border,
        bgcolor: styles.background,
        cursor: 'pointer',
        color: 'text.primary',
        boxShadow: selected ? '0 16px 38px rgba(34, 80, 135, 0.18)' : 'none',
        transition: theme => theme.transitions.create(['transform', 'box-shadow', 'border-color'], { duration: 180 }),
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 14px 34px rgba(34, 80, 135, 0.14)'
        },
        '&:focus-visible': {
          outline: '3px solid',
          outlineColor: 'primary.light',
          outlineOffset: 2
        }
      }}
    >
      <Stack spacing={1} sx={{ height: '100%' }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>
              {item.apartment_code}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {item.area} m2
            </Typography>
          </Box>
          <Stack direction="row" gap={0.5}>
            {item.owner_name && <PeopleIcon sx={{ fontSize: 17, color: styles.accent }} />}
            {item.qr_payment_enabled && <QrCode2Icon sx={{ fontSize: 17, color: 'primary.main' }} />}
          </Stack>
        </Stack>
        <Box sx={{ mt: 'auto' }}>
          <Chip size="small" color={styles.chip_color} label={text(dictionary, `status${item.status}`, item.status)} sx={{ height: 22, fontWeight: 700 }} />
        </Box>
      </Stack>
    </Box>
  )
}

const FacilityBlock = ({ item }: { item: FloorPlanFacilityItem }) => {
  const meta = facility_meta_map[item.item_type]

  return (
    <Box
      sx={{
        minHeight: 94,
        minWidth: { xs: 124, sm: 138 },
        borderRadius: 1.5,
        border: 1,
        borderStyle: 'dashed',
        borderColor: 'primary.light',
        bgcolor: 'rgba(34, 80, 135, 0.055)',
        color: 'primary.dark',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 1.25
      }}
    >
      <Stack spacing={0.75} alignItems="center">
        {meta.icon}
        <Typography variant="caption" sx={{ fontWeight: 800 }}>
          {item.label || meta.label}
        </Typography>
      </Stack>
    </Box>
  )
}

const FloorPlanCanvas = ({
  dictionary,
  plan,
  floor,
  selected_code,
  on_apartment_hover,
  on_apartment_leave,
  on_apartment_click
}: {
  dictionary: Dictionary
  plan: StackingPlanModel
  floor: StackingPlanFloorModel
  selected_code?: string
  on_apartment_hover: (event: React.MouseEvent<HTMLElement>, item: FloorPlanApartmentItem, floor: StackingPlanFloorModel) => void
  on_apartment_leave: () => void
  on_apartment_click: (item: FloorPlanApartmentItem, floor: StackingPlanFloorModel) => void
}) => {
  const renderItems = (position: 'top' | 'bottom') =>
    floor.layout
      .filter(item => item.position === position)
      .sort((left, right) => left.sort_order - right.sort_order)
      .map(item =>
        item.item_type === 'apartment' ? (
          <ApartmentBlock
            key={item.apartment_code}
            dictionary={dictionary}
            item={item}
            selected={selected_code === item.apartment_code}
            on_hover={(event, apartment) => on_apartment_hover(event, apartment, floor)}
            on_leave={on_apartment_leave}
            on_click={apartment => on_apartment_click(apartment, floor)}
          />
        ) : (
          <FacilityBlock key={`${item.item_type}-${item.position}-${item.sort_order}`} item={item} />
        )
      )

  return (
    <Paper
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: '#F8FBFF',
        overflowX: 'auto',
        backgroundImage: 'linear-gradient(rgba(34, 80, 135, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 80, 135, 0.06) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}
    >
      <Stack spacing={2.5} sx={{ minWidth: 820 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.dark' }}>
              {plan.building_name} - {floor.floor_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {floor.summary.total_units} {text(dictionary, 'units', 'units')} | {floor.summary.occupied_units} {text(dictionary, 'statusoccupied', 'occupied')} | {floor.summary.vacant_units} {text(dictionary, 'statusvacant', 'vacant')} | {floor.summary.handed_over_units} {text(dictionary, 'statushanded_over', 'handed over')} | {floor.summary.locked_units} {text(dictionary, 'statuslocked', 'locked')}
            </Typography>
          </Box>
          <FloorPlanLegend dictionary={dictionary} />
        </Stack>
        <Divider sx={{ borderStyle: 'dashed' }} />
        <Stack direction="row" gap={1.25} alignItems="stretch" flexWrap="nowrap">
          {renderItems('top')}
        </Stack>
        <Box
          sx={{
            py: 1.4,
            px: 2,
            borderRadius: 1.5,
            border: 1,
            borderStyle: 'dashed',
            borderColor: 'primary.light',
            bgcolor: 'rgba(255,255,255,0.78)',
            color: 'primary.main',
            textAlign: 'center',
            fontWeight: 900,
            letterSpacing: 0.3
          }}
        >
          {text(dictionary, 'corridor', 'Corridor')}
        </Box>
        <Stack direction="row" gap={1.25} alignItems="stretch" flexWrap="nowrap">
          {renderItems('bottom')}
        </Stack>
      </Stack>
    </Paper>
  )
}

const BuildingStackView = ({
  dictionary,
  plan,
  on_select_floor,
  on_select_apartment
}: {
  dictionary: Dictionary
  plan: StackingPlanModel
  on_select_floor: (floor_code: string) => void
  on_select_apartment: (item: FloorPlanApartmentItem, floor: StackingPlanFloorModel) => void
}) => (
  <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider', overflowX: 'auto' }}>
    <Stack spacing={1.5} sx={{ minWidth: 760 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            {text(dictionary, 'buildingStackView', 'Building stack view')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {plan.project_name} | {plan.building_name}
          </Typography>
        </Box>
        <FloorPlanLegend dictionary={dictionary} />
      </Stack>
      <Divider />
      {plan.floors.map(floor => (
        <Grid key={floor.floor_code} container spacing={1.5} alignItems="center">
          <Grid size={{ xs: 2 }}>
            <Button fullWidth variant="text" onClick={() => on_select_floor(floor.floor_code)} sx={{ justifyContent: 'flex-start', fontWeight: 900 }}>
              {text(dictionary, 'floor', 'Floor')} {floor.floor_no}
            </Button>
          </Grid>
          <Grid size={{ xs: 10 }}>
            <Stack direction="row" gap={0.8} alignItems="center">
              {floor.apartments.map(apartment => (
                <Box
                  key={apartment.apartment_code}
                  component="button"
                  type="button"
                  onClick={() => on_select_apartment(apartment, floor)}
                  sx={{
                    width: 72,
                    height: 42,
                    borderRadius: 1,
                    border: 1.5,
                    borderColor: status_style_map[apartment.status].border,
                    bgcolor: status_style_map[apartment.status].background,
                    cursor: 'pointer',
                    fontWeight: 800,
                    color: 'text.primary',
                    fontVariantNumeric: 'tabular-nums',
                    transition: theme => theme.transitions.create(['transform', 'box-shadow'], { duration: 160 }),
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 18px rgba(34, 80, 135, 0.12)' }
                  }}
                >
                  {apartment.apartment_no}
                </Box>
              ))}
            </Stack>
          </Grid>
        </Grid>
      ))}
    </Stack>
  </Paper>
)

const ApartmentHoverPopover = ({ dictionary, hover, plan }: { dictionary: Dictionary; hover: HoverState; plan: StackingPlanModel | null }) => (
  <Popover
    open={Boolean(hover)}
    anchorEl={hover?.anchor_el ?? null}
    onClose={() => undefined}
    disableRestoreFocus
    sx={{ pointerEvents: 'none' }}
    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    PaperProps={{ sx: { p: 2, width: 300, borderRadius: 2, boxShadow: '0 18px 48px rgba(34, 80, 135, 0.18)' } }}
  >
    {hover && (
      <Stack spacing={1.2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
            {hover.item.apartment_code}
          </Typography>
          <Chip size="small" color={status_style_map[hover.item.status].chip_color} label={text(dictionary, `status${hover.item.status}`, hover.item.status)} />
        </Stack>
        {[
          [text(dictionary, 'project', 'Project'), plan?.project_name ?? '-'],
          [text(dictionary, 'building', 'Building'), plan?.building_name ?? '-'],
          [text(dictionary, 'floor', 'Floor'), hover.floor.floor_name],
          [text(dictionary, 'area', 'Area'), `${hover.item.area} m2`],
          [text(dictionary, 'ownerName', 'Owner'), hover.item.owner_name || '-'],
          [text(dictionary, 'waterMeterCode', 'Water Meter Code'), hover.item.water_meter_code || '-'],
          [text(dictionary, 'qrPayment', 'QR Payment'), hover.item.qr_payment_enabled ? text(dictionary, 'enabled', 'Enabled') : text(dictionary, 'disabled', 'Disabled')],
          [text(dictionary, 'currentDebt', 'Current debt'), `${currency_format.format(hover.item.current_debt)} VND`]
        ].map(([label, value]) => (
          <Stack key={label} direction="row" justifyContent="space-between" gap={2}>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, textAlign: 'right' }}>
              {value}
            </Typography>
          </Stack>
        ))}
      </Stack>
    )}
  </Popover>
)

const ApartmentDetailDrawer = ({
  dictionary,
  apartment,
  on_close
}: {
  dictionary: Dictionary
  apartment: ApartmentDetailModel | null
  on_close: () => void
}) => (
  <Drawer anchor="right" open={Boolean(apartment)} onClose={on_close} PaperProps={{ sx: { width: { xs: '100%', sm: '68%', md: 440 } } }}>
    {apartment && (
      <Stack sx={{ minHeight: '100%' }}>
        <Box sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" gap={2} alignItems="flex-start">
            <Box>
              <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 900 }}>
                {apartment.apartment_code}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {apartment.project_name} | {apartment.building_name} | {text(dictionary, 'floor', 'Floor')} {apartment.floor_no}
              </Typography>
            </Box>
            <Chip color={status_style_map[apartment.status].chip_color} label={text(dictionary, `status${apartment.status}`, apartment.status)} />
          </Stack>
        </Box>
        <Divider />
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>
              {text(dictionary, 'apartmentInfo', 'Apartment information')}
            </Typography>
            <Stack spacing={1.25}>
              {[
                [text(dictionary, 'apartmentNo', 'Apartment No'), apartment.apartment_no],
                [text(dictionary, 'area', 'Area'), `${apartment.area} m2`],
                [text(dictionary, 'waterMeterCode', 'Water Meter Code'), apartment.water_meter_code],
                [text(dictionary, 'qrPayment', 'QR Payment'), apartment.qr_payment_enabled ? text(dictionary, 'enabled', 'Enabled') : text(dictionary, 'disabled', 'Disabled')]
              ].map(([label, value]) => (
                <Stack key={label} direction="row" justifyContent="space-between" gap={2}>
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, textAlign: 'right' }}>
                    {value}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>
              {text(dictionary, 'residentAndFee', 'Resident and fee')}
            </Typography>
            <Stack spacing={1.25}>
              {[
                [text(dictionary, 'ownerName', 'Owner'), apartment.owner_name || '-'],
                [text(dictionary, 'currentDebt', 'Current debt'), `${currency_format.format(apartment.current_debt)} VND`],
                [text(dictionary, 'latestFeeStatus', 'Latest fee status'), text(dictionary, `fee${apartment.latest_fee_status}`, apartment.latest_fee_status)]
              ].map(([label, value]) => (
                <Stack key={label} direction="row" justifyContent="space-between" gap={2}>
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, textAlign: 'right' }}>
                    {value}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Stack>
        <Box sx={{ mt: 'auto', p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Stack spacing={1}>
            <Button fullWidth variant="contained" startIcon={<ApartmentIcon />}>{text(dictionary, 'viewDetail', 'View Detail')}</Button>
            <Button fullWidth variant="outlined" startIcon={<GridViewIcon />}>{text(dictionary, 'updateApartment', 'Update Apartment')}</Button>
            <Button fullWidth variant="outlined" startIcon={<ManageAccountsIcon />}>{text(dictionary, 'manageResidents', 'Manage Residents')}</Button>
            <Button fullWidth variant="outlined" startIcon={<QrCode2Icon />}>{text(dictionary, 'createQrPayment', 'Create QR Payment')}</Button>
            <Button fullWidth variant="text" startIcon={<HistoryIcon />}>{text(dictionary, 'viewFeeHistory', 'View Fee History')}</Button>
          </Stack>
        </Box>
      </Stack>
    )}
  </Drawer>
)

const FloorPlanSkeleton = () => (
  <Paper sx={{ p: 3, borderRadius: 2 }}>
    <Stack spacing={2}>
      <Skeleton variant="rounded" height={34} width="38%" />
      <Skeleton variant="rounded" height={108} />
      <Skeleton variant="rounded" height={46} />
      <Skeleton variant="rounded" height={108} />
    </Stack>
  </Paper>
)

const StackingPlanPage = ({ dictionary }: { dictionary: Dictionary }) => {
  const project_options = useMemo(() => propertyAggregateService.get_project_options(), [])
  const [filter, setFilter] = useState<StackingPlanFilterModel>(empty_filter)
  const building_options = useMemo(() => propertyAggregateService.get_building_options(filter.project_code), [filter.project_code])
  const floor_options = useMemo(() => propertyAggregateService.get_floor_options(filter.project_code, filter.building_code), [filter.project_code, filter.building_code])
  const [view_mode, setViewMode] = useState<ViewMode>('floor_plan')
  const [plan, setPlan] = useState<StackingPlanModel | null>(null)
  const [selected_apartment, setSelectedApartment] = useState<ApartmentDetailModel | null>(null)
  const [selected_code, setSelectedCode] = useState('')
  const [hover, setHover] = useState<HoverState>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      setPlan(await propertyAggregateService.get_stacking_plan(filter))
    } catch (err) {
      setError(err instanceof Error ? err.message : text(dictionary, 'loadError', 'Unable to load data.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const summary = useMemo(() => summarizePlan(plan), [plan])
  const active_floor = filter.floor_code ? plan?.floors.find(floor => floor.floor_code === filter.floor_code) : undefined

  const openApartment = async (item: FloorPlanApartmentItem) => {
    setSelectedCode(item.apartment_code)
    setSelectedApartment(await propertyAggregateService.get_apartment_detail(item.apartment_code))
  }

  const empty_message = filter.floor_code ? text(dictionary, 'emptyFloorPlan', 'This floor has no apartments matching the current filters.') : text(dictionary, 'emptyStackingPlan', 'Select project and building to view the floor plan.')

  return (
    <ContentWrapper
      title={text(dictionary, 'stackingPlanTitle', 'Sơ đồ mặt bằng')}
      description={text(dictionary, 'stackingPlanSubtitle', 'Visualize Project -> Tower -> Floor -> Apartment allocation.')}
      icon={<ViewComfyIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <Stack spacing={2.5} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2} alignItems={{ md: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.dark' }}>
              {text(dictionary, 'stackingOverview', 'Stacking overview')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {plan ? `${plan.project_name} | ${plan.building_name}` : text(dictionary, 'selectProjectBuilding', 'Select a project and building')}
            </Typography>
          </Box>
          <Stack direction="row" gap={1}>
            <Button variant="outlined" startIcon={<AutorenewIcon />} onClick={() => void loadData()}>
              {common(dictionary, 'refresh', 'Refresh')}
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />}>
              {text(dictionary, 'exportPlan', 'Export plan')}
            </Button>
          </Stack>
        </Stack>

        <StackingPlanFilter
          dictionary={dictionary}
          filter={filter}
          project_options={project_options}
          building_options={building_options}
          floor_options={floor_options}
          view_mode={view_mode}
          on_filter_change={setFilter}
          on_view_mode_change={setViewMode}
          on_refresh={() => void loadData()}
        />

        <StackingPlanSummary dictionary={dictionary} summary={summary} />

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <FloorPlanSkeleton />
        ) : !plan || plan.floors.length === 0 ? (
          <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2, border: 1, borderColor: 'divider' }}>
            <ViewComfyIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              {text(dictionary, 'emptyTitle', 'No data found')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {empty_message}
            </Typography>
          </Paper>
        ) : view_mode === 'list' || !active_floor ? (
          <BuildingStackView
            dictionary={dictionary}
            plan={plan}
            on_select_floor={floor_code => setFilter(current => ({ ...current, floor_code }))}
            on_select_apartment={(item) => void openApartment(item)}
          />
        ) : (
          <FloorPlanCanvas
            dictionary={dictionary}
            plan={plan}
            floor={active_floor}
            selected_code={selected_code}
            on_apartment_hover={(event, item, floor) => setHover({ anchor_el: event.currentTarget, item, floor })}
            on_apartment_leave={() => setHover(null)}
            on_apartment_click={(item) => void openApartment(item)}
          />
        )}
      </Stack>

      <ApartmentHoverPopover dictionary={dictionary} hover={hover} plan={plan} />
      <ApartmentDetailDrawer dictionary={dictionary} apartment={selected_apartment} on_close={() => setSelectedApartment(null)} />
    </ContentWrapper>
  )
}

export default StackingPlanPage
