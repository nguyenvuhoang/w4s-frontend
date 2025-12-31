'use client'

import { useImageVariant } from '@/@core/hooks/useImageVariant'
import type { Locale } from '@/configs/i18n'
import type { Mode } from '@core/types'
import { Box, NoSsr } from '@mui/material'
import Image from 'next/image'
// Util Imports
import { getDictionary } from '@/utils/getDictionary'
import { QRCode } from 'react-qrcode-logo'
import { Button, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getDeviceInfo } from '@/utils/getDeviceInfo'
import { authenticate } from '@/actions'
import { getLocalizedUrl } from '@/utils/i18n'
import LoadingSubmit from '@/components/LoadingSubmit'



const VerifyDevice = ({ mode, dictionary, locale }: {
    mode: Mode,
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    locale: Locale
}) => {

    /**
     * Vars Image
     */
    const darkImg = '/images/pages/login-night.jpg'
    const lightImg = '/images/pages/login-day.jpg'
    const authBackground = useImageVariant(mode, lightImg, darkImg)

    const darklogo = '/images/pages/logo-night.svg'
    const lightlogo = '/images/pages/logo.svg'
    const logo = useImageVariant(mode, lightlogo, darklogo)

    const [verifyCode, setVerifyCode] = useState('')
    const [countdown, setCountdown] = useState(30)
    const [inputCode, setInputCode] = useState('')
    const [isVerified, setIsVerified] = useState(false)
    const [inputError, setInputError] = useState(false)
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [deviceId, setDeviceId] = useState('')
    const [errorState, setErrorState] = useState<{ message: string[] } | null>(null)
    const [loading, setLoading] = useState(false)

    //hook
    const router = useRouter()


    const generateCode = () => {
        const newCode = Math.floor(10000000 + Math.random() * 90000000).toString()
        setVerifyCode(newCode)
        setCountdown(30)
    }

    useEffect(() => {
        generateCode()

        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    generateCode()
                    return 30
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(countdownInterval)
    }, [])

    const handleVerify = () => {
        if (inputCode === verifyCode) {
            setIsVerified(true)
        } else {
            setInputError(true)
            setTimeout(() => setInputError(false), 2000)
        }
    }

    useEffect(() => {
        const allowed = sessionStorage.getItem('allowVerifyDevice') === '1'
        const storedUsername = sessionStorage.getItem('verifyUsername')
        const storedDeviceId = sessionStorage.getItem('verifyDeviceId')

        if (!allowed || !storedUsername || !storedDeviceId) {
            router.replace('/login')
        } else {
            setUsername(storedUsername)
            setDeviceId(storedDeviceId)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    const handleSubmitVerify = async () => {
        setLoading(true)
        try {
            const my_device = await getDeviceInfo();

            const res = await authenticate(
                username,
                password,
                JSON.stringify(my_device),
                locale,
                undefined,
                true
            )

            if (res && (res.error === null || res.error === '')) {
                sessionStorage.removeItem('allowVerifyDevice')
                sessionStorage.removeItem('verifyUsername')
                sessionStorage.removeItem('deviceId')
                router.replace(getLocalizedUrl(`/`, locale as Locale))
            } else {
                if (res?.error) {
                    setErrorState({ message: [dictionary['auth'].usernamepasswordincorrect] })
                }
            }

        } catch (error) {
            console.error('Verify error:', error)
            alert('Đã xảy ra lỗi khi xác minh.')
        }
        finally {
            setLoading(false)
        }
    }


    return (
        <>
            <NoSsr>
                <Box className="relative">
                    {loading &&
                       <LoadingSubmit loadingtext={dictionary['common'].loading} />
                    }
                    <Box
                        className='fixed top-0 left-0 w-full h-full'
                        style={{ backgroundImage: `url(${authBackground})`, backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center' }}
                    >
                        <Box className="relative w-full h-full overflow-auto">
                            <Box className="elipse"></Box>
                            <Box className="grid p-6 gap-14 grid-rows-[auto,1fr,auto] sm:p-10">
                                {/* Header */}
                                <Box className="header">
                                    <Box className="logo">
                                        <Image src={logo} className='sm:h-[67px] h-[40px]' width={200} height={70} alt='Logo'></Image>
                                    </Box>
                                </Box>
                                {/* Content */}


                                <Box
                                    sx={{
                                        maxWidth: 600,
                                        margin: '0 auto',
                                        backgroundColor: 'background.paper',
                                        borderRadius: 4,
                                        boxShadow: 3,
                                        p: 4,
                                    }}
                                >
                                    <Typography variant="h4" className='text-center my-5' gutterBottom>
                                        {dictionary['auth'].verifynewdevice}
                                    </Typography>

                                    <Typography variant="body1" sx={{ mb: 2 }}>
                                        {dictionary['auth'].yournewdevice}: <strong>{deviceId}</strong>
                                    </Typography>

                                    <Typography variant="body1" sx={{ mb: 2 }}>
                                        {dictionary['auth'].yourusername}: <strong>{username}</strong>
                                    </Typography>

                                    <TextField
                                        type="password"
                                        label={dictionary['auth'].reenterpassword}
                                        fullWidth
                                        sx={{ mb: 3 }}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />

                                    {errorState &&
                                        <Box className="bg-red-50 border border-red-300 text-red-800 text-sm rounded-md px-4 py-3 mb-4">
                                            {errorState.message.map((msg, idx) => (
                                                <Box key={idx}>{msg}</Box>
                                            ))}
                                        </Box>
                                    }


                                    {!isVerified ? (
                                        <Box
                                            sx={{
                                                border: '1px dashed',
                                                borderColor: 'grey.400',
                                                p: 2,
                                                mb: 2,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: 1
                                            }}
                                        >
                                            <QRCode
                                                value={verifyCode || '00000000'}
                                                size={200}
                                                bgColor="#ffffff"
                                                fgColor="#000000"
                                            />

                                            <Typography variant="body2" color="text.secondary">
                                                {dictionary['auth'].scanqrcodetoverify} {countdown}s
                                            </Typography>

                                            <motion.div
                                                animate={inputError ? { x: [-5, 5, -5, 5, 0] } : {}}
                                                transition={{ duration: 0.4 }}
                                                style={{ width: '100%' }}
                                            >
                                                <TextField
                                                    type="text"
                                                    label={dictionary['auth'].entercodefromqr}
                                                    fullWidth
                                                    sx={{ mt: 2 }}
                                                    value={inputCode}
                                                    onChange={(e) => setInputCode(e.target.value)}
                                                    onBlur={handleVerify}
                                                    error={inputError}
                                                    helperText={inputError ? dictionary['auth'].invalidcode : ''}
                                                />
                                            </motion.div>
                                        </Box>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.4 }}
                                        >
                                            <Box
                                                sx={{
                                                    p: 4,
                                                    mb: 2,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: 2,
                                                    border: '2px solid',
                                                    borderColor: 'primary.main'
                                                }}
                                            >
                                                <Typography variant="h5" color="primary.main" sx={{ mb: 2 }}>
                                                    ✅ {dictionary['auth'].verifycodesuccess}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {dictionary['auth'].verifycontinue}
                                                </Typography>
                                            </Box>
                                        </motion.div>
                                    )}


                                    {/* Nút xác nhận */}
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        sx={{ marginTop: 10 }} fullWidth
                                        disabled={!isVerified || !password}
                                        onClick={handleSubmitVerify}
                                    >
                                        {dictionary['common'].confirm}
                                    </Button>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            textAlign: 'right',
                                            mt: 2
                                        }}
                                    >
                                        <Link replace href="/login" style={{ textDecoration: 'none', color: "green", fontSize: '14px' }}>
                                            ← {dictionary['auth'].backtologin}
                                        </Link>
                                    </Typography>
                                </Box>


                            </Box>
                        </Box>
                    </Box>
                </Box>
            </NoSsr>

        </>
    )
}

export default VerifyDevice
