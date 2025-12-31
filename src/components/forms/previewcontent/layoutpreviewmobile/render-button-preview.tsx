'use client'

import { Locale } from '@/configs/i18n';
import { MobileContent } from '@/types/systemTypes';
import { getDictionary } from '@/utils/getDictionary';
import { Button, Grid } from '@mui/material';

type Props = {
    language: Locale,
    dictionary: Awaited<ReturnType<typeof getDictionary>>,
    content: MobileContent
};

const RenderButtonPreviewDefault = ({ dictionary }: Props) => {
    return (
        <Grid
            container
            spacing={8}
            sx={{
                marginTop: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 16px',
            }}
        >
            {/* Confirm Button */}
            <Grid size={{ xs: 4 }} sx={{ textAlign: 'center' }}>
                <Button
                    variant="contained"
                    sx={{
                        backgroundColor: '#0B9150',
                        color: '#fff',
                        textTransform: 'none',
                        borderRadius: '20px',
                        minWidth: '100px', // Đảm bảo kích thước nút đồng nhất
                        '&:hover': {
                            backgroundColor: '#086B3F'
                        }
                    }}
                >
                    {dictionary['common'].confirm}
                </Button>
            </Grid>

            {/* Clear Button */}
            <Grid size={{ xs: 4 }} sx={{ textAlign: 'center' }}>
                <Button
                    variant="contained"
                    sx={{
                        backgroundColor: '#B7F1CE',
                        color: '#0B9150',
                        textTransform: 'none',
                        borderRadius: '20px',
                        minWidth: '100px',
                        '&:hover': {
                            backgroundColor: '#A0E6BD'
                        }
                    }}
                >
                    {dictionary['common'].clear}
                </Button>
            </Grid>

            {/* Cancel Button */}
            <Grid size={{ xs: 4 }} sx={{ textAlign: 'center' }}>
                <Button
                    variant="outlined"
                    sx={{
                        color: '#0B9150',
                        textTransform: 'none',
                        borderRadius: '20px',
                        border: '1px solid #0B9150',
                        minWidth: '100px', // Đảm bảo kích thước nút đồng nhất
                        '&:hover': {
                            backgroundColor: '#F1F9F4'
                        }
                    }}
                >
                    {dictionary['common'].cancel}
                </Button>
            </Grid>
        </Grid>
    );
};

export default RenderButtonPreviewDefault;

