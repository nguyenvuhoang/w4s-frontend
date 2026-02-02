import { Box } from '@mui/material';
import Image from 'next/image';

const Center = ({ children }: { children: React.ReactNode }) => {
    const lightlogo = '/images/logobank/emi.svg'
    return (
        <>
            <Box className="w-full md:w-[30%] h-full bg-white flex flex-col justify-center px-6 sm:px-10 py-10">
                <Box
                    sx={{
                        position: 'relative',
                        width: 200,
                        height: 67,
                        mx: 'auto', // center horizontally
                        mb: 8
                    }}
                >
                    <Image
                        src={lightlogo}
                        alt="EMI Logo"
                        width={200}
                        height={67}
                        style={{ objectFit: 'contain' }}
                        className="mx-auto"
                    />
                </Box>
                <Box className="space-y-12 text-center text-white body">
                    {children}
                </Box>
            </Box>
        </>
    );
};

export default Center;
