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
    // `position="absolute"` scopes this to the nearest positioned ancestor (a `position:relative`
    // wrapper the caller already renders) — it must size to that container (100%), not the
    // viewport, otherwise it silently behaves like `fixed` again and covers Header/Sidebar when
    // used inside the Dashboard. Only `position="fixed"` (dedicated full-viewport screens) uses
    // viewport units.
    const isFixed = position === 'fixed';

    return (
        <Box
            sx={{
                position,
                top: 0,
                left: 0,
                width: isFixed ? '100vw' : '100%',
                height: isFixed ? '100vh' : '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: isFixed ? 9999 : 10,
            }}
        >
            <FallbackSpinner loadingtext={loadingtext} />
        </Box>
    );
};

export default LoadingSubmit;
