import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'

import type { DocumentConfirmAction } from '../hooks/use_document_manager'
import { documentText, type DocumentDictionary } from './documentHelpers'

type Props = {
  dictionary: DocumentDictionary
  confirm_action: DocumentConfirmAction
  on_close: () => void
  on_confirm: () => void
}

const DocumentConfirmDialog = ({ dictionary, confirm_action, on_close, on_confirm }: Props) => {
  if (confirm_action?.type === 'delete') return null

  return (
    <Dialog open={Boolean(confirm_action)} onClose={on_close} maxWidth="xs" fullWidth>
      <DialogTitle>{documentText(dictionary, 'confirm_status_title')}</DialogTitle>
      <DialogContent>
        <Typography>{documentText(dictionary, 'confirm_status_message')}</Typography>
        {confirm_action?.row.name && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            "{confirm_action.row.name}"
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={on_close}>{documentText(dictionary, 'cancel')}</Button>
        <Button color="primary" variant="contained" onClick={on_confirm}>
          {documentText(dictionary, 'confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DocumentConfirmDialog
