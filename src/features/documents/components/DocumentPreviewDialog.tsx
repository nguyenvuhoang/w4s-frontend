'use client'

import CloseIcon from '@mui/icons-material/Close'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'

import { documentService } from '../services/documentService'
import type { DocumentNodeModel } from '../types'
import { DocumentNodeIcon, documentText, format_document_date, format_file_size, get_status_color, get_status_label, type DocumentDictionary } from './documentHelpers'

type Props = {
  dictionary: DocumentDictionary
  file: DocumentNodeModel | null
  on_close: () => void
}

const EXCEL_EXTENSIONS = ['xlsx', 'xls', 'csv']
const EXCEL_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv'
]
const MAX_EXCEL_ROWS = 1000

const isObjectKey = (url: string | null | undefined): boolean =>
  Boolean(url) && !url!.startsWith('http')

// Bỏ dấu chấm, trim khoảng trắng, chuyển về lowercase để so khớp extension ổn định.
const normalize_extension = (ext: string | null | undefined): string =>
  (ext ?? '').trim().replace(/^\.+/, '').toLowerCase()

const is_excel_file = (file: DocumentNodeModel | null): boolean => {
  if (!file) return false

  const ext = normalize_extension(file.file_extension)
  const mime = (file.mime_type ?? '').trim().toLowerCase()

  return EXCEL_EXTENSIONS.includes(ext) || EXCEL_MIME_TYPES.includes(mime)
}

type ExcelData = {
  sheet_name: string
  rows: unknown[][]
  truncated: boolean
}

const fetchExcelArrayBuffer = async (dictionary: DocumentDictionary, url: string, object_key: string, file_name: string): Promise<ArrayBuffer> => {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    return await res.arrayBuffer()
  } catch {
    // fileUrl có thể do private bucket / signed URL hết hạn — xin lại URL mới qua endpoint hiện có của project, không tự ký request.
    if (!isObjectKey(object_key)) throw new Error(documentText(dictionary, 'excel_download_failed'))

    const fresh_url = await documentService.get_presigned_download_url(object_key, {
      file_name,
      mode: 'inline'
    })

    const retry_res = await fetch(fresh_url)
    if (!retry_res.ok) throw new Error(`HTTP ${retry_res.status}`)

    return await retry_res.arrayBuffer()
  }
}

const CenteredState = ({ icon, title, description }: { icon: ReactNode; title: string; description?: string }) => (
  <Stack flex={1} minHeight={0} alignItems="center" justifyContent="center" spacing={1} sx={{ p: 3, textAlign: 'center' }}>
    {icon}
    <Typography fontWeight={700}>{title}</Typography>
    {description && <Typography variant="body2" color="text.secondary">{description}</Typography>}
  </Stack>
)

const ExcelPreview = ({ dictionary, url, object_key, file_name }: { dictionary: DocumentDictionary; url: string; object_key: string; file_name: string }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<ExcelData | null>(null)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError('')
    setData(null)

    const load = async () => {
      try {
        const buffer = await fetchExcelArrayBuffer(dictionary, url, object_key, file_name)
        const workbook = XLSX.read(buffer, { type: 'array' })
        const sheet_name = workbook.SheetNames[0]

        if (!sheet_name) throw new Error(documentText(dictionary, 'excel_no_sheet'))

        const sheet = workbook.Sheets[sheet_name]
        const all_rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 })

        if (!cancelled) {
          setData({
            sheet_name,
            rows: all_rows.slice(0, MAX_EXCEL_ROWS),
            truncated: all_rows.length > MAX_EXCEL_ROWS
          })
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : documentText(dictionary, 'excel_read_failed'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [url, object_key, file_name])

  if (loading) {
    return (
      <Stack flex={1} minHeight={0} alignItems="center" justifyContent="center">
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{documentText(dictionary, 'excel_loading')}</Typography>
      </Stack>
    )
  }

  if (error) {
    return (
      <CenteredState
        icon={<ErrorOutlineIcon sx={{ fontSize: 56, color: 'error.main' }} />}
        title={documentText(dictionary, 'excel_read_failed_title')}
        description={error}
      />
    )
  }

  if (!data || data.rows.length === 0) {
    return <CenteredState icon={<ErrorOutlineIcon sx={{ fontSize: 48, color: 'text.disabled' }} />} title={documentText(dictionary, 'excel_empty_sheet')} />
  }

  const [header_row, ...body_rows] = data.rows

  const cell_sx = {
    maxWidth: 260,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    fontSize: 13
  }

  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', p: 1.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, flexShrink: 0 }}>
        {documentText(dictionary, 'sheet_label')}: {data.sheet_name}
        {data.truncated && (
          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            {documentText(dictionary, 'excel_truncated_prefix')} {MAX_EXCEL_ROWS} {documentText(dictionary, 'excel_truncated_suffix')}
          </Typography>
        )}
      </Typography>

      <TableContainer sx={{ flex: 1, minHeight: 0, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 2 }}>
        <Table stickyHeader size="small" sx={{ minWidth: 'max-content' }}>
          <TableHead>
            <TableRow>
              {(header_row ?? []).map((cell, c) => (
                <TableCell key={c} title={cell != null ? String(cell) : undefined} sx={{ ...cell_sx, fontWeight: 700 }}>
                  {cell != null && cell !== '' ? String(cell) : `${documentText(dictionary, 'column_label')} ${c + 1}`}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {body_rows.map((row, r) => (
              <TableRow key={r} hover>
                {row.map((cell, c) => (
                  <TableCell key={c} title={cell != null ? String(cell) : undefined} sx={cell_sx}>
                    {cell != null ? String(cell) : ''}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

type PreviewContentProps = {
  dictionary: DocumentDictionary
  file: DocumentNodeModel
  is_pdf: boolean
  is_image: boolean
  is_excel: boolean
}

// Keyed bằng file.id ở nơi gọi để mount lại mỗi khi đổi file — tránh phải setState "reset" ngay khi effect chạy.
const DocumentPreviewContent = ({ dictionary, file, is_pdf, is_image, is_excel }: PreviewContentProps) => {
  const object_key = file.file_url ?? file.preview_url ?? ''
  const needs_presign = isObjectKey(object_key)

  const [fetched_url, setFetchedUrl] = useState<string | null>(null)
  const [loading_url, setLoadingUrl] = useState(needs_presign)
  const [url_error, setUrlError] = useState(false)

  useEffect(() => {
    if (!needs_presign) return

    let cancelled = false

    documentService
      .get_presigned_download_url(object_key, {
        file_name: file.file_name ?? file.name,
        mode: 'inline'
      })
      .then(url => {
        if (!cancelled) setFetchedUrl(url)
      })
      .catch(() => {
        if (!cancelled) setUrlError(true)
      })
      .finally(() => {
        if (!cancelled) setLoadingUrl(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needs_presign, object_key])

  const presigned_url = needs_presign ? fetched_url : (object_key || null)
  const can_preview = (is_pdf || is_image) && presigned_url

  if (loading_url) {
    return (
      <Stack flex={1} minHeight={0} alignItems="center" justifyContent="center">
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{documentText(dictionary, 'preview_loading')}</Typography>
      </Stack>
    )
  }

  if (can_preview && is_pdf) {
    return <Box component="iframe" src={presigned_url} title={file.name} sx={{ width: '100%', height: '100%', border: 0 }} />
  }

  if (can_preview && is_image) {
    return (
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', p: 2 }}>
        <Box
          component="img"
          src={presigned_url}
          alt={file.name}
          sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      </Box>
    )
  }

  if (is_excel && presigned_url) {
    return (
      <ExcelPreview
        dictionary={dictionary}
        url={presigned_url}
        object_key={object_key}
        file_name={file.file_name ?? file.name}
      />
    )
  }

  if (url_error) {
    return (
      <CenteredState
        icon={<ErrorOutlineIcon sx={{ fontSize: 56, color: 'error.main' }} />}
        title={documentText(dictionary, 'preview_load_failed')}
        description={documentText(dictionary, 'download_to_view')}
      />
    )
  }

  return (
    <CenteredState
      icon={<DocumentNodeIcon node={file} sx={{ fontSize: 70 }} />}
      title={documentText(dictionary, 'viewer_not_available')}
      description={documentText(dictionary, 'download_to_view')}
    />
  )
}

const MetaRow = ({ label, value }: { label: string; value: string }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
    <Typography variant="body2" sx={{ wordBreak: 'break-word', mt: 0.25 }}>{value}</Typography>
  </Box>
)

const DocumentPreviewDialog = ({ dictionary, file, on_close }: Props) => {
  const theme = useTheme()
  const is_mobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [is_fullscreen, setIsFullscreen] = useState(false)

  const is_pdf = file?.mime_type === 'application/pdf' ||
    normalize_extension(file?.file_extension) === 'pdf'
  const is_image = Boolean(file?.mime_type?.startsWith('image/')) ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(normalize_extension(file?.file_extension))
  const is_excel = is_excel_file(file)

  const handleDownload = async () => {
    if (!file) return

    const object_key = file.file_url ?? ''

    if (!object_key) return

    try {
      const url = isObjectKey(object_key)
        ? await documentService.get_presigned_download_url(object_key, {
            file_name: file.file_name ?? file.name,
            mode: 'attachment'
          })
        : object_key

      const a = document.createElement('a')
      a.href = url
      a.download = file.file_name ?? file.name
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch {
      // silent — user có thể thử lại từ action menu
    }
  }

  const is_full = is_fullscreen || is_mobile

  return (
    <Dialog
      open={Boolean(file)}
      onClose={on_close}
      PaperProps={{
        sx: {
          width: is_full ? '100vw' : { xs: '100vw', sm: '96vw', md: '90vw' },
          height: is_full ? '100vh' : { xs: '100vh', sm: '94vh', md: '88vh' },
          maxWidth: is_full ? '100vw' : { xs: '100vw', sm: '96vw', md: 1500 },
          maxHeight: is_full ? '100vh' : { xs: '100vh', sm: '94vh', md: '88vh' },
          m: is_full ? 0 : { xs: 0, sm: 2 },
          borderRadius: is_full ? 0 : { xs: 0, sm: 3 },
          boxShadow: 8,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }
      }}
    >
      {file && (
        <>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={1}
            sx={{ px: { xs: 2, md: 3 }, py: 2, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}
          >
            <Stack direction="row" alignItems="center" gap={1.5} minWidth={0} flex={1}>
              <DocumentNodeIcon node={file} sx={{ fontSize: 32, flexShrink: 0 }} />
              <Box minWidth={0}>
                <Tooltip title={file.name}>
                  <Typography variant="h6" fontWeight={800} noWrap>{file.name}</Typography>
                </Tooltip>
                <Typography variant="body2" color="text.secondary">
                  {file.file_extension?.toUpperCase()} · {format_file_size(file.file_size)}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" alignItems="center" gap={0.5} flexShrink={0}>
              {!is_mobile && (
                <Tooltip title={is_fullscreen ? documentText(dictionary, 'exit_fullscreen') : documentText(dictionary, 'fullscreen')}>
                  <IconButton onClick={() => setIsFullscreen(current => !current)} size="small">
                    {is_fullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              )}
              <IconButton onClick={on_close} size="small" aria-label={documentText(dictionary, 'close')}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>

          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, overflow: 'hidden' }}>
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                bgcolor: 'action.hover',
                p: { xs: 1.5, sm: 2, md: 3 }
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  overflow: 'hidden'
                }}
              >
                <DocumentPreviewContent
                  key={file.id}
                  dictionary={dictionary}
                  file={file}
                  is_pdf={is_pdf}
                  is_image={is_image}
                  is_excel={is_excel}
                />
              </Box>
            </Box>

            <Box
              sx={{
                width: { xs: '100%', md: 300 },
                flexShrink: 0,
                borderLeft: { xs: 0, md: 1 },
                borderTop: { xs: 1, md: 0 },
                borderColor: 'divider',
                overflow: 'auto',
                p: 3
              }}
            >
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2 }}>{documentText(dictionary, 'document_info')}</Typography>
              <Stack spacing={2}>
                <MetaRow label={documentText(dictionary, 'file_type_label')} value={file.mime_type || file.file_extension || '-'} />
                <MetaRow label={documentText(dictionary, 'size')} value={format_file_size(file.file_size)} />
                <MetaRow label={documentText(dictionary, 'created_by')} value={file.created_by || '-'} />
                <MetaRow label={documentText(dictionary, 'created_at')} value={format_document_date(file.created_on_utc)} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{documentText(dictionary, 'status')}</Typography>
                  <Chip size="small" color={get_status_color(file.status)} label={get_status_label(dictionary, file.status)} />
                </Box>
              </Stack>
            </Box>
          </Box>

          <Stack
            direction="row"
            justifyContent="flex-end"
            gap={1}
            sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider', flexShrink: 0 }}
          >
            <Button onClick={on_close}>{documentText(dictionary, 'close')}</Button>
            <Button
              variant="contained"
              startIcon={<DownloadOutlinedIcon />}
              onClick={handleDownload}
              disabled={!file.file_url}
            >
              {documentText(dictionary, 'download')}
            </Button>
          </Stack>
        </>
      )}
    </Dialog>
  )
}

export default DocumentPreviewDialog
