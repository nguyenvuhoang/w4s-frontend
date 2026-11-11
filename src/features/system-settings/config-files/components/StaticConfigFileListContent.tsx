'use client'

import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import RefreshRounded from '@mui/icons-material/RefreshRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import VisibilityRounded from '@mui/icons-material/VisibilityRounded'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import { useRouter } from '@shared/hooks/useRouter'

import type { Locale } from '@/configs/i18n'
import { useSearchTableRowConfig } from '@/shared/components/table'

import type { ConfigFilesDictionary, StaticConfigFileItem } from '../types'
import { useStaticConfigFileList } from '../hooks/useStaticConfigFileList'
import { configFileText } from './configFileHelpers'

type StaticConfigFileListContentProps = {
  dictionary: ConfigFilesDictionary
  locale: Locale
  serviceCode: string
  serviceDisplayCode: string
  serviceName: string
}

const formatFileSize = (value?: number) => {
  const bytes = Number(value ?? 0)

  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const formatUtcDate = (value: string | undefined, locale: Locale) => {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'UTC'
  }).format(date)
}

const StaticConfigFileListContent = ({ dictionary, locale, serviceCode, serviceDisplayCode, serviceName }: StaticConfigFileListContentProps) => {
  const router = useRouter()
  const list = useStaticConfigFileList(serviceCode, serviceName, dictionary)
  const serviceListHref = `/${locale}/system-settings/config-files`

  const openDetail = (item: StaticConfigFileItem) => {
    const params = new URLSearchParams({ relative_path: item.relative_path })

    router.push(`/${locale}/system-settings/config-files/${serviceCode}/detail?${params.toString()}`)
  }

  const table = useSearchTableRowConfig<StaticConfigFileItem>({
    rowInteraction: { onOpenDetail: openDetail }
  })

  return (
    <Stack spacing={4}>
      <Box>
        <Button href={serviceListHref} startIcon={<ArrowBackRounded />} sx={{ mb: 2 }}>
          {configFileText(dictionary, 'config_files_service_list_breadcrumb', 'Config file services')}
        </Button>

        <Stack direction='row' spacing={1.5} alignItems='center' sx={{ mb: 1 }}>
          <Chip label={serviceDisplayCode} color='primary' size='small' />
          <Typography variant='h4' sx={{ fontWeight: 700 }}>
            {configFileText(dictionary, 'config_files_list_title', '{service} Configuration Files').replace('{service}', serviceName)}
          </Typography>
        </Stack>
        <Typography variant='body1' color='text.secondary' sx={{ maxWidth: 820, lineHeight: 1.65 }}>
          {configFileText(dictionary, 'config_files_list_description', 'Search and open JSON configuration files managed by {service}.').replace('{service}', serviceName)}
        </Typography>
      </Box>

      <Paper variant='outlined' sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        <Stack
          component='form'
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          onSubmit={event => {
            event.preventDefault()
            list.submitSearch()
          }}
        >
          <TextField
            value={list.searchInput}
            onChange={event => list.setSearchInput(event.target.value)}
            placeholder={configFileText(dictionary, 'config_files_search_placeholder', 'Search by file name or relative path')}
            size='small'
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchRounded fontSize='small' />
                  </InputAdornment>
                )
              }
            }}
          />
          <Button
            type='submit'
            variant='contained'
            disabled={list.loading}
            sx={{
              minHeight: 40,
              px: 3,
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            {configFileText(dictionary, 'config_files_search_button', 'Search')}
          </Button>
          <Button
            variant='outlined'
            startIcon={<RefreshRounded fontSize='small' />}
            onClick={list.resetSearch}
            disabled={list.loading}
            sx={{
              minHeight: 40,
              px: 3,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              '& .MuiButton-startIcon': {
                mr: 1
              }
            }}
          >
            {configFileText(dictionary, 'config_files_refresh_button', 'Refresh')}
          </Button>
        </Stack>
      </Paper>

      {list.error && <Alert severity='error'>{list.error}</Alert>}

      <Paper variant='outlined' sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{configFileText(dictionary, 'config_files_column_file_name', 'File name')}</TableCell>
                <TableCell>{configFileText(dictionary, 'config_files_column_relative_path', 'Relative path')}</TableCell>
                <TableCell align='right'>{configFileText(dictionary, 'config_files_column_size', 'File size')}</TableCell>
                <TableCell>{configFileText(dictionary, 'config_files_column_updated_at', 'Updated at')}</TableCell>
                <TableCell align='center'>{configFileText(dictionary, 'config_files_column_actions', 'Actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.loading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Stack alignItems='center' justifyContent='center' spacing={2} sx={{ py: 8 }}>
                      <CircularProgress />
                      <Typography color='text.secondary'>
                        {configFileText(dictionary, 'config_files_loading', 'Loading configuration...')}
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : list.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Stack alignItems='center' sx={{ py: 8, textAlign: 'center' }}>
                      <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
                        {configFileText(dictionary, 'config_files_empty_title', 'No config files found')}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {configFileText(dictionary, 'config_files_empty_description', 'Try changing the search keyword or refresh the list.')}
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                list.items.map(item => (
                  <TableRow
                    key={item.relative_path}
                    {...table.getRowProps(item)}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>{item.file_name || '-'}</TableCell>
                    <TableCell sx={{ overflowWrap: 'anywhere' }}>{item.relative_path}</TableCell>
                    <TableCell align='right'>{formatFileSize(item.size_bytes)}</TableCell>
                    <TableCell>{formatUtcDate(item.last_modified_utc, locale)}</TableCell>
                    <TableCell align='center'>
                      <IconButton
                        size='small'
                        onClick={event => {
                          event.stopPropagation()
                          openDetail(item)
                        }}
                        title={configFileText(dictionary, 'config_files_detail_action', 'Detail')}
                      >
                        <VisibilityRounded fontSize='small' />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component='div'
          count={list.totalCount}
          page={Math.max(0, list.page - 1)}
          rowsPerPage={list.pageSize}
          rowsPerPageOptions={[10, 25, 50]}
          onPageChange={(_, nextPage) => list.setPage(nextPage + 1)}
          onRowsPerPageChange={event => {
            list.setPageSize(Number(event.target.value))
            list.setPage(1)
          }}
          labelRowsPerPage={configFileText(dictionary, 'config_files_rows_per_page', 'Rows per page')}
        />
      </Paper>
    </Stack>
  )
}

export default StaticConfigFileListContent
