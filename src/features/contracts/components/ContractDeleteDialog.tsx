import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from '@mui/material'

import type { ContractsDictionary } from '../types'
import { commonText, contractsText } from './contractHelpers'

type Props = {
    dictionary: ContractsDictionary
    open: boolean
    loading: boolean
    onClose: () => void
    onConfirm: () => void
}

const ContractDeleteDialog = ({ dictionary, open, loading, onClose, onConfirm }: Props) => (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>
            {contractsText(dictionary, 'delete_contract', 'Delete Contract')}
        </DialogTitle>
        <DialogContent>
            <DialogContentText>
                {contractsText(dictionary, 'confirm_delete_contract', 'Are you sure you want to delete this contract?')}
            </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={onClose} disabled={loading}>{commonText(dictionary, 'cancel', 'Cancel')}</Button>
            <Button
                variant="contained"
                color="error"
                startIcon={loading ? <CircularProgress color="inherit" size={16} /> : <DeleteOutlineIcon />}
                onClick={onConfirm}
                disabled={loading}
            >
                {commonText(dictionary, 'delete', 'Delete')}
            </Button>
        </DialogActions>
    </Dialog>
)

export default ContractDeleteDialog
