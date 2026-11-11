import CloseIcon from '@mui/icons-material/Close'
import SaveIcon from '@mui/icons-material/Save'
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack } from '@mui/material'

import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'

import type { usePartnerCreate } from '../hooks/usePartnerCreate'
import { commonText, partnerText } from '../partnerHelpers'
import type { PartnerDictionary } from '../types'
import PartnerEditForm from './PartnerEditForm'

type Props = {
  dictionary: PartnerDictionary
  create: ReturnType<typeof usePartnerCreate>
}

const PartnerCreateDialog = ({ dictionary, create }: Props) => {
  const locked = create.submitting || create.created

  return (
    // The success SwalAlert opens above this dialog; don't let the dialog's focus trap steal its focus.
    <Dialog open={create.open} onClose={create.submitting ? undefined : create.close} fullWidth maxWidth="md" disableEnforceFocus>
      <DialogTitle sx={{ pr: 7, fontWeight: 800 }}>
        {partnerText(dictionary, 'create_dialog_title', 'Add Partner')}
        <IconButton aria-label={commonText(dictionary, 'close', 'Close')} onClick={create.close} disabled={create.submitting} sx={{ position: 'absolute', right: 12, top: 10 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {create.error && <WorkflowErrorAlert title={partnerText(dictionary, 'create_failed', 'Unable to create partner.')} description={create.error.message} executionId={create.error.executionId} referenceLabel={partnerText(dictionary, 'error_reference_label', 'Error Reference')} copyLabel={commonText(dictionary, 'copy', 'Copy')} copySuccessMessage={partnerText(dictionary, 'copy_error_reference_success', 'Copied error reference.')} copyFailedMessage={partnerText(dictionary, 'copy_error_reference_failed', 'Unable to copy error reference.')} />}
          <PartnerEditForm dictionary={dictionary} mode="create" values={create.values} errors={create.fieldErrors} updateValue={create.updateValue} disabled={locked} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={create.close} disabled={create.submitting}>{commonText(dictionary, 'cancel', 'Cancel')}</Button>
        <Button variant="contained" startIcon={create.submitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />} onClick={() => void create.submit()} disabled={locked}>
          {create.submitting ? commonText(dictionary, 'processing', 'Processing...') : partnerText(dictionary, 'create_submit_button', 'Save Partner')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PartnerCreateDialog
