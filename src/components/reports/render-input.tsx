'use client'

import AcUnitIcon from '@mui/icons-material/AcUnit';
import { Grid, InputAdornment, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';

type Props = {
    formMethods: ReturnType<typeof useForm>,
    controlname: string
    paramname: string
};

const RenderInputDefault = ({
    formMethods,
    controlname,
    paramname
}: Props) => {


    return (
        <Grid size={{ xs: 12 }} sx={{ marginBottom: '16px' }} >
            <Controller
                name={paramname}
                control={formMethods.control}
                rules={{
                    required: true
                }}
                render={({ field, fieldState }) => (
                    <TextField
                        {...field}
                        fullWidth
                        size="small"
                        variant="outlined"
                        type='text'
                        label={controlname || 'Text Input'}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment
                                        position="end"
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            animation: fieldState.error ? 'spin 1s linear infinite' : 'none',
                                        }}
                                    >
                                        <AcUnitIcon sx={{ color: 'red !important' }} />
                                    </InputAdornment>
                                )
                            },
                            inputLabel: {
                                sx: {
                                    '& .MuiInputLabel-asterisk': {
                                        color: 'red',
                                    },
                                },
                            },
                        }}
                        required={true}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                    />
                )}
            />
        </Grid>
    );
};

export default RenderInputDefault;
