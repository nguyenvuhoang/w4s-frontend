import StarIcon from '@mui/icons-material/Star';
import { Box } from '@mui/material';

export const LevelIcon = ({ level }: { level: number | undefined }) => {
    if (!level || level < 1 || level > 5) return '-';
    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {Array.from({ length: level }, (_, index) => (
                <StarIcon key={index} sx={{ color: '#ffca28', fontSize: 20, mr: 0.5 }} />
            ))}
        </Box>
    );
};
