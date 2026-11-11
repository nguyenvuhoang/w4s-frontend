'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from '@shared/hooks/useRouter'
import { i18n } from '@/configs/i18n'

import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import RefreshIcon from '@mui/icons-material/Refresh'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'

import DataTable, { type Column } from '@/components/api-manager/shared/DataTable'
import { managementService } from './service'
import type { ManagementRecord, ManagementScreenConfig } from './types'

type DrawerMode = 'create' | 'edit' | 'view'

const formatValue = (value: unknown) => {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return new Intl.NumberFormat('vi-VN').format(value)

  return String(value ?? '')
}

const initialValues = (config: ManagementScreenConfig, record?: ManagementRecord) => {
  const values: ManagementRecord = { id: record?.id ?? '' }

  for (const field of config.fields.filter(item => item.form !== false)) {
    values[field.key] = record?.[field.key] ?? (field.key === 'status' ? 'active' : field.type === 'boolean' ? false : '')
  }

  return values
}

const isPublishedAnnouncement = (config: ManagementScreenConfig, record?: ManagementRecord) => {
  if (config.key !== 'announcement' || !record) return false

  const publishStatus = String(record.publishStatus ?? record.publish_status ?? record.status ?? '').trim().toLowerCase()

  return ['published', 'sent', 'released', 'active', 'a'].includes(publishStatus)
}

const ManagementPage = ({ config }: { config: ManagementScreenConfig }) => {
  const router = useRouter()
  const params = useParams<{ locale?: string }>()
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [rows, setRows] = useState<ManagementRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null)
  const [selected, setSelected] = useState<ManagementRecord | undefined>()
  const [formValues, setFormValues] = useState<ManagementRecord>(() => initialValues(config))
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const selectedIsPublishedAnnouncement = isPublishedAnnouncement(config, selected)

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await managementService.list(config, { keyword, status, page, pageSize: rowsPerPage })

      setRows(result.data)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.key, keyword, status, page, rowsPerPage])

  const tableFields = useMemo(
    () => config.fields.filter(field => field.table !== false).slice(0, 7),
    [config.fields]
  )

  const columns = useMemo<Column<ManagementRecord>[]>(
    () =>
      tableFields.map(field => ({
        id: field.key,
        label: field.label,
        minWidth: 140,
        format: value =>
          field.key === 'status' ? (
            <Chip
              size='small'
              color={value === 'active' ? 'success' : 'error'}
              label={value === 'active' ? 'Active' : 'Inactive'}
            />
          ) : (
            formatValue(value)
          )
      })),
    [tableFields]
  )

  const openDrawer = (mode: DrawerMode, record?: ManagementRecord) => {
    setSelected(record)
    setFormValues(initialValues(config, record))
    setDrawerMode(mode)
  }

  const handleCreate = () => {
    if (config.key === 'announcement') {
      router.push(`/${params?.locale ?? i18n.defaultLocale}/announcement/create`)
      return
    }

    openDrawer('create')
  }

  const closeDrawer = () => {
    setDrawerMode(null)
    setSelected(undefined)
    setFormValues(initialValues(config))
  }

  const handleSave = async () => {
    const requiredMissing = config.fields
      .filter(field => field.required && field.form !== false)
      .some(field => formValues[field.key] === '' || formValues[field.key] === undefined || formValues[field.key] === null)

    if (requiredMissing) {
      setError('Please fill all required fields.')
      return
    }

    if (drawerMode === 'edit' && selected?.id) {
      await managementService.update(config, selected.id, formValues)
    } else {
      await managementService.create(config, formValues)
    }

    closeDrawer()
    await loadData()
  }

  const handleDeactivate = async () => {
    if (!confirmId) return

    await managementService.deactivate(config, confirmId)
    setConfirmId(null)
    await loadData()
  }

  return (
    <Stack spacing={2.5} sx={{ px: { xs: 2, md: 3 }, pt: 1.5, pb: 3 }}>
      <Box sx={{ px: 0.5 }}>
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 1 }}>
          <Link underline='hover' color='inherit' href='/'>
            Home
          </Link>
          <Typography color='text.primary'>{config.title}</Typography>
        </Breadcrumbs>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' alignItems={{ xs: 'flex-start', md: 'center' }} gap={2}>
          <Box>
            <Typography variant='h4' fontWeight={700}>
              {config.title}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {config.endpointTodo}
            </Typography>
          </Box>
          <Stack direction='row' gap={1} sx={{ flexShrink: 0 }}>
            <Button
              size='small'
              variant='outlined'
              startIcon={<RefreshIcon fontSize='small' />}
              onClick={loadData}
              sx={{ minHeight: 34, px: 1.5, py: 0.5, fontSize: 13, lineHeight: 1.4 }}
            >
              Refresh
            </Button>
            <Button
              size='small'
              variant='contained'
              startIcon={<AddIcon fontSize='small' />}
              onClick={handleCreate}
              sx={{ minHeight: 34, px: 1.5, py: 0.5, fontSize: 13, lineHeight: 1.4 }}
            >
              {config.key === 'announcement' ? 'Create Announcement' : 'Add'}
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Paper sx={{ p: 1.5, borderRadius: 2 }}>
        <Grid container spacing={1.5} alignItems='center'>
          <Grid size={{ xs: 12, md: 7 }}>
            <TextField
              fullWidth
              size='small'
              label='Search Name / Code / Keyword'
              value={keyword}
              onChange={event => {
                setPage(0)
                setKeyword(event.target.value)
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>Status</InputLabel>
              <Select
                label='Status'
                value={status}
                onChange={event => {
                  setPage(0)
                  setStatus(event.target.value as typeof status)
                }}
              >
                <MenuItem value='all'>All</MenuItem>
                <MenuItem value='active'>Active</MenuItem>
                <MenuItem value='inactive'>Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              fullWidth
              size='small'
              variant='outlined'
              startIcon={<RestartAltIcon fontSize='small' />}
              onClick={() => setKeyword('')}
              sx={{ minHeight: 34, px: 1.5, py: 0.5, fontSize: 13, lineHeight: 1.4 }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity='error' onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        count={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        loading={loading}
        compact={config.key === 'announcement'}
        disableInternalScroll={config.key === 'announcement'}
        paperSx={{ borderRadius: 2 }}
        actions={row => (
          <Stack direction='row' justifyContent='flex-end' gap={0.5}>
            <Tooltip title='View'>
              <IconButton size='small' onClick={() => openDrawer('view', row)}>
                <VisibilityOutlinedIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Edit'>
              <IconButton size='small' onClick={() => openDrawer('edit', row)}>
                <EditOutlinedIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Deactivate'>
              <IconButton size='small' color='error' onClick={() => setConfirmId(row.id)}>
                <DeleteOutlineIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      />

      <Drawer anchor='right' open={Boolean(drawerMode)} onClose={closeDrawer} PaperProps={{ sx: { width: { xs: '100%', sm: 520 } } }}>
        <Box sx={{ p: 3 }}>
          <Typography variant='h5' fontWeight={700} sx={{ mb: 3 }}>
            {drawerMode === 'create' ? `Add ${config.title}` : drawerMode === 'edit' ? `Edit ${config.title}` : `${config.title} Detail`}
          </Typography>
          {selectedIsPublishedAnnouncement && (
            <Alert severity='info' sx={{ mb: 2 }}>
              Published announcements cannot be edited.
            </Alert>
          )}
          <Stack spacing={2}>
            {config.fields
              .filter(field => field.form !== false)
              .map(field => {
                const disabled = drawerMode === 'view' || selectedIsPublishedAnnouncement

                if (field.type === 'boolean') {
                  return (
                    <FormControlLabel
                      key={field.key}
                      control={
                        <Switch
                          checked={Boolean(formValues[field.key])}
                          disabled={disabled}
                          onChange={event => setFormValues(values => ({ ...values, [field.key]: event.target.checked }))}
                        />
                      }
                      label={field.label}
                    />
                  )
                }

                if (field.type === 'select' && field.options) {
                  return (
                    <FormControl key={field.key} fullWidth required={field.required} disabled={disabled}>
                      <InputLabel>{field.label}</InputLabel>
                      <Select
                        label={field.label}
                        value={String(formValues[field.key] ?? '')}
                        onChange={event => setFormValues(values => ({ ...values, [field.key]: event.target.value }))}
                      >
                        {field.options.map(option => (
                          <MenuItem key={String(option.value)} value={String(option.value)}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )
                }

                return (
                  <TextField
                    key={field.key}
                    fullWidth
                    required={field.required}
                    disabled={disabled}
                    label={field.label}
                    type={field.type === 'number' || field.type === 'currency' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                    value={String(formValues[field.key] ?? '')}
                    onChange={event => setFormValues(values => ({ ...values, [field.key]: event.target.value }))}
                  />
                )
              })}
          </Stack>
        </Box>
        <Box sx={{ mt: 'auto', p: 3, borderTop: theme => `1px solid ${theme.palette.divider}` }}>
          <Stack direction='row' justifyContent='flex-end' gap={1}>
            <Button onClick={closeDrawer}>Close</Button>
            {drawerMode !== 'view' && !selectedIsPublishedAnnouncement && (
              <Button variant='contained' onClick={handleSave}>
                Save
              </Button>
            )}
          </Stack>
        </Box>
      </Drawer>

      <Dialog open={Boolean(confirmId)} onClose={() => setConfirmId(null)}>
        <DialogTitle>Confirm deactivate</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to deactivate this record?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmId(null)}>Cancel</Button>
          <Button color='error' variant='contained' onClick={handleDeactivate}>
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default ManagementPage
