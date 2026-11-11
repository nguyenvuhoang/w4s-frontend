'use client'

import { Locale } from '@/configs/i18n';
import { getDictionary } from '@utils/getDictionary';
import ChangePasswordForm from '@features/user/components/ChangePasswordForm';
import { Box } from '@mui/material';
import { Session } from 'next-auth';
import Image from 'next/image';
import Background from '../../shared/Background';
import Footer from '../../shared/Footer';
import LoginHeader from '../../login/components/LoginHeader';

const ChangePassword = ({ dictionary, locale, session }: {
    dictionary: Awaited<ReturnType<typeof getDictionary>>,
    locale: Locale,
    session: Session | null
}) => {
    const lightlogo = '/images/logobank/logo.svg'

    return (
        <Background>
            <Box className="flex w-full min-h-screen items-center justify-center">
                {/* Centered Change Password Card - same style as Login */}
                <Box className="z-10 w-full max-w-xl rounded-lg flex flex-col justify-center px-6 sm:px-10 py-10 mx-4"
                    sx={{
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(6px)',
                        boxShadow: '0 10px 30px rgba(2,6,23,0.08)',
                        border: '1px solid rgba(15, 23, 42, 0.06)'
                    }}
                >
                    <Box
                        sx={{
                            position: 'relative',
                            width: 200,
                            height: 67,
                            mx: 'auto',
                            mb: 8
                        }}
                    >
                        <Image
                            src={lightlogo}
                            alt="IPS Logo"
                            width={200}
                            height={67}
                            loading="eager"
                            style={{ objectFit: 'contain' }}
                            className="mx-auto"
                        />
                    </Box>
                    <Box className="space-y-12 text-center text-gray-800">
                        <LoginHeader
                            appTitle={dictionary['auth'].changepassword || 'Đổi mật khẩu'}
                            welcomeText={dictionary['auth'].firstloginmessage || 'Đây là lần đăng nhập đầu tiên của bạn. Vui lòng thay đổi mật khẩu để tiếp tục.'}
                        />
                        <ChangePasswordForm
                            locale={locale}
                            dictionary={dictionary}
                            session={session}
                        />
                        <Footer dictionary={dictionary} />
                    </Box>
                </Box>
            </Box>
        </Background>
    )
}

export default ChangePassword;
