import { Locale } from '@/configs/i18n';
import { getDictionary } from '@/utils/getDictionary';
import ChangePasswordForm from '@features/user/components/ChangePasswordForm';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { Session } from 'next-auth';
import Image from 'next/image';

const ChangePassword = ({ dictionary, locale, session }: {
    dictionary: Awaited<ReturnType<typeof getDictionary>>,
    locale: Locale,
    session: Session | null
}) => {
    const lightImg = '/images/pages/login-day.jpg'
    const lightlogo = '/images/logobank/emi.svg'

    return (
        <Box className="flex w-full h-screen">
            {/* Left Side - Background Image */}
            <Box
                className="hidden md:block w-[70%] h-full"
                sx={{
                    position: 'relative',
                    backgroundImage: `url(${lightImg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        boxShadow: 'inset 0 0 120px 80px rgba(255, 255, 255, 1)',
                        pointerEvents: 'none',
                    }
                }}
            />

            {/* Right Side - Change Password Form */}
            <Box className="w-full md:w-[30%] h-full bg-white flex flex-col justify-center px-6 sm:px-10 py-10">
                <Box
                    sx={{
                        position: 'relative',
                        width: 200,
                        height: 67,
                        mx: 'auto',
                        mb: 4
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

                <Card sx={{ width: '100%', boxShadow: 'none' }}>
                    <CardContent sx={{ p: 2 }}>
                        <Typography variant="h5" fontWeight="bold" color="primary.main" mb={1} textAlign="center">
                            {dictionary['auth'].changepassword || 'Change Password'}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" mb={3} textAlign="center">
                            {dictionary['auth'].firstloginmessage || 'This is your first login. Please change your password to continue.'}
                        </Typography>
                        <ChangePasswordForm locale={locale} dictionary={dictionary} session={session} />
                    </CardContent>
                </Card>

            </Box>

        </Box>

    );
}

export default ChangePassword;
