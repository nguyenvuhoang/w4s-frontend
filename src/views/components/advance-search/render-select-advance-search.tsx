/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { getDataConfig } from '@/@core/components/jSelect/supFunc';
import { Locale } from '@/configs/i18n';
import { FormInput, RuleStrong } from '@/types/systemTypes';
import { FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { Session } from 'next-auth';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { disableField } from '../../../features/dynamicform/components/layout/rule/disableField';
import { isFieldHidden } from '../../../features/dynamicform/components/layout/rule/isFieldHidden';
import { generateParams } from '@/utils/generateParams';

type Props = {
    input: FormInput;
    gridProps: Record<string, number>;
    session: Session | null;
    language: Locale;
    rules: RuleStrong[];
    ismodify?: boolean;
    advancedsearch?: any;
    setAdvancedSearch?: Dispatch<SetStateAction<any>>;
    formData: any;
};

const RenderSelectAdvanceSearch = ({
    input,
    gridProps,
    session,
    language,
    rules,
    ismodify,
    advancedsearch,
    setAdvancedSearch,
    formData }: Props) => {

    const [localValue, setLocalValue] = useState(advancedsearch?.[input.default.code] || '');

    useEffect(() => {
        if (advancedsearch?.[input.default.code] !== localValue) {
            setLocalValue(advancedsearch?.[input.default.code] || '');
        }
    }, [advancedsearch, input.default.code]);

    const columnKey = input.config.structable_read.split('.').pop();

    const parameter = generateParams(input.config.col_filter, formData);


    const handleChange = (event: SelectChangeEvent<any>) => {
        const selectedValue = event.target.value;
        setLocalValue(selectedValue);

        if (setAdvancedSearch) {
            setAdvancedSearch((prev: Record<string, string>) => ({
                ...prev,
                [input.default.code]: selectedValue, // Cập nhật giá trị mới vào advancedsearch
            }));
        }
    }

    const [renderSelectData, setRenderSelectData] = useState<any[]>([]);
    const hasFetchedRef = useRef(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!hasFetchedRef.current) {
                const data = await getDataConfig(input.config, session, language, parameter);
                setRenderSelectData(data);
                hasFetchedRef.current = true;
            }
        };
        fetchData();
    }, []);


    const options = renderSelectData.map((item: any) => ({
        value: item.c_cdlist?.cdid ?? item?.codeid ?? '',
        label: item.c_cdlist?.caption || item?.caption || '',
    }));

    const hidden = isFieldHidden(rules, columnKey);
    const disable = disableField(rules, columnKey, ismodify)

    // Nếu bị ẩn, không render TextField
    if (hidden) {
        return null;
    }


    return (
        <Grid size={gridProps} sx={{ marginBottom: '16px' }}>
            <FormControl fullWidth size="small">
                <InputLabel id={`${input.default.code}-label`}>
                    {input.default.name || 'Select Option'}
                </InputLabel>
                <Select
                    labelId={`${input.default.code}-label`}
                    value={options.some(o => o.value === localValue) ? localValue : ''}
                    onChange={handleChange}
                    label={input.default.name || 'Select Option'}
                    disabled={disable}
                    sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.dark',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                        },
                    }}
                >
                    {/* Hiển thị các tùy chọn */}
                    {options.map((option: { value: string; label: string }, index: number) => (
                        <MenuItem key={index} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}

                </Select>
            </FormControl>
        </Grid>
    );
};

export default RenderSelectAdvanceSearch;
