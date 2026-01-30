/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { Locale } from '@/configs/i18n';
import { FormInput } from '@shared/types/systemTypes';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { Grid } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

dayjs.extend(customParseFormat);

type Props = {
    input: FormInput;
    gridProps: Record<string, number>;
    formData: any;
    language: Locale;
    formMethods: ReturnType<typeof useForm>;
    advancedsearch?: any;
    setAdvancedSearch?: Dispatch<SetStateAction<any>>;
};

const RenderInputDateTimeAdvanceSearch = ({
    input,
    gridProps,
    formData,
    language,
    formMethods,
    advancedsearch,
    setAdvancedSearch,
}: Props) => {

    const columnKey = input.config.structable_read.split('.').pop();

    const [localValue, setLocalValue] = useState(advancedsearch?.[input.default.code] || '');
    const value: Dayjs | null = formData[columnKey] ? dayjs(formData[columnKey], 'DD/MM/YYYY') : dayjs(localValue);


    useEffect(() => {
        if (advancedsearch?.[input.default.code] !== localValue) {
            setLocalValue(advancedsearch?.[input.default.code] || '');
        }
    }, [advancedsearch, input.default.code]);

    return (
        <Grid
            size={gridProps}
            sx={{ marginBottom: '16px' }}
            suppressHydrationWarning
        >
            <Controller
                name={columnKey}
                control={formMethods.control}
                defaultValue={formData[columnKey] || value || null}
                render={({ field, fieldState }) => (
                    <DatePicker
                        label={input.lang?.title?.[language] || input.default?.name || 'Select Date'}
                        value={field.value ? dayjs(field.value, 'DD/MM/YYYY') : null}
                        format="DD/MM/YYYY"
                        onChange={(newValue) => {
                            const formattedValue = newValue ? dayjs(newValue).format('DD/MM/YYYY') : null;
                            field.onChange(formattedValue);
                            setLocalValue(formattedValue);
                            if (setAdvancedSearch) {
                                setAdvancedSearch((prev: Record<string, string>) => ({
                                    ...prev,
                                    [input.default.code]: formattedValue || '',
                                }));
                            }
                        }}
                        slotProps={{
                            textField: {
                                size: 'small',
                                fullWidth: true,
                                error: !!fieldState.error,
                                helperText: fieldState.error?.message || '',
                            },
                            openPickerButton: {
                                sx: {
                                    color: '#225087 !important',
                                    '& .MuiSvgIcon-root': {
                                        color: '#225087 !important',
                                    },
                                },
                                children: (
                                    <>
                                        <CalendarTodayIcon sx={{ marginRight: 1 }} />
                                    </>
                                ),
                            },
                        }}
                    />
                )}
            />

        </Grid>
    );
};

export default RenderInputDateTimeAdvanceSearch;

