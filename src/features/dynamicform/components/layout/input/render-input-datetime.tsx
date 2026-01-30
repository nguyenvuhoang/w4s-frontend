'use client';

import { Locale } from '@/configs/i18n';
import { FormInput, RuleStrong } from '@shared/types/systemTypes';
import { evaluateDefault } from '@utils/evaluateDefault';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { Grid } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Controller, useForm } from 'react-hook-form';
import { disableField } from '../rule/disableField';
import { isFieldHidden } from '../rule/isFieldHidden';
import { isFieldRequired } from '../rule/isFieldRequired';

// Extend Dayjs with custom parse format for date parsing
dayjs.extend(customParseFormat);

type Props = {
    input: FormInput;
    gridProps: Record<string, number>;
    language: Locale;
    rules: RuleStrong[];
    onChange?: (fieldCode: string, value: string) => void;
    ismodify?: boolean;
    formMethods: ReturnType<typeof useForm>;
};

const RenderInputDateTime = ({
    input,
    gridProps,
    language,
    rules,
    onChange,
    ismodify,
    formMethods
}: Props) => {
    const columnKey = input.config.structable_read.split('.').pop();

    const hidden = isFieldHidden(rules, columnKey);
    const required = isFieldRequired(input);
    const disable = disableField(rules, columnKey, ismodify);

    const defaultDate = input.config.data_default
        ? evaluateDefault(input.config.data_default)
        : '';

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
                defaultValue={defaultDate}
                render={({ field }) => (
                    <DatePicker
                        label={
                            input.lang?.title?.[language] ||
                            input.default?.name ||
                            'Select Date'
                        }
                        value={field.value ? dayjs(field.value, 'DD/MM/YYYY') : null}
                        format="DD/MM/YYYY"
                        onChange={(newValue) => {
                            const formattedValue = newValue
                                ? dayjs(newValue).format('DD/MM/YYYY')
                                : '';
                            field.onChange(formattedValue);
                            onChange?.(columnKey, formattedValue);
                        }}
                        slotProps={{
                            textField: {
                                size: 'small',
                                fullWidth: true,
                                required: required,
                                disabled: disable,
                                InputLabelProps: {
                                    sx: {
                                        '& .MuiInputLabel-asterisk': {
                                            color: 'red'
                                        }
                                    }
                                }
                            },
                            openPickerButton: {
                                sx: {
                                    color: disable ? '#d3d3d3 !important' : '#225087 !important',
                                    '& .MuiSvgIcon-root': {
                                        color: disable ? '#d3d3d3 !important' : '#225087 !important'
                                    },
                                    pointerEvents: disable ? 'none' : 'auto'
                                },
                                children: <CalendarTodayIcon sx={{ marginRight: 1 }} />
                            }
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: '#048d48a1 !important',
                                    filter: 'invert(0%) !important',
                                    WebkitFilter: 'invert(0%) !important'
                                },
                                '&:hover fieldset': {
                                    borderColor: '#8e8e8e !important'
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#03492a !important'
                                },
                                '&.Mui-error fieldset': {
                                    borderColor: '#d32f2f !important'
                                }
                            }
                        }}
                    />
                )}
            />
        </Grid>
    );
};

export default RenderInputDateTime;

