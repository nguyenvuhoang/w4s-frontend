'use client';

import { useReportConfig } from '@/@core/components/jSelect/supFunc';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import { Box, FormControl, Grid, InputLabel, MenuItem, Select } from '@mui/material';
import { Session } from 'next-auth';
import { Controller, useForm } from 'react-hook-form';

type Props = {
    formMethods: ReturnType<typeof useForm>;
    controlname: string
    paramname: string
    ddlstore: string
    ddltext: string
    ddlvalue: string
    session: Session | null
};

const RenderSelectDefault = ({
    formMethods,
    controlname,
    paramname,
    ddlstore,
    ddltext,
    ddlvalue,
    session,
}: Props) => {

    const renderSelectData = useReportConfig(ddlstore, session);


    const options = renderSelectData?.map((item: any) => {
        const keySelected = ddlvalue;
        const keyDisplay = ddltext;

        const value = keySelected
            ? item[keySelected] || item.c_cdlist?.cdid || item?.codeid || ''
            : item.c_cdlist?.cdid || item?.codeid || '';
        const label =
            keySelected && keyDisplay
                ? item[keySelected]
                    ? item[keySelected] + '-' + (item[keyDisplay] || '')
                    : item.c_cdlist?.caption || item?.caption || ''
                : item.c_cdlist?.caption || item?.caption || '';

        return {
            value,
            label,
        };
    });


    return (
        <Grid size={{ xs: 12 }} sx={{ marginBottom: '16px' }}>
            <Controller
                name={paramname}
                control={formMethods.control}
                defaultValue={undefined}
                rules={{
                    required: true
                }}
                render={({ field, fieldState }) => (
                    <FormControl
                        fullWidth
                        size="small"
                        error={!!fieldState.error}
                    >
                        <InputLabel id={controlname}>
                            {controlname || 'Select Option'}
                        </InputLabel>
                        <Select
                            {...field}
                            labelId={paramname}
                            label={controlname}
                            value={field.value || ''} 
                        >
                            {options.map((option: { value: string; label: string }, index: number) => (
                                <MenuItem key={index} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>

                        <Box
                            sx={{
                                position: 'absolute',
                                right: '40px',
                                top: `${fieldState.error ? '15%' : '50%'}`,
                                transform: 'translateY(-50%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                animation: fieldState.error ? 'spin 1s linear infinite' : 'none',
                            }}
                        >
                            <AcUnitIcon
                                sx={{
                                    color: 'red',
                                    fontSize: '1.5rem',
                                }}
                            />
                        </Box>


                        {fieldState.error && (
                            <Box sx={{ color: 'red', mt: 1, fontSize: '0.75rem' }}>
                                {fieldState.error.message}
                            </Box>
                        )}
                    </FormControl>
                )}
            />
        </Grid>
    );
};

export default RenderSelectDefault;
