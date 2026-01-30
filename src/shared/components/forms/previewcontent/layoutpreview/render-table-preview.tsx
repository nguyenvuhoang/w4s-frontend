'use client'

import { StyledHeaderCell, StyledTableRow } from '@/@core/components/jTable/style';
import { FormInput } from '@shared/types/systemTypes';
import { Search } from '@mui/icons-material';
import { Grid, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

type Column = {
    code: string;
    title: string;
    inputtype: string;
    config: object;
};

type Props = {
    input: FormInput;
    gridProps: Record<string, number>;
};


const RenderTablePreviewDefault = ({ input, gridProps }: Props) => {
    const columns = JSON.parse(input.config.columns || '[]');

    return (
        <Grid size={gridProps} sx={{ marginBottom: '16px', position: 'relative' }}>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            {columns.map((column: Column, index: number) => (
                                <StyledHeaderCell key={index}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        {column.title}
                                        <IconButton
                                            size="small"
                                            sx={{ color: 'white' }}
                                        >
                                            <Search />
                                        </IconButton>
                                    </div>
                                </StyledHeaderCell>
                            ))}
                        </TableRow>


                    </TableHead>

                    <TableBody>
                        <StyledTableRow>
                            <TableCell colSpan={columns.length} align="center">
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

