/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { Locale } from '@/configs/i18n';
import { FormInput } from '@shared/types/systemTypes';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import { Grid, IconButton, InputAdornment, TextField } from '@mui/material';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

type Props = {
    input: FormInput;
    gridProps: Record<string, number>;
    language: Locale;
    advancedsearch?: any;
    setAdvancedSearch?: Dispatch<SetStateAction<any>>;
};

const RenderInputAdvanceSearch = ({
    input,
    gridProps,
    language,
    advancedsearch,
    setAdvancedSearch,
}: Props) => {
    const [localValue, setLocalValue] = useState(advancedsearch?.[input.default.code] || '');


    useEffect(() => {
        if (advancedsearch?.[input.default.code] !== localValue) {
            setLocalValue(advancedsearch?.[input.default.code] || '');
        }
    }, [advancedsearch, input.default.code]);

    const handleBlur = () => {
        if (localValue.trim() && input.config.isSearch) {
            if (setAdvancedSearch) {
                setAdvancedSearch((prev: Record<string, string>) => ({
                    ...prev,
                    [input.default.code]: localValue.trim(),
                }));
            }
        }
    };

    const handleClear = () => {
        setLocalValue('');
        if (setAdvancedSearch) {
            setAdvancedSearch((prev: Record<string, string>) => {
                const updated = { ...prev };
                delete updated[input.default.code];
                return updated;
            });
        }
    };

    return (
        <Grid size={gridProps} sx={{ marginBottom: '16px' }}>
            <TextField
                fullWidth
                size="small"
                value={localValue}
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
                                <SearchIcon sx={{ color: '#0A914F' }} />
                            </InputAdornment>
                        ),
                    }
                }}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
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
        </Grid>
    );
};

export default RenderInputAdvanceSearch;

