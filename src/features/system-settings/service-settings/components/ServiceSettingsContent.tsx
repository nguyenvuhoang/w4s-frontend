'use client'

import CheckRounded from '@mui/icons-material/CheckRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import RefreshRounded from '@mui/icons-material/RefreshRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import SettingsRounded from '@mui/icons-material/SettingsRounded'
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded'
import VisibilityRounded from '@mui/icons-material/VisibilityRounded'
import { useState } from 'react'
import { Alert, Box, Button, Chip, CircularProgress, IconButton, InputAdornment, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'

import { useServiceSettingInlineEdit } from '../hooks/useServiceSettingInlineEdit'
import { useServiceSettingsSearch } from '../hooks/useServiceSettingsSearch'
import { SERVICE_SETTINGS_SERVICES } from '../services/serviceSettingsService'
import { displayValue, getRowKey, isSensitiveSetting, resolveInlineEditKey } from '../serviceSettingsInlineEdit'
import type { ServiceSettingsDictionary } from '../types'

const text = (dictionary: ServiceSettingsDictionary, key: string, fallback: string) => dictionary.system_settings_modules?.[key] ?? fallback

const ServiceSettingsContent = ({ dictionary }: { dictionary: ServiceSettingsDictionary }) => {
  const list = useServiceSettingsSearch(dictionary)
  const theme = useTheme()
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({})
  const inlineEdit = useServiceSettingInlineEdit({
    dictionary,
    service: list.service,
    onSaved: (item, value) => { list.updateItemValue(item, value); list.refresh() }
  })
  // Leaving the current view (search, service, paging, refresh) also discards an unsaved edit.
  const resetVisibleSecrets = () => { setVisibleSecrets({}); inlineEdit.cancel() }

  return (
    <Stack spacing={4}>
      <Paper
        variant='outlined'
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: 2,
          borderColor: alpha(theme.palette.primary.main, 0.16),
          background: `linear-gradient(120deg, ${alpha(theme.palette.primary.main, 0.11)} 0%, ${alpha(theme.palette.primary.light, 0.08)} 58%, ${alpha('#0f9e9a', 0.08)} 100%)`
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent='space-between' alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2}>
          <Stack direction='row' spacing={1.75} alignItems='flex-start'>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                color: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, 0.1)
              }}
            >
              <SettingsRounded fontSize='small' />
            </Box>
            <Box>
              <Typography variant='h4' sx={{ fontWeight: 700, mb: 0.5 }}>
                {text(dictionary, 'service_settings_title', 'Service Settings')}
              </Typography>
              <Typography variant='body1' color='text.secondary' sx={{ lineHeight: 1.6 }}>
                {text(dictionary, 'service_settings_description', 'Look up runtime settings for each service in the system.')}
              </Typography>
            </Box>
          </Stack>
          <Chip
            label={list.service}
            variant='outlined'
            sx={{
              alignSelf: { xs: 'flex-start', sm: 'center' },
              borderRadius: 5,
              fontWeight: 700,
              bgcolor: alpha(theme.palette.background.paper, 0.72),
              borderColor: alpha(theme.palette.primary.main, 0.2)
            }}
          />
        </Stack>
      </Paper>

      <Paper variant='outlined' sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, bgcolor: 'background.paper' }}>
        <Stack component='form' direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} onSubmit={event => { event.preventDefault(); resetVisibleSecrets(); list.submitSearch() }}>
          <TextField select size='small' label={text(dictionary, 'service_settings_service_label', 'Service')} value={list.service} onChange={event => { resetVisibleSecrets(); list.setService(event.target.value as typeof list.service) }} sx={{ minWidth: 160 }}>
            {SERVICE_SETTINGS_SERVICES.map(service => <MenuItem key={service} value={service}>{service}</MenuItem>)}
          </TextField>
          <TextField size='small' fullWidth value={list.searchInput} onChange={event => list.setSearchInput(event.target.value)} placeholder={text(dictionary, 'service_settings_search_placeholder', 'Search by setting name')} slotProps={{ input: { startAdornment: <InputAdornment position='start'><SearchRounded fontSize='small' /></InputAdornment> } }} />
          <Button type='submit' variant='contained' disabled={list.loading} sx={{ whiteSpace: 'nowrap' }}>{text(dictionary, 'service_settings_search_button', 'Search')}</Button>
          <Button variant='outlined' startIcon={<RefreshRounded />} onClick={() => { resetVisibleSecrets(); list.refresh() }} disabled={list.loading} sx={{ whiteSpace: 'nowrap' }}>{text(dictionary, 'service_settings_refresh_button', 'Refresh')}</Button>
        </Stack>
      </Paper>

      {list.error && <Alert severity='error'>{list.error}</Alert>}

      <Paper variant='outlined' sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer><Table><TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.035) }}><TableRow>
          <TableCell>{text(dictionary, 'service_settings_column_name', 'Setting Name')}</TableCell><TableCell>{text(dictionary, 'service_settings_column_value', 'Value')}</TableCell><TableCell>{text(dictionary, 'service_settings_column_organization', 'Organization')}</TableCell>
        </TableRow></TableHead><TableBody>
          {list.loading ? <TableRow><TableCell colSpan={3}><Stack alignItems='center' spacing={2} sx={{ py: 8 }}><CircularProgress /><Typography color='text.secondary'>{text(dictionary, 'service_settings_loading', 'Loading service settings...')}</Typography></Stack></TableCell></TableRow>
            : list.items.length === 0 ? <TableRow><TableCell colSpan={3}><Stack alignItems='center' sx={{ py: 8, textAlign: 'center' }}><Typography variant='subtitle1' sx={{ fontWeight: 700 }}>{text(dictionary, 'service_settings_empty_title', 'No service settings found')}</Typography><Typography variant='body2' color='text.secondary'>{text(dictionary, 'service_settings_empty_description', 'Try changing the search term or refreshing the list.')}</Typography></Stack></TableCell></TableRow>
              : list.items.map(item => {
                const secretId = `${list.service}:${item.name}`
                const sensitive = isSensitiveSetting(item)
                const isVisible = Boolean(visibleSecrets[secretId])
                const rowKey = getRowKey(list.service, item)
                const isEditing = inlineEdit.rowKey === rowKey
                const canStartEdit = inlineEdit.rowKey === null
                const visibilityLabel = text(dictionary, isVisible ? 'service_settings_hide_value' : 'service_settings_show_value', isVisible ? 'Hide value' : 'Show value')
                const visibilityButton = sensitive && <Tooltip title={visibilityLabel}>
                  <IconButton
                    size='small'
                    onClick={event => { event.stopPropagation(); setVisibleSecrets(current => ({ ...current, [secretId]: !isVisible })) }}
                    onKeyDown={event => event.stopPropagation()}
                    aria-label={visibilityLabel}
                  >
                    {isVisible ? <VisibilityOffRounded fontSize='small' /> : <VisibilityRounded fontSize='small' />}
                  </IconButton>
                </Tooltip>
                const startEdit = () => { if (canStartEdit) inlineEdit.start(rowKey, item) }

                return <TableRow key={item.name} hover sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.025) } }}>
                  <TableCell sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{item.name}</TableCell>
                  {isEditing ? <TableCell sx={{ minWidth: 280 }}>
                    <Stack direction='row' alignItems='flex-start' spacing={0.5}>
                      <TextField
                        size='small'
                        fullWidth
                        autoFocus
                        value={inlineEdit.draft}
                        type={sensitive && !isVisible ? 'password' : 'text'}
                        autoComplete={sensitive ? 'new-password' : 'off'}
                        disabled={inlineEdit.saving}
                        error={Boolean(inlineEdit.error)}
                        helperText={inlineEdit.error ?? undefined}
                        placeholder={sensitive ? text(dictionary, 'service_settings_secret_replace_placeholder', 'Enter a new value') : undefined}
                        onChange={event => inlineEdit.change(event.target.value)}
                        onKeyDown={event => {
                          const keyAction = resolveInlineEditKey(event.key)

                          if (!keyAction) return
                          event.preventDefault()
                          event.stopPropagation()
                          if (keyAction === 'save') void inlineEdit.save()
                          else inlineEdit.cancel()
                        }}
                        slotProps={{
                          htmlInput: { 'aria-label': text(dictionary, 'service_settings_column_value', 'Value') },
                          input: sensitive ? { endAdornment: <InputAdornment position='end'>{visibilityButton}</InputAdornment> } : undefined
                        }}
                      />
                      <Tooltip title={text(dictionary, 'service_settings_save_value', 'Save')}>
                        <span>
                          <IconButton size='small' color='primary' disabled={inlineEdit.saving} onClick={() => void inlineEdit.save()} aria-label={text(dictionary, 'service_settings_save_value', 'Save')} sx={{ mt: 0.5 }}>
                            {inlineEdit.saving ? <CircularProgress size={18} /> : <CheckRounded fontSize='small' />}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={text(dictionary, 'service_settings_cancel_edit', 'Cancel')}>
                        <span>
                          <IconButton size='small' disabled={inlineEdit.saving} onClick={inlineEdit.cancel} aria-label={text(dictionary, 'service_settings_cancel_edit', 'Cancel')} sx={{ mt: 0.5 }}>
                            <CloseRounded fontSize='small' />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                    : <TableCell
                      onClick={startEdit}
                      title={canStartEdit ? text(dictionary, 'service_settings_click_to_edit', 'Click to edit') : undefined}
                      sx={{ overflowWrap: 'anywhere', cursor: canStartEdit ? 'pointer' : 'default', '&:hover': canStartEdit ? { bgcolor: alpha(theme.palette.primary.main, 0.05) } : undefined }}
                    >
                      <Stack direction='row' alignItems='center' spacing={0.5}>
                        <Box
                          component='span'
                          role='button'
                          tabIndex={canStartEdit ? 0 : -1}
                          aria-disabled={!canStartEdit}
                          onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); startEdit() } }}
                          sx={{ minWidth: 0, overflowWrap: 'anywhere' }}
                        >
                          {displayValue(item, isVisible)}
                        </Box>
                        {visibilityButton}
                      </Stack>
                    </TableCell>}
                  <TableCell>{item.organization || text(dictionary, 'service_settings_organization_system', 'System-wide')}</TableCell>
                </TableRow>
              })}
        </TableBody></Table></TableContainer>
        <TablePagination component='div' count={list.totalCount} page={list.page - 1} rowsPerPage={list.pageSize} rowsPerPageOptions={[10, 25, 50]} onPageChange={(_, nextPage) => { resetVisibleSecrets(); list.setPage(nextPage + 1) }} onRowsPerPageChange={event => { resetVisibleSecrets(); list.setPageSize(Number(event.target.value)); list.setPage(1) }} labelRowsPerPage={text(dictionary, 'service_settings_rows_per_page', 'Rows per page')} />
      </Paper>
    </Stack>
  )
}

export default ServiceSettingsContent
