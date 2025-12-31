import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

export const OptionIcon = ({ isOption }: { isOption: boolean | undefined }) => {
    return isOption ? (
        <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />
    ) : (
        <CancelIcon sx={{ color: '#f44336', fontSize: 20 }} />
    );
};
