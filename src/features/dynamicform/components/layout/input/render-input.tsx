'use client'

import { Locale } from '@/configs/i18n';
import { FormInput, RuleStrong } from '@/types/systemTypes';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import { Grid, InputAdornment, TextField } from '@mui/material';
import { Session } from 'next-auth';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { disableField } from '../rule/disableField';
import { generateControlValue } from '../rule/generateControlValue';
import { isFieldHidden } from '../rule/isFieldHidden';
import { isFieldRequired } from '../rule/isFieldRequired';
import { getDictionary } from '@/utils/getDictionary';

type Props = {
    session: Session | null;
    input: FormInput;
    gridProps: Record<string, number>;
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    language: Locale;
    rules: RuleStrong[];
    onChange?: (fieldCode: string, value: string) => void;
    renderviewdata?: any;
    ismodify?: boolean;
    fetchControlDefaultValue?: boolean;
    setFetchControlDefaultValue?: Dispatch<SetStateAction<boolean>>;
    formMethods: ReturnType<typeof useForm>;
};

const RenderInputDefault = ({
    session,
    input,
    gridProps,
    dictionary,
    language,
    rules,
    onChange,
    renderviewdata,
    ismodify,
    fetchControlDefaultValue,
    setFetchControlDefaultValue,
    formMethods,
}: Props) => {
    const columnKey = input.config.structable_read.split('.').pop();

    const [controlValue, setControlValue] = useState<string>();
    const [localValue, setLocalValue] = useState<string>(renderviewdata?.[input.default?.code] || '');

    useEffect(() => {
        const fetchControlValue = async () => {
            const value = await generateControlValue(session, columnKey, rules);
            if (!value) return;
            const finalValue = value || '';
            setControlValue(finalValue);
            formMethods.setValue(columnKey, finalValue, { shouldValidate: true });
            setFetchControlDefaultValue && setFetchControlDefaultValue(true);
        };

        if (!fetchControlDefaultValue) fetchControlValue();
    }, [fetchControlDefaultValue]);

    const getDefaultValue = () => {
        if (!input.config?.data_value)
            return renderviewdata?.[input.default?.code] ?? controlValue ?? input.config?.data_default ?? '';

        const keyToFind = input.config.data_value;
        const value = formMethods.getValues(keyToFind);
        return value ?? renderviewdata?.[input.default?.code] ?? controlValue ?? '';
    };


    const hidden = isFieldHidden(rules, columnKey);
    const required = isFieldRequired(input);
    const disable = disableField(rules, columnKey, ismodify);

    const handleBlur = async () => {
        if (!onChange) return;
        onChange(columnKey, localValue);
        await formMethods.trigger(columnKey);
    };

    return (
        <Grid size={gridProps} sx={{ marginBottom: '16px' }} display={hidden ? 'none' : 'block'}>
            <Controller
                name={columnKey}
                control={formMethods.control}
                defaultValue={getDefaultValue()}
                rules={{
                    required: required ? `${dictionary['common'].fieldrequired.replace('{field}', input.lang?.title?.[language] || input.default?.name)}` : false,
                }}
                render={({ field, fieldState }) => (
                    <TextField
                        {...field}
                        fullWidth
                        size="small"
                        placeholder={input.default.condition || ''}
                        variant="outlined"
                        type={input.config.is_password === 'true' ? 'password' : 'text'}
                        value={field.value}
                        label={input.lang?.title?.[language] || input.default?.name || 'Text Input'}
                        slotProps={{
                            input: {
                                endAdornment: required ? (
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
                                ) : null,
                            },
                            inputLabel: {
                                sx: {
                                    '& .MuiInputLabel-asterisk': {
                                        color: 'red',
                                    },
                                },
                            },
                        }}
                        required={required}
                        onBlur={handleBlur}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setLocalValue(newValue);
                            field.onChange(newValue);
                        }}
                        disabled={disable}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        autoComplete='none'
                        multiline = {input.config?.is_text_area === 'true'}
                        rows={input.config?.is_text_area === 'true' ? 3 : 1}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: '#048d48a1 !important',
                                    filter: 'invert(0%) !important',
                                    WebkitFilter: 'invert(0%) !important',
                                },
                                '&:hover fieldset': {
                                    borderColor: '#8e8e8e !important',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#03492a !important',
                                },
                                '&.Mui-error fieldset': {
                                    borderColor: '#d32f2f !important',
                                },
                            },
                            '& .MuiInputBase-input': {
                                color: 'inherit',
                            },
                        }}
                    />
                )}
            />
        </Grid>
    );
};

export default RenderInputDefault;
