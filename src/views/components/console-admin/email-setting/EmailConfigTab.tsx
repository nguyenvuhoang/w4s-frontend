'use client';

import {
    Button,
    Checkbox,
    CircularProgress,
    FormControlLabel,
    Grid,
    IconButton,
    InputAdornment,
    TextField
} from '@mui/material';
import { Controller } from 'react-hook-form';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { getDictionary } from '@/utils/getDictionary';
import { useState } from 'react';

const EmailConfigTab = ({
    loading,
    control,
    handleSubmit,
    dictionary,
    handleSave,
    handleTestConnection,
    saving = false,
    testing = false
}: {
    loading: boolean,
    control: any,
    handleSubmit: any,
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    handleSave: (data: any) => void,
    handleTestConnection: (data: any) => void,
    saving?: boolean,
    testing?: boolean
}) => {

    const [showPassword, setShowPassword] = useState(false);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-10">
                <CircularProgress size={20} color="primary" />
            </div>
        );
    }


    return (
        <form onSubmit={handleSubmit(handleSave)}>
            <Grid container spacing={5}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="smtpServer"
                        control={control}
                        render={({ field }) => (
                            <TextField {...field} fullWidth label={dictionary['email'].smtpserver} />
                        )}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="smtpPort"
                        control={control}
                        render={({ field }) => (
                            <TextField {...field} fullWidth label={dictionary['email'].smtpport} type="number" />
                        )}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="senderEmail"
                        control={control}
                        render={({ field }) => (
                            <TextField {...field} fullWidth label={dictionary['email'].sendemail} type="email" />
                        )}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="email_test"
                        control={control}
                        render={({ field }) => (
                            <TextField {...field} fullWidth label={dictionary['email'].testmail} type="email" />
                        )}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                type={showPassword ? 'text' : 'password'}
                                label={dictionary['email'].smtppassword}
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)}>
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }
                                }}
                            />
                        )}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="useTLS"
                        control={control}
                        render={({ field }) => (
                            <FormControlLabel
                                control={<Checkbox {...field} checked={field.value} />}
                                label={dictionary['email'].enabletls}
                            />
                        )}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        type="submit"
                        disabled={saving}
                    >
                        {saving ? <CircularProgress size={20} /> : dictionary['email'].saveconfig}
                    </Button>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Button
                        variant="outlined"
                        color="secondary"
                        fullWidth
                        onClick={handleSubmit(handleTestConnection)}
                        disabled={testing}
                    >
                        {testing ? <CircularProgress size={20} /> : dictionary['email'].testconnection}
                    </Button>
                </Grid>
            </Grid>
        </form>
    );
};

export default EmailConfigTab;
