import { Button, Box, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

type Props = {
    onApprove: () => void;
    onReject: () => void;
    loading?: boolean;
    approveLabel?: string;
    rejectLabel?: string;
};

const ActionButtonGroup = ({
    onApprove,
    onReject,
    loading = false,
    approveLabel = 'Approve',
    rejectLabel = 'Reject',
}: Props) => {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, mb: 2, mr: 2 }}>
            <Button
                variant="outlined"
                color="error"
                startIcon={!loading ? <CancelIcon /> : <CircularProgress size={20} />}
                onClick={onReject}
                disabled={loading}
            >
                {rejectLabel}
            </Button>
            <Button
                variant="contained"
                color="primary"
                startIcon={!loading ? <CheckCircleIcon /> : <CircularProgress size={20} color="inherit" />}
                onClick={onApprove}
                disabled={loading}
            >
                {approveLabel}
            </Button>
        </Box>
    );
};

export default ActionButtonGroup;
