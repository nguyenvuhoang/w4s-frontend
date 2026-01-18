'use client';

import { Locale } from '@/configs/i18n';
import { FormInput, RuleStrong } from '@/types/systemTypes';
import { evaluateDefault } from '@/utils/evaluateDefault';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Grid } from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Controller, useForm } from 'react-hook-form';
import { disableField } from '../rule/disableField';
import { isFieldHidden } from '../rule/isFieldHidden';
import { isFieldRequired } from '../rule/isFieldRequired';

dayjs.extend(customParseFormat);

type Props = {
    input: FormInput;
    gridProps: Record<string, number>;
    language: Locale;
    rules: RuleStrong[];
    onChange?: (fieldCode: string, value: string) => void;
    renderviewdata?: any;
    ismodify?: boolean;
    formMethods: ReturnType<typeof useForm>;
};

const RenderInputTimeSheet = ({
    input,
    gridProps,
    language,
    rules,
    onChange,
    renderviewdata,
    ismodify,
    formMethods
}: Props) => {

    const columnKey = input.config.structable_read.split('.').pop();

    const defaultTime = input.config.data_default
        ? evaluateDefault(input.config.data_default)
        : renderviewdata?.[input.default?.code] || '';

    const defaultValue = defaultTime ? dayjs(defaultTime, 'HH:mm:ss').format('HH:mm:ss') : '';

    const hidden = isFieldHidden(rules, columnKey);
    const required = isFieldRequired(input);
    const disable = disableField(rules, columnKey, ismodify);

    return (
        <Grid
            size={gridProps}
            sx={{ marginBottom: '16px' }}
            display={hidden ? 'none' : 'block'}
            suppressHydrationWarning
        >
            <Controller
                name={columnKey}
                control={formMethods.control}
                defaultValue={defaultValue}
                rules={{
                    required: required
                        ? `${input.lang?.title?.[language] || input.default?.name} is required`
                        : false,
                }}
                render={({ field, fieldState }) => (
                    <TimePicker
                        {...field}
                        label={input.lang?.title?.[language] || input.default?.name || 'Select Time'}
                        value={field.value ? dayjs(field.value, 'HH:mm:ss') : null}
                        format="HH:mm:ss"
                        onChange={(newValue) => {
                            const formattedValue = newValue ? dayjs(newValue).format('HH:mm:ss') : '';
                            field.onChange(formattedValue);
                            if (onChange) {
                                onChange(columnKey, formattedValue);
                            }
                        }}
                        slotProps={{
                            textField: {
                                size: 'small',
                                fullWidth: true,
                                required: required,
                                disabled: disable,
                                error: !!fieldState.error,
                                helperText: fieldState.error?.message,
                                InputLabelProps: {
                                    sx: {
                                        '& .MuiInputLabel-asterisk': {
                                            color: 'red',
                                        },
                                    },
                                },
                            },
                            openPickerButton: {
                                sx: {
                                    color: disable ? '#d3d3d3 !important' : '#225087 !important',
                                    '& .MuiSvgIcon-root': {
                                        color: disable ? '#d3d3d3 !important' : '#225087 !important',
                                    },
                                    pointerEvents: disable ? 'none' : 'auto',
                                },
                                children: <AccessTimeIcon sx={{ marginRight: 1 }} />,
                            },
                        }}
                    />
                )}
            />
        </Grid>
    );
};

export default RenderInputTimeSheet;
