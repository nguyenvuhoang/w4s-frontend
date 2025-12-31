'use client'

import { useImageVariant } from '@/@core/hooks/useImageVariant'
import { WORKFLOWCODE } from '@/data/WorkflowCode'
import { systemServiceApi } from '@/servers/system-service'
import { getDictionary } from '@/utils/getDictionary'
import { encrypt } from '@/utils/O9Extension'
import SwalAlert from '@/utils/SwalAlert'
import type { Mode } from '@core/types'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import {
    Box,
    Button,
    Card,
    CardContent,
    InputAdornment,
    NoSsr,
    TextField,
    Typography
} from '@mui/material'
import { Session } from 'next-auth'
import { signOut } from 'next-auth/react'
import Image from 'next/image'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

type Props = {
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    session: Session | null
    mode?: Mode
    loginname?: string
}

type PasswordFormValues = {
    oldPassword: string
    newPassword: string
    confirmPassword: string
}

const ChangePassword = ({ dictionary, session, mode = 'light', loginname = '' }: Props) => {
    const darkImg = '/images/pages/login-night.jpg'
    const lightImg = '/images/pages/login-day.jpg'
    const authBackground = useImageVariant(mode, lightImg, darkImg)

    const darklogo = '/images/logobank/emi.svg'
    const lightlogo = '/images/logobank/emi.svg'
    const logo = useImageVariant(mode, lightlogo, darklogo)
    const { control, handleSubmit, reset } = useForm<PasswordFormValues>({
        defaultValues: {
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
        }
    })

    const handleUserLogout = async () => {
        try {
            await signOut({ callbackUrl: process.env.NEXT_PUBLIC_APP_URL })
        } catch (error) {
            console.error(error)
        }
    }

    const onSubmit = async (data: PasswordFormValues) => {
        if (data.newPassword !== data.confirmPassword) {
            SwalAlert('warning', dictionary['auth'].passwordnotmatch || 'Passwords do not match', 'center')
            return
        }
        if (data.oldPassword === data.newPassword) {
            SwalAlert('warning', dictionary['auth'].passwordsameasold || 'New password must be different from the old password', 'center')
            return
        }
        try {
            const userName = loginname|| '';
            const encryptedPassword = encrypt(`${userName}_${data.oldPassword}`);

            const apiChangePassword = await systemServiceApi.runFODynamic({
                sessiontoken: session?.user?.token || '',
                workflowid: WORKFLOWCODE.WF_BO_CHANGE_PASSWORD,
                input: {
                    oldPassword: encryptedPassword,
                    password: data.newPassword
                }
            })

            if (apiChangePassword.status === 200) {
                const hasError = apiChangePassword.payload.dataresponse.errors.length > 0;
                if (hasError) {
                    SwalAlert('error', apiChangePassword.payload.dataresponse.errors?.[0]?.info || dictionary['common'].updateerror, 'center')
                } else {
                    SwalAlert('success', dictionary['auth'].passwordchanged || 'Password changed successfully', 'center', false, false, true, () => {
                        handleUserLogout()
                    })
                }

            } else {
                console.error(`Error changing password: ${apiChangePassword.payload.error?.[0]?.info || 'Unknown error'}`);
            }

        } catch (error) {
            console.error('Error changing password:', error)
            const errorMessage = (error instanceof Error) ? error.message : 'Error changing password'
            SwalAlert('error', errorMessage, 'center')
        }

        reset()
    }
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <NoSsr>
            <Box className="flex w-full h-screen">
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
                            src={logo}
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

                            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                                <Controller
                                    name="oldPassword"
                                    control={control}
                                    rules={{
                                        required: 'Current Password is required',
                                        minLength: {
                                            value: 6,
                                            message: dictionary['auth'].passwordminlength || 'Current Password must be at least 6 characters'
                                        }
                                    }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            label={'Current Password'}
                                            type={showOldPassword ? "text" : "password"}
                                            fullWidth
                                            size="small"
                                            sx={textFieldStyle}
                                            error={!!error}
                                            helperText={error?.message}
                                            slotProps={{
                                                input: {
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <Box
                                                                onClick={() => setShowOldPassword(!showOldPassword)}
                                                                sx={{
                                                                    cursor: "pointer",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                }}
                                                            >
                                                                {showOldPassword ? <VisibilityOff /> : <Visibility />}
                                                            </Box>
                                                        </InputAdornment>
                                                    )
                                                }
                                            }}
                                        />
                                    )}
                                />

                                <Box height={16} />

                                <Controller
                                    name="newPassword"
                                    control={control}
                                    rules={{
                                        required: dictionary['auth'].passwordrequired || 'Password is required',
                                        minLength: {
                                            value: 6,
                                            message: dictionary['auth'].passwordminlength || 'Password must be at least 6 characters'
                                        }
                                    }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            label={dictionary['auth'].newpassword || 'New Password'}
                                            type={showNewPassword ? "text" : "password"}
                                            fullWidth
                                            size="small"
                                            sx={textFieldStyle}
                                            error={!!error}
                                            helperText={error?.message}
                                            slotProps={{
                                                input: {
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <Box
                                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                                sx={{
                                                                    cursor: "pointer",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                }}
                                                            >
                                                                {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                                            </Box>
                                                        </InputAdornment>
                                                    )
                                                }
                                            }}
                                        />
                                    )}
                                />

                                <Box height={16} />

                                <Controller
                                    name="confirmPassword"
                                    control={control}
                                    rules={{
                                        required: dictionary['auth'].confirmpasswordrequired || 'Please confirm your password'
                                    }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            label={dictionary['auth'].confirmpassword || 'Confirm Password'}
                                            type={showConfirmPassword ? "text" : "password"}
                                            fullWidth
                                            size="small"
                                            sx={textFieldStyle}
                                            error={!!error}
                                            helperText={error?.message}
                                            slotProps={{
                                                input: {
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <Box
                                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                                sx={{
                                                                    cursor: "pointer",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                }}
                                                            >
                                                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                                            </Box>
                                                        </InputAdornment>
                                                    )
                                                }
                                            }}
                                        />
                                    )}
                                />

                                <Box mt={4} display="flex" justifyContent="center">
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        size="large"
                                        fullWidth
                                        sx={{
                                            background:
                                                'radial-gradient(300.55% 959.41% at 293.35% -237.5%, #00502F 0%, #089356 67.24%, #629F0D 98.3%)',
                                            color: 'white',
                                            '&:hover': { opacity: 0.5 }
                                        }}
                                    >
                                        {dictionary['auth'].changepassword || 'Change Password'}
                                    </Button>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>
        </NoSsr>
    )
}

const textFieldStyle = {
    '& .MuiInputBase-input': {
        color: 'primary.main'
    },
    '& .MuiInputLabel-root': {
        color: 'primary.main'
    },
    '& .MuiOutlinedInput-root': {
        '& fieldset': {
            borderColor: 'primary.main'
        },
        '&:hover fieldset': {
            borderColor: 'primary.dark'
        },
        '&.Mui-focused fieldset': {
            borderColor: 'primary.main'
        }
    }
}

export default ChangePassword
