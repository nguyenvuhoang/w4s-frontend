'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import SwapHorizRounded from '@mui/icons-material/SwapHorizRounded'
import DownloadRounded from '@mui/icons-material/DownloadRounded'
import {
  Alert, Box, Breadcrumbs, Button, Checkbox, Chip, FormControlLabel, FormGroup, LinearProgress,
  Link, MenuItem, Modal, Paper, Stack, Tab, Tabs, TextField, Typography
} from '@mui/material'

import type { Locale } from '@/configs/i18n'
import type en from '@/data/dictionaries/en.json'
import SyncOverlay from '@/views/components/SyncOverlay'

import type { DataMigrationService } from './dataMigrationConfig'
import DataMigrationImport from './DataMigrationImport'
import { useDataMigrationTables } from './useDataMigrationTables'
import { useDataMigrationTransfer } from './useDataMigrationTransfer'

type Props = {
  locale: Locale
  environment?: string
  services: readonly DataMigrationService[]
  labels: typeof en.data_migration
}

const DataMigrationContent = ({ locale, environment, services, labels }: Props) => {
  const [tab, setTab] = useState<'export' | 'import'>('export')
  const [serviceKey, setServiceKey] = useState('')
  const [search, setSearch] = useState('')
  const { catalog, selected, setSelected, loadTables } = useDataMigrationTables(locale)
  const { exportZip, importZip, pending, result, clearResult } = useDataMigrationTransfer(locale)
  const service = services.find(item => item.key === serviceKey)
  const tables = catalog.status === 'ready' ? catalog.tables : []
  const isExporting = pending === 'export'
  const serviceLabel = service ? `${service.name} (${service.code})` : ''
  const transferError = result?.error
  const errorLabels: Partial<Record<number, string>> = {
    401: labels.session_expired,
    403: labels.forbidden,
    501: labels.unsupported_service
  }

  const changeService = (key: string) => {
    if (pending) return

    setServiceKey(key)
    setSearch('')
    void loadTables(key)
    clearResult()
  }

  const keyword = search.trim().toLowerCase()
  const visibleTables = tables.filter(table => table.toLowerCase().includes(keyword))
  const percentage = tables.length ? (selected.size / tables.length) * 100 : 0
  const numberFormat = new Intl.NumberFormat(locale === 'la' ? 'lo' : locale)

  const toggleTable = (table: string, checked: boolean) => {
    setSelected(previous => {
      const next = new Set(previous)

      if (checked) next.add(table)
      else next.delete(table)

      return next
    })
  }

  return (
    <Stack spacing={4} sx={{ p: { xs: 3, md: 6 } }}>
      <Modal open={Boolean(pending)} hideBackdrop disableEscapeKeyDown>
        <Box role='dialog' aria-modal='true' aria-label={isExporting ? labels.exporting : labels.importing} tabIndex={-1} sx={{ position: 'fixed', inset: 0 }}>
          <SyncOverlay open={Boolean(pending)} message={isExporting ? labels.exporting : labels.importing} description={labels.export_keep_open} />
        </Box>
      </Modal>
      <Box>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link component={NextLink} href={`/${locale}/system-settings`} underline='hover'>
            {labels.system_settings}
          </Link>
          <Typography color='text.primary'>{labels.title}</Typography>
        </Breadcrumbs>

        <Stack direction='row' alignItems='center' gap={2} flexWrap='wrap'>
          <SwapHorizRounded color='primary' fontSize='large' />
          <Typography component='h1' variant='h4' fontWeight={700}>{labels.title}</Typography>
          {environment && <Chip size='small' variant='outlined' label={environment} />}
        </Stack>
        <Typography color='text.secondary' sx={{ mt: 1 }}>{labels.subtitle}</Typography>
      </Box>

      <Paper variant='outlined' sx={{ p: { xs: 2, sm: 4 } }}>
        <TextField
          select
          fullWidth
          size='small'
          label={labels.source_service}
          value={serviceKey}
          onChange={event => changeService(event.target.value)}
          disabled={Boolean(pending) || !services.length}
          helperText={services.length ? labels.select_service : labels.no_services}
        >
          {services.map(item => <MenuItem key={item.key} value={item.key}>{item.name} ({item.code})</MenuItem>)}
        </TextField>
      </Paper>

      <Paper variant='outlined'>
        <Tabs
          value={tab}
          onChange={(_, value: 'export' | 'import') => setTab(value)}
          aria-label={labels.title}
          sx={{ px: { xs: 1, sm: 3 }, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab id='migration-export-tab' aria-controls='migration-export-panel' value='export' label={labels.export_tab} />
          <Tab
            component='button'
            id='migration-import-tab'
            aria-controls='migration-import-panel'
            value='import'
            label={labels.import_tab}
          />
        </Tabs>

        {result?.operation === tab && (
          <Alert severity={transferError ? 'error' : 'success'} sx={{ m: { xs: 2, sm: 4 }, mb: 0 }}>
            {transferError
              ? errorLabels[transferError.status] ?? (tab === 'export'
                ? transferError.invalidZip ? labels.export_invalid_zip : labels.export_failed
                : transferError.status === 413 ? labels.import_too_large
                  : transferError.status === 504 ? labels.import_timeout
                    : labels.import_failed)
              : tab === 'export' ? labels.export_success : labels.import_success}
            {transferError?.executionId && (
              <Typography variant='body2'>{labels.error_reference.replace('{id}', transferError.executionId)}</Typography>
            )}
            {result.description && <Typography variant='body2'>{result.description}</Typography>}
          </Alert>
        )}

        <Box role='tabpanel' id='migration-export-panel' aria-labelledby='migration-export-tab' hidden={tab !== 'export'}>
          <Stack spacing={3} sx={{ p: { xs: 2, sm: 4 } }} aria-busy={isExporting || catalog.status === 'loading'}>
            {service && <Typography component='h2' variant='h6'>{labels.export_from.replace('{service}', serviceLabel)}</Typography>}
            {!service && <Alert severity='info'>{labels.select_service}</Alert>}
            {catalog.status === 'loading' && <LinearProgress aria-label={labels.catalog_loading} />}
            {service && catalog.status === 'error' && (
              <Alert severity='error'>
                <Stack spacing={2} alignItems='flex-start'>
                  <Typography variant='body2'>{errorLabels[catalog.error.status] ?? labels.catalog_load_failed}</Typography>
                  {catalog.error.executionId && (
                    <Typography variant='body2'>{labels.error_reference.replace('{id}', catalog.error.executionId)}</Typography>
                  )}
                  <Button size='small' variant='outlined' disabled={Boolean(pending)} onClick={() => void loadTables(service.key)}>
                    {labels.catalog_retry}
                  </Button>
                </Stack>
              </Alert>
            )}
            {catalog.status === 'ready' && !tables.length && <Alert severity='info'>{labels.no_tables}</Alert>}
            {service && tables.length > 0 && (
              <Stack spacing={3}>
                <Box>
                  <Typography component='h3' variant='subtitle1'>{labels.select_tables}</Typography>
                </Box>
                <Stack direction='row' gap={1} flexWrap='wrap'>
                  <Chip variant='outlined' label={labels.total.replace('{count}', numberFormat.format(tables.length))} />
                  <Chip color='primary' variant='outlined' label={labels.selected.replace('{count}', numberFormat.format(selected.size))} />
                </Stack>
                <LinearProgress variant='determinate' value={percentage} aria-label={labels.selection_progress} />

                <TextField
                  size='small'
                  label={labels.search}
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                />
                <Stack direction='row' gap={1} flexWrap='wrap'>
                  <Button size='small' disabled={selected.size === tables.length || isExporting} onClick={() => setSelected(new Set(tables))}>
                    {labels.select_all}
                  </Button>
                  <Button size='small' disabled={!selected.size || isExporting} onClick={() => setSelected(new Set())}>
                    {labels.clear_all}
                  </Button>
                  <Button size='small' disabled={selected.size === tables.length || isExporting} onClick={() => setSelected(new Set(tables))}>
                    {labels.restore_default}
                  </Button>
                </Stack>

                {visibleTables.length ? (
                  <FormGroup
                    aria-label={labels.select_tables}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
                      alignContent: 'start',
                      maxHeight: 320,
                      overflowY: 'auto',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 1
                    }}
                  >
                    {visibleTables.map(table => (
                      <FormControlLabel
                        key={table}
                        label={table}
                        sx={{ m: 0, overflowWrap: 'anywhere' }}
                        control={
                          <Checkbox
                            checked={selected.has(table)}
                            disabled={isExporting}
                            onChange={(_, checked) => toggleTable(table, checked)}
                          />
                        }
                      />
                    ))}
                  </FormGroup>
                ) : (
                  <Alert severity='info'>{labels.empty_search}</Alert>
                )}

              </Stack>
            )}
            <Button
              variant='contained'
              startIcon={<DownloadRounded />}
              loading={isExporting}
              disabled={!service || !selected.size || Boolean(pending)}
              onClick={() => service && void exportZip(service.key, tables.filter(table => selected.has(table)))}
              sx={{ alignSelf: { xs: 'stretch', sm: 'flex-end' } }}
            >
              {isExporting ? labels.exporting : labels.export_zip}
            </Button>
          </Stack>
        </Box>

        <Box role='tabpanel' id='migration-import-panel' aria-labelledby='migration-import-tab' hidden={tab !== 'import'}>
          <Box sx={{ p: { xs: 2, sm: 4 } }}>
            {service ? (
              <DataMigrationImport
                key={service.key}
                serviceLabel={serviceLabel}
                locale={locale}
                isProduction={environment === 'PROD'}
                labels={labels}
                disabled={Boolean(pending)}
                isImporting={pending === 'import'}
                onImport={(file, preserveIdentity) => importZip(service.key, file, preserveIdentity)}
              />
            ) : <Alert severity='info'>{labels.select_service}</Alert>}
          </Box>
        </Box>
      </Paper>
    </Stack>
  )
}

export default DataMigrationContent
