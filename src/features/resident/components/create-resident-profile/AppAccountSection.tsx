import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { Button, Grid, IconButton, InputAdornment } from '@mui/material'
import { Control } from 'react-hook-form'

import { ResidentProfileFormValues } from '../../types'
import { FormTextField, ResidentDictionary, SectionCard, text } from './formControls'

type Props = {
    control: Control<ResidentProfileFormValues>
    dict: ResidentDictionary
    requiredMessage: string
    is_app_account_locked: boolean
    showPassword: boolean
    onGeneratePassword: () => void
    onTogglePasswordVisibility: () => void
}

export function AppAccountSection({
    control,
    dict,
    requiredMessage,
    is_app_account_locked,
    showPassword,
    onGeneratePassword,
    onTogglePasswordVisibility
}: Props) {
    return (
        <SectionCard title={text(dict, 'section_app_account', 'Tài khoản đăng nhập app')} icon={<PhoneAndroidIcon sx={{ fontSize: 24, color: 'white' }} />}>
            <Grid container spacing={5}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <FormTextField
                        control={control}
                        name="username"
                        label={text(dict, 'username', 'Tên tài khoản')}
                        required
                        requiredMessage={requiredMessage}
                        disabled={is_app_account_locked}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <FormTextField
                        control={control}
                        name="password"
                        label={text(dict, 'password', 'Mật khẩu')}
                        type={showPassword ? 'text' : 'password'}
                        requiredMessage={requiredMessage}
                        disabled={is_app_account_locked}
                        endAdornment={(
                            <InputAdornment position="end">
                                <IconButton edge="end" onClick={onTogglePasswordVisibility} disabled={is_app_account_locked}>
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        )}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Button type="button" variant="outlined" startIcon={<AutoFixHighIcon />} onClick={onGeneratePassword} disabled={is_app_account_locked}>
                        {text(dict, 'generate_password', 'Generate Password')}
                    </Button>
                </Grid>
            </Grid>
        </SectionCard>
    )
}
