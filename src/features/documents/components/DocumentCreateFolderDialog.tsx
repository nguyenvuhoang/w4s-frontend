import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material'
import { useState } from 'react'

import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import { getWorkflowExecutionId } from '@/shared/utils/workflowError'

import type { CreateDocumentFolderPayload, DocumentFilterModel, DocumentStatus } from '../types'
import { documentText, get_status_label, type DocumentDictionary } from './documentHelpers'

type Props = {
  dictionary: DocumentDictionary
  open: boolean
  saving: boolean
  filter: DocumentFilterModel
  current_folder_name: string
  on_close: () => void
  on_submit: (payload: CreateDocumentFolderPayload) => Promise<void>
}

const extractExecutionId = (err: unknown): string => {
  const from_error = getWorkflowExecutionId(err)
  if (from_error) return from_error

  const with_response = err as { response?: { data?: unknown } }

  return getWorkflowExecutionId(with_response?.response?.data)
}

const DocumentCreateFolderDialog = ({ dictionary, open, saving, filter, current_folder_name, on_close, on_submit }: Props) => {
  const [folder_name, setFolderName] = useState('')
  const [status, setStatus] = useState<DocumentStatus>('active')
  const [field_error, setFieldError] = useState('')
  const [submit_error, setSubmitError] = useState(false)
  const [execution_id, setExecutionId] = useState('')

  const handleClose = () => {
    setFolderName('')
    setStatus('active')
    setFieldError('')
    setSubmitError(false)
    setExecutionId('')
    on_close()
  }

  const handleFolderNameChange = (value: string) => {
    setFolderName(value)
    if (field_error) setFieldError('')
    if (submit_error) {
      setSubmitError(false)
      setExecutionId('')
    }
  }

  const handleSubmit = async () => {
    if (!folder_name.trim()) {
      setFieldError(documentText(dictionary, 'folder_name_required'))
      return
    }

    setFieldError('')
    setSubmitError(false)
    setExecutionId('')

    try {
      await on_submit({
        module_code: filter.module_code,
        parent_id: filter.folder_id ?? '',
        folder_name: folder_name.trim(),
        status
      })
      setFolderName('')
      setStatus('active')
    } catch (err) {
      setSubmitError(true)
      setExecutionId(extractExecutionId(err))
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>{documentText(dictionary, 'create_folder')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label={documentText(dictionary, 'current_folder')} value={current_folder_name} disabled fullWidth />
          <TextField
            label={documentText(dictionary, 'folder_name')}
            value={folder_name}
            error={Boolean(field_error)}
            helperText={field_error}
            onChange={event => handleFolderNameChange(event.target.value)}
            required
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>{documentText(dictionary, 'status')}</InputLabel>
            <Select label={documentText(dictionary, 'status')} value={status} onChange={event => setStatus(event.target.value as DocumentStatus)}>
              <MenuItem value="active">{get_status_label(dictionary, 'active')}</MenuItem>
              <MenuItem value="inactive">{get_status_label(dictionary, 'inactive')}</MenuItem>
            </Select>
          </FormControl>

          {submit_error && (
            <WorkflowErrorAlert
              title={documentText(dictionary, 'create_folder_failed_title')}
              description={
                execution_id
                  ? documentText(dictionary, 'create_folder_failed_with_reference')
                  : documentText(dictionary, 'create_folder_failed_description')
              }
              executionId={execution_id}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>{documentText(dictionary, 'cancel')}</Button>
        <Button variant="contained" disabled={saving} onClick={handleSubmit}>{documentText(dictionary, 'create_folder')}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default DocumentCreateFolderDialog
