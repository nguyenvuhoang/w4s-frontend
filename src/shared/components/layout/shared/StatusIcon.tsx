import VerifiedIcon from '@mui/icons-material/Verified';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import DeleteIcon from '@mui/icons-material/Delete';
import BlockFlippedIcon from '@mui/icons-material/BlockFlipped';
export const StatusIcon = ({ status }: { status: string | boolean | undefined }) => {
    switch (status) {
        case 'A':
        case 'N':
        case '1':
        case 'COMPLETE':
        case true:
            return <VerifiedIcon sx={{ color: '#4caf50', mx: 1 }} />;
        case 'P':
            return <HourglassEmptyIcon sx={{ color: '#ff9800', mx: 1 }} />;
        case 'D':
            return <DeleteIcon sx={{ color: '#f44336', mx: 1 }} />;
        case 'R':
            return <DeleteIcon sx={{ color: '#f44336', mx: 1 }} />;
        case 'G':
            return <HourglassTopIcon sx={{ color: '#f44336', mx: 1 }} />;
        case '0':
        case 'I':
        case 'B':
            return <BlockFlippedIcon sx={{ color: '#f44336', mx: 1 }} />;
        case '2':
            return <DeleteIcon sx={{ color: '#f44336', mx: 1 }} />;
        default:
            return null;
    }
};
