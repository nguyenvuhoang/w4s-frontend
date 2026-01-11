'use client'

import { signOut } from 'next-auth/react'
import { WORKFLOWCODE } from '@/data/WorkflowCode'
import { systemServiceApi } from '@/servers/system-service'
import { getDictionary } from '@/utils/getDictionary'
import SwalAlert from '@/utils/SwalAlert'
import { Lock, Visibility } from '@mui/icons-material'
import {
    Box,
    Button,
    InputAdornment,
    TextField,
    Typography
} from '@mui/material'
import { Session } from 'next-auth'
import { Controller, useForm } from 'react-hook-form'

type Props = {
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    session: Session | null
}

type PasswordFormValues = {
    newPassword: string
    confirmPassword: string
}

const ChangePasswordForm = ({ dictionary, session }: Props) => {
    const { control, handleSubmit, reset } = useForm<PasswordFormValues>({
        defaultValues: {
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
        try {
            const apiChangePassword = await systemServiceApi.runFODynamic({
                sessiontoken: session?.user?.token || '',
                workflowid: WORKFLOWCODE.WF_BO_CHANGE_PASSWORD,
                input: {
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
                console.error(`Error changing password: ${apiChangePassword.payload.dataresponse.errors?.[0]?.info || 'Unknown error'}`);
            }

        } catch (error) {
            console.error('Error changing password:', error)
            const errorMessage = (error instanceof Error) ? error.message : 'Error changing password'
            SwalAlert('error', errorMessage, 'center')
        }

        reset()
    }

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Typography variant="h6" fontWeight="bold" color="primary.main" mb={2}>
                {dictionary['auth'].changepassword || 'Change Password'}
            </Typography>

            <Controller
                name="newPassword"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        label={dictionary['auth'].newpassword}
                        type="password"
                        fullWidth
                        size="small"
                        sx={textFieldStyle}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Lock />
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
                render={({ field }) => (
                    <TextField
                        {...field}
                        label={dictionary['auth'].confirmpassword}
                        type="password"
                        fullWidth
                        size="small"
                        sx={textFieldStyle}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Visibility />
                                    </InputAdornment>
                                )
                            }
                        }}
                    />
                )}
            />

            <Box mt={4} display="flex" justifyContent="flex-end">
                <Button type="submit" variant="contained" color="primary">
                    {dictionary['auth'].changepassword || 'Change Password'}
                </Button>
            </Box>
        </Box>
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

export default ChangePasswordForm
