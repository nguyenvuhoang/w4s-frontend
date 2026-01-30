'use client';

import { Locale } from '@/configs/i18n';
import { FormInput, RuleStrong } from '@shared/types/systemTypes';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import { Grid, IconButton, InputAdornment, TextField } from '@mui/material';
import { Dispatch, SetStateAction, useState } from 'react';
import { disableField } from '../rule/disableField';
import { isFieldHidden } from '../rule/isFieldHidden';
import { isFieldRequired } from '../rule/isFieldRequired';
import { generateDynamicJson } from '@utils/generateDynamicJson';
import { workflowService } from '@/servers/system-service';
import { Session } from 'next-auth';
import { Controller, useForm } from 'react-hook-form';

type Props = {
    input: FormInput;
    gridProps: Record<string, number>;
    language: Locale;
    rules: RuleStrong[];
    ismodify?: boolean;
    session: Session | null;
    setLoading: Dispatch<SetStateAction<boolean>>;
    formMethods: ReturnType<typeof useForm>;
};

const RenderInputFunc = ({ input, gridProps, language, rules, ismodify, session, setLoading, formMethods }: Props) => {
    const [localValue, setLocalValue] = useState<string>('');

    const columnKey = input.config.structable_read.split('.').pop();
    const issearch = input.config.isSearch;

    const hidden = !issearch ? isFieldHidden(rules, columnKey) : false;
    const disable = !issearch ? disableField(rules, columnKey, ismodify) : false;
    const required = isFieldRequired(input);

    const fillDataForForm = (formdata: { [x: string]: any }, resultConfig: string) => {
        if (!resultConfig || !formdata) return;

        const resultKeys = resultConfig.split(';');
        resultKeys.forEach((key) => {
            if (key in formdata) {
                formMethods.setValue(key, formdata[key]);
            } else {
                console.warn(`Key "${key}" khÃ´ng tá»“n táº¡i trong formdata.`);
            }
        });
    };

    const handleBlur = async () => {
        setLoading(true);
        try {
            const rule = rules.find(rule => rule.config?.component_event === 'on_blur');

            if (rule?.config.parameters && rule.config.txFo) {
                const dynamicJson = generateDynamicJson(rule.config.parameters, localValue);
                const txFoArray = JSON.parse(rule.config.txFo);

                for (const tx of txFoArray) {
                    if (tx.input) {
                        Object.assign(tx.input.fields, dynamicJson);
                        const response = await workflowService.runFODynamic({
                            workflowid: tx.input.workflowid,
                            sessiontoken: session?.user?.token as string,
                            input: tx
                        });

                        const formdata = response.payload.dataresponse.data;
                        fillDataForForm(formdata, rule.config.component_result);
                    } else {
                        console.warn('tx.input khÃ´ng tá»“n táº¡i trong txFo:', tx);
                    }
                }
            }
        } catch (error) {
            console.error('Error during blur handler:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => setLocalValue('');

    return (
        <Grid size={gridProps} sx={{ marginBottom: '16px' }} display={hidden ? 'none' : 'block'}>
            <Controller
                name={columnKey}
                control={formMethods.control}
                defaultValue={formMethods.getValues(columnKey) || ''}
                rules={{
                    required: required ? `${input.lang?.title?.[language] || input.default?.name} is required` : false,
                }}
                render={({ field, fieldState }) => (
                    <TextField
                        {...field}
                        fullWidth
                        size="small"
                        value={localValue || field.value || ''}
                        variant="outlined"
                        type={input.config.is_password === 'true' ? 'password' : 'text'}
                        label={input.lang?.title?.[language] || input.default?.name || 'Text Input'}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        {localValue && (
                                            <IconButton onClick={handleClear} size="small">
                                                <ClearIcon sx={{ color: '#f44336' }} />
                                            </IconButton>
                                        )}
                                        {required && (
                                            <InputAdornment
                                                position="end"
                                                sx={{ animation: fieldState.error ? 'spin 1s linear infinite' : 'none' }}
                                            >
                                                <AcUnitIcon sx={{ color: 'red !important' }} />
                                            </InputAdornment>
                                        )}
                                        <IconButton>
                                            <SearchIcon sx={{ color: '#0A914F' }} />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }
                        }}
                        onChange={(e) => setLocalValue(e.target.value)}
                        onBlur={handleBlur}
                        disabled={disable}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
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

export default RenderInputFunc;

