'use client';

import { Locale } from '@/configs/i18n';
import { FormInput, RuleStrong } from '@shared/types/systemTypes';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import { Grid, InputAdornment, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { isFieldHidden } from '../rule/isFieldHidden';
import { isFieldRequired } from '../rule/isFieldRequired';
import { disableField } from '../rule/disableField';
import { formatCurrency } from '@utils/formatCurrency';
import { evaluateDefault } from '@utils/evaluateDefault';

type Props = {
    input: FormInput;
    gridProps: Record<string, number>;
    language: Locale;
    rules: RuleStrong[];
    formMethods: ReturnType<typeof useForm>;
    onChange?: (fieldCode: string, value: string) => void;
    renderviewdata?: any;
    ismodify?: boolean;
};

const RenderInputCurrency = ({
    input,
    gridProps,
    language,
    rules,
    formMethods,
    onChange,
    renderviewdata,
    ismodify,
}: Props) => {
    const columnKey = input.config.structable_read.split('.').pop();
    const required = isFieldRequired(input);
    const hidden = isFieldHidden(rules, columnKey);
    const disable = disableField(rules, columnKey, ismodify);
    const min = Number(input.validate?.min || 0);
    const max = Number(input.validate?.max || Infinity);

    const currencyField = input.config.currency_field || '';
    const currencyValue = renderviewdata?.[currencyField] || '';

    const defaultValue =
        renderviewdata?.[input.default?.code] ??
        evaluateDefault(input.config?.data_default || '') ??
        '';

    return (
        <Grid
            size={gridProps}
            sx={{ marginBottom: '16px' }}
            display={hidden ? 'none' : 'block'}
        >
            <Controller
                name={columnKey}
                control={formMethods.control}
                defaultValue={formMethods.getValues(columnKey) ?? defaultValue}
                rules={{
                    required: required
                        ? `${input.lang?.title?.[language] || input.default?.name} is required`
                        : false,
                    min: { value: min, message: `Minimum is ${min}` },
                    max: { value: max, message: `Maximum is ${max}` },
                }}
                render={({ field, fieldState }) => (
                    <TextField
                        {...field}
                        fullWidth
                        size="small"
                        placeholder={input.default.condition || ''}
                        variant="outlined"
                        type="text"
                        value={formatCurrency(Number(field.value || 0), currencyValue)}
                        label={
                            input.lang?.title?.[language] || input.default?.name || 'Text Input'
                        }
                        slotProps={{
                            input: {
                                inputMode: 'numeric',
                                endAdornment: required ? (
                                    <InputAdornment position="end">
                                        <AcUnitIcon sx={{ color: 'red !important' }} />
                                    </InputAdornment>
                                ) : null,
                            },
                        }}
                        disabled={disable}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        onChange={(e) => {
                            const rawValue = e.target.value.replace(/[^\d]/g, '');
                            const numericValue = Number(rawValue);
                            if (numericValue >= min && numericValue <= max) {
                                field.onChange(numericValue);
                                onChange?.(columnKey, String(numericValue));
                            }
                        }}
                    />
                )}
            />
        </Grid>
    );
};

export default RenderInputCurrency;

