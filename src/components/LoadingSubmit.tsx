import { Box } from '@mui/material';
import FallbackSpinner from './spinners';

type LoadingSubmitProps = {
    loadingtext: string;
    position?: 'absolute' | 'fixed';
};

const LoadingSubmit = ({
    loadingtext,
    position = 'fixed',
}: LoadingSubmitProps) => {
    return (
        <Box
            sx={{
                position,
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
            }}
        >
            <FallbackSpinner loadingtext={loadingtext} />
        </Box>
    );
};

export default LoadingSubmit;
