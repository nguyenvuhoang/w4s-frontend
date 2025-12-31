'use client';

import { Locale } from '@/configs/i18n';
import { MobileContent } from '@/types/systemTypes';
import { getDictionary } from '@/utils/getDictionary';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import { Box, InputAdornment, TextField, Typography } from '@mui/material';

type Props = {
    language: Locale;
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    content: MobileContent;
};

const RenderMultiPreviewDefault = ({ content, dictionary }: Props) => {

    return (
        <Box
            sx={{
                margin: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
            }}
        >
            {/* Receiver Address Section */}
            <Typography
                variant="subtitle1"
                sx={{
                    fontWeight: 'bold',
                    marginBottom: '4px',
                }}
            >
                {content.label || 'Multi Field'}
            </Typography>

            <Typography
                variant="body1"
                sx={{
                    color: 'gray',
                    marginBottom: '4px',
                }}
            >
                - {dictionary['common'].viewmore}
            </Typography>

            {content?.child?.map((child: any, index: number) => {
                return (
                    <Box key={index} sx={{
                        marginLeft: '10px',
                    }}>
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 'bold'
                            }}
                        >
                            {child.label || 'Child Field'}
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder={content.label || ''}
                            variant="outlined"
                            type={'text'}
                            label={content.label || 'Text Input'}
                            slotProps={{
                                input: {
                                    endAdornment: content.required ? (
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
                                    ) : null,
                                },

                            }}
                            sx={{
                                '& .MuiInputBase-input.MuiOutlinedInput-input': {
                                    textAlign: 'right !important'
                                }
                            }}
                            disabled
                        />
                    </Box>
                )
            })}

        </Box>
    );
};

export default RenderMultiPreviewDefault;
