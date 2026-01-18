'use client';

import { Locale } from '@/configs/i18n';
import { FormInput, RuleStrong } from '@/types/systemTypes';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import { Grid, IconButton, InputAdornment, TextField } from '@mui/material';
import { useState } from 'react';
import { disableField } from '../rule/disableField';
import { isFieldHidden } from '../rule/isFieldHidden';

type Props = {
    input: FormInput;
    gridProps: Record<string, number>;
    language: Locale;
    rules: RuleStrong[];
    ismodify?: boolean;
    searchtext?: string;
    setSearchText: (value: string) => void;
};

const RenderInputSearch = ({ input, gridProps, language, rules, ismodify, searchtext = "", setSearchText }: Props) => {
    const [localValue, setLocalValue] = useState(searchtext);

    const columnKey = input.config.structable_read.split('.').pop();
    const issearch = input.config.isSearch;

    const hidden = !issearch ? isFieldHidden(rules, columnKey) : false;
    const disable = !issearch ? disableField(rules, columnKey, ismodify) : false;

    const handleBlur = () => {
        if (localValue.trim() && input.config.isSearch) {
            setSearchText(localValue.trim());
        }
    };

    const handleClear = () => {
        setLocalValue('');
        setSearchText('');
    };

    return (
        <Grid size={gridProps} sx={{ marginBottom: '16px' }} display={hidden ? 'none' : 'block'}>
            <TextField
                fullWidth
                size="small"
                value={localValue} // Sử dụng giá trị cục bộ thay vì giá trị từ props
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

export default RenderInputSearch;
