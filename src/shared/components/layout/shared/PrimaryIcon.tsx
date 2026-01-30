import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

export const PrimaryIcon = ({ isPrimary }: { isPrimary: boolean | undefined }) => {
    return isPrimary ? (
        <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />
    ) : (
        <CancelIcon sx={{ color: '#f44336', fontSize: 20 }} />
    );
};
