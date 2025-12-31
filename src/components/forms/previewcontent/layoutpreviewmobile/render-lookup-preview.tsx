'use client'

import { Locale } from '@/configs/i18n';
import { MobileContent } from '@/types/systemTypes';
import { getDictionary } from '@/utils/getDictionary';
import { Grid, InputAdornment, TextField } from '@mui/material';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import SearchIcon from '@mui/icons-material/Search';


type Props = {
    language: Locale,
    dictionary: Awaited<ReturnType<typeof getDictionary>>,
    content: MobileContent
};


const RenderLookupPreviewDefault = ({ content }: Props) => {
    const numericValue = typeof content === 'object' && content !== null && 'defaultValue' in content
        ? content.defaultValue ?? 0
        : '';
    const formattedValue = content.isSeparator
        ? Number(numericValue).toFixed(2)
        : numericValue;

    return (
        <Grid size={{ xs: 12 }} sx={{ marginBottom: '16px', position: 'relative' }}>
            <TextField
                fullWidth
                size="small"
                placeholder={content.label || ''}
                variant="outlined"
                type={'text'}
                label={content.label || 'Text Input'}
                value={formattedValue}
                slotProps={{
                    input: {
                        endAdornment: content.required ? (
                            <>
                                <InputAdornment
                                    position="end"
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        animation: 'spin 1s linear infinite',
                                    }}
                                >
                                    <AcUnitIcon sx={{ color: 'red !important' }} />
                                </InputAdornment>
                                <InputAdornment
                                    position="end"
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <SearchIcon sx={{ color: '#0b9150 !important' }} />
                                </InputAdornment>
                            </>
                        ) : null,

                    },

                }}
                sx={{
                    '& .MuiInputBase-input.MuiOutlinedInput-input': {
                        textAlign: 'right !important',
                    },
                }}
                disabled
            />
        </Grid>

    );
};

export default RenderLookupPreviewDefault;
