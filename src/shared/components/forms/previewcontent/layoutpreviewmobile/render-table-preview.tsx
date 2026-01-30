'use client'

import { StyledHeaderCell, StyledTableRow } from '@/@core/components/jTable/style';
import { Locale } from '@/configs/i18n';
import { MobileConfig, MobileContent } from '@shared/types/systemTypes';
import { getDictionary } from '@utils/getDictionary';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Grid, InputAdornment, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material';


type Props = {
    language: Locale,
    dictionary: Awaited<ReturnType<typeof getDictionary>>,
    content: MobileContent
};


const RenderTablePreviewDefault = ({ content }: Props) => {
    return (
        <Grid size={{ xs: 12 }} sx={{ marginBottom: '16px', position: 'relative' }}>
            <TextField
                fullWidth
                size="small"
                placeholder={content?.searchButton?.label || ''}
                variant="outlined"
                type={'text'}
                label={content?.searchButton?.label || 'Text Input'}
                slotProps={{
                    input: {
                        endAdornment: (
                            <InputAdornment position="end">
                                <SearchIcon sx={{ color: '#0b9150 !important' }} />
                            </InputAdornment>
                        )
                    }
                }}
                disabled
            />

            <TableContainer component={Paper} className='mt-5'>
                <Table>
                    <TableHead>
                        <TableRow>
                            {content.config.map((column: MobileConfig, index: number) => (
                                <StyledHeaderCell key={index}>
                                    <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        {column.title}
                                    </Box>
                                </StyledHeaderCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        <StyledTableRow>
                            <TableCell colSpan={content.config.length} align="center">
                                No data available
                            </TableCell>
                        </StyledTableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Grid>

    );
};

export default RenderTablePreviewDefault;

