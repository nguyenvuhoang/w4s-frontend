import { Box, IconButton, InputAdornment, Tooltip, Typography, useTheme } from '@mui/material'
import { Controller } from 'react-hook-form'
import InfoIcon from '@mui/icons-material/Info'
import { StyledTextField } from '@/@core/components/custom-inputs/StyledTextField'

interface LoginFieldProps {
    name: 'username' | 'password'
    control: any
    label: string
    error: any
    autoFocus?: boolean
    isPassword?: boolean
    isPasswordShown?: boolean
    onTogglePassword?: () => void
    onClearError?: () => void
    tooltipContent?: React.ReactNode
}

const LoginField = ({
    name,
    control,
    label,
    error,
    autoFocus = false,
    isPassword = false,
    isPasswordShown = false,
    onTogglePassword,
    onClearError,
    tooltipContent
}: LoginFieldProps) => {
    const theme = useTheme()

    return (
        <Controller
            name={name}
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
                <Box className="relative">
                    <StyledTextField
                        {...field}
                        fullWidth
                        autoFocus={autoFocus}
                        type={isPassword ? (isPasswordShown ? 'text' : 'password') : 'text'}
                        label={label}
                        onChange={(e: { target: { value: any } }) => {
                            field.onChange(e.target.value)
                            if (onClearError) onClearError()
                        }}
                        sx={{
                            '& label.Mui-focused': {
                                color: theme.palette.primary.main
                            },
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: theme.palette.primary.main
                                },
                                '&:hover fieldset': {
                                    borderColor: theme.palette.primary.main
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: theme.palette.primary.main
                                }
                            },
                            '& .MuiOutlinedInput-input': {
                                color: `${theme.palette.primary.main} !important`
                            },
                            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: `${theme.palette.primary.main} !important`
                            }
                        }}
                        slotProps={{
                            inputLabel: {
                                style: { color: theme.palette.primary.main }
                            },
                            input: {
                                style: {
                                    color: theme.palette.primary.main,
                                    borderColor: theme.palette.primary.main
                                },
                                classes: {
                                    notchedOutline: 'text-green-border'
                                },
                                ...(isPassword && {
                                    endAdornment: (
                                        <InputAdornment position='end'>
                                            <IconButton
                                                edge='end'
                                                onClick={onTogglePassword}
                                                onMouseDown={e => e.preventDefault()}
                                            >
                                                <i
                                                    className={`!text-[${theme.palette.primary.main}] ${isPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'
                                                        }`}
                                                />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                })
                            }
                        }}
                        error={Boolean(error)}
                        helperText={error?.message}
                    />
                    {tooltipContent && (
                        <Tooltip title={tooltipContent} placement="right">
                            <InfoIcon className="absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer" />
                        </Tooltip>
                    )}
                </Box>
            )}
        />
    )
}

export default LoginField
