import CloseIcon from '@mui/icons-material/Close'
import {
    Alert,
    Box,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Link,
    Stack,
    Typography
} from '@mui/material'
import type { ReactNode } from 'react'

import type { ContractItem, ContractsDictionary } from '../types'
import {
    commonText,
    contractsText,
    emptyText,
    formatContractDate,
    formatContractValue,
    getContractStatusLabel
} from './contractHelpers'

type Props = {
    dictionary: ContractsDictionary
    open: boolean
    loading: boolean
    error: string | null
    contract: ContractItem | null
    onClose: () => void
}

const DetailRow = ({ label, children }: { label: string; children: ReactNode }) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '180px 1fr' }, gap: 1.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>{label}</Typography>
        <Box sx={{ minWidth: 0 }}>{children}</Box>
    </Box>
)

const ContractDetailDialog = ({ dictionary, open, loading, error, contract, onClose }: Props) => (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pr: 7, fontWeight: 800 }}>
            {contractsText(dictionary, 'contract_detail', 'Contract Detail')}
            <IconButton
                aria-label={commonText(dictionary, 'close', 'Close')}
                onClick={onClose}
                sx={{ position: 'absolute', right: 12, top: 10 }}
            >
                <CloseIcon />
            </IconButton>
        </DialogTitle>
        <DialogContent dividers>
            {loading ? (
                <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress /></Stack>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : contract ? (
                <Stack spacing={2}>
                    <DetailRow label={contractsText(dictionary, 'contract_number', 'Contract Number')}>{emptyText(contract.contract_number)}</DetailRow>
                    <DetailRow label={contractsText(dictionary, 'contract_title', 'Title')}>{emptyText(contract.title)}</DetailRow>
                    <DetailRow label={contractsText(dictionary, 'project_code', 'Project Code')}>{emptyText(contract.project_code || contract.project_id)}</DetailRow>
                    <DetailRow label={contractsText(dictionary, 'vendor_code', 'Vendor Code')}>{emptyText(contract.vendor_code || contract.vendor_id)}</DetailRow>
                    <DetailRow label={contractsText(dictionary, 'start_date', 'Start Date')}>{formatContractDate(contract.start_date)}</DetailRow>
                    <DetailRow label={contractsText(dictionary, 'end_date', 'End Date')}>{formatContractDate(contract.end_date)}</DetailRow>
                    <DetailRow label={contractsText(dictionary, 'contract_value', 'Contract Value')}>{formatContractValue(contract.contract_value)}</DetailRow>
                    <DetailRow label={contractsText(dictionary, 'status', 'Status')}>{getContractStatusLabel(dictionary, contract.status)}</DetailRow>
                    <DetailRow label={contractsText(dictionary, 'description', 'Description')}>{emptyText(contract.description)}</DetailRow>
                    <DetailRow label={contractsText(dictionary, 'attachment', 'Attachment URL')}>
                        {contract.attachment_url ? (
                            <Link href={contract.attachment_url} target="_blank" rel="noopener noreferrer" sx={{ overflowWrap: 'anywhere' }}>
                                {contract.attachment_url}
                            </Link>
                        ) : '-'}
                    </DetailRow>
                </Stack>
            ) : null}
        </DialogContent>
    </Dialog>
)

export default ContractDetailDialog
