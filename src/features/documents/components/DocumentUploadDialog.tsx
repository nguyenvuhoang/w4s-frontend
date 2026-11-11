import { useState } from 'react'

import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CloseIcon from '@mui/icons-material/Close'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import FolderIcon from '@mui/icons-material/Folder'
import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material'

import type { DocumentFilterModel, UploadDocumentsPayload } from '../types'
import { documentText, type DocumentDictionary } from './documentHelpers'

type Props = {
  dictionary: DocumentDictionary
  open: boolean
  saving: boolean
  filter: DocumentFilterModel
  current_folder_name: string
  on_close: () => void
  on_submit: (payload: UploadDocumentsPayload) => Promise<void>
}

const file_key = (file: File) => `${file.name}-${file.size}-${file.lastModified}`

const DocumentUploadDialog = ({ dictionary, open, saving, filter, current_folder_name, on_close, on_submit }: Props) => {
  const [files, setFiles] = useState<File[]>([])
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  const handleClose = () => {
    if (saving) return
    setFiles([])
    setDescription('')
    setError('')
    setDragging(false)
    on_close()
  }

  const handleFilesSelected = (selected: File[]) => {
    if (selected.length === 0) return
    setFiles(selected)
    setError('')
  }

  const handleRemoveFile = (index: number) => {
    setFiles(current => current.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError(documentText(dictionary, 'select_file_required'))
      return
    }

    setError('')

    try {
      await on_submit({
        module_code: filter.module_code,
        parent_id: filter.folder_id ?? '',
        files,
        status: 'active',
        description: description.trim() || undefined
      })
      setFiles([])
      setDescription('')
    } catch (err) {
      setError(err instanceof Error ? err.message : documentText(dictionary, 'upload_failed'))
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: 720,
          m: { xs: 1.5, sm: 4 },
          borderRadius: 3,
          maxHeight: 'calc(100vh - 64px)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 3,
            py: 2.25,
            bgcolor: 'primary.lighterOpacity',
            borderBottom: '1px solid',
            borderColor: 'primary.lightOpacity'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: 'primary.lightOpacity',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <CloudUploadIcon sx={{ color: 'primary.main' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.dark' }}>
              {documentText(dictionary, 'upload_dialog_title')}
            </Typography>
          </Stack>

          <IconButton onClick={handleClose} disabled={saving} size="small" aria-label={documentText(dictionary, 'close')}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.75 }}>
              {documentText(dictionary, 'current_folder')}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                minWidth: 0,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                px: 1.5,
                py: 1.25,
                bgcolor: 'background.paper',
                transition: 'border-color .15s ease',
                '&:hover': { borderColor: 'primary.main' }
              }}
            >
              <FolderIcon sx={{ color: 'primary.main' }} fontSize="small" />
              <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
                {current_folder_name}
              </Typography>
            </Box>
          </Box>

          <Box
            component="label"
            sx={{
              display: 'block',
              border: '2px dashed',
              borderColor: dragging ? 'primary.main' : 'divider',
              borderRadius: '12px',
              bgcolor: dragging ? 'primary.lighterOpacity' : 'background.paper',
              px: 3,
              py: 4,
              textAlign: 'center',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
              transition: 'background-color .2s ease, border-color .2s ease',
              '&:hover': saving ? undefined : { bgcolor: 'primary.lighterOpacity', borderColor: 'primary.main' },
              '&:hover .upload-dropzone-icon': saving ? undefined : { transform: 'translateY(-4px)' }
            }}
            onDragOver={event => {
              event.preventDefault()
              if (!saving) setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={event => {
              event.preventDefault()
              setDragging(false)
              if (saving) return
              handleFilesSelected(Array.from(event.dataTransfer.files ?? []))
            }}
          >
            <CloudUploadIcon
              className="upload-dropzone-icon"
              sx={{ fontSize: 44, color: 'primary.main', transition: 'transform .2s ease' }}
            />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 1 }}>
              {documentText(dictionary, 'choose_file')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {documentText(dictionary, 'dropzone_hint')}
            </Typography>

            <input
              hidden
              multiple
              type="file"
              disabled={saving}
              onChange={event => {
                handleFilesSelected(Array.from(event.target.files ?? []))
                event.target.value = ''
              }}
            />
          </Box>

          {files.length > 0 && (
            <Stack spacing={1}>
              {files.map((file, index) => (
                <Box
                  key={file_key(file)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    minWidth: 0,
                    border: '1px solid',
                    borderColor: 'success.lightOpacity',
                    bgcolor: 'success.lighterOpacity',
                    borderRadius: 2,
                    px: 1.5,
                    py: 1,
                    animation: 'document-upload-selected-glow 1.8s ease-in-out 2',
                    '@keyframes document-upload-selected-glow': {
                      '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 100, 0, 0.12)' },
                      '50%': { boxShadow: '0 0 0 5px rgba(0, 100, 0, 0.08)' }
                    }
                  }}
                >
                  <CheckCircleIcon sx={{ color: 'success.main' }} fontSize="small" />

                  <Tooltip title={file.name}>
                    <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0, fontWeight: 600, color: 'success.dark' }}>
                      {file.name}
                    </Typography>
                  </Tooltip>

                  <Chip label={documentText(dictionary, 'selected')} size="small" color="success" variant="outlined" sx={{ flexShrink: 0 }} />

                  <IconButton
                    size="small"
                    disabled={saving}
                    onClick={() => handleRemoveFile(index)}
                    aria-label={`${documentText(dictionary, 'remove_file')} ${file.name}`}
                    sx={{ flexShrink: 0 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          )}

          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.75 }}>
              {documentText(dictionary, 'description_optional')}
            </Typography>
            <TextField
              value={description}
              onChange={event => setDescription(event.target.value)}
              multiline
              minRows={4}
              maxRows={6}
              fullWidth
              disabled={saving}
              placeholder={documentText(dictionary, 'description_placeholder')}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: '12px' },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                  borderWidth: 2
                }
              }}
            />
          </Box>

          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
        </Stack>
      </DialogContent>

      <DialogActions className="dialog-actions-bordered" sx={{ px: 3 }}>
        <Button onClick={handleClose} disabled={saving} variant="outlined" color="inherit">
          {documentText(dictionary, 'cancel')}
        </Button>
        <Button
          variant="contained"
          disabled={saving || files.length === 0}
          onClick={handleSubmit}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
        >
          {saving ? documentText(dictionary, 'uploading') : documentText(dictionary, 'upload_action')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DocumentUploadDialog
