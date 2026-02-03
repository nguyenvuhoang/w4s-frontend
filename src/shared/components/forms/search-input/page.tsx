// components/SearchInput.tsx
'use client'

import { TextField, InputAdornment, IconButton, TextFieldProps } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import React from 'react';

interface SearchInputProps extends Omit<TextFieldProps, 'onChange'> {
    value: string;
    onChange: (value: string) => void;
    onClear?: () => void;
}

const SearchInput: React.FC<SearchInputProps> = ({
    value,
    onChange,
    onClear,
    ...props
}) => {
    const handleClear = () => {
        if (onClear) {
            onClear();
        } else {
            onChange('');
        }
    };

    return (
        <TextField
            {...props}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            slotProps={{
                input: {
                    endAdornment: (
                        <InputAdornment position="end">
                            {value ? (
                                <IconButton onClick={handleClear} size="small">
                                    <ClearIcon fontSize="small" />
                                </IconButton>
                            ) : (
                                <SearchIcon fontSize="small" />
                            )}
                        </InputAdornment>
                    )
                }
            }}
        />
    );
};

export default SearchInput;
