import { Box } from '@mui/material';

const LeftSide = () => {
    const lightImg = '/images/pages/login-day.jpg';
    const authBackground = lightImg;

    return (
        <>
            {/* Left Side - Background Image */}
            <Box
                className="hidden md:block w-[70%] h-full"
                sx={{
                    position: 'relative',
                    backgroundImage: `url(${authBackground})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        boxShadow: 'inset 0 0 120px 80px rgba(255, 255, 255, 1)',
                        pointerEvents: 'none',
                    },
                }}
            />
        </>
    );
};

export default LeftSide;
