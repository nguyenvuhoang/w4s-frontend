'use client'

import { getDictionary } from '@utils/getDictionary';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';

type Props = {
    data: any;
    dictionary: Awaited<ReturnType<typeof getDictionary>>
};

const MobileInfo = ({ data, dictionary }: Props) => {
    return (
        <>
            {/* Box chá»©a Form Information */}
            <Paper elevation={3} sx={{ mb: 3 }}>
                {/* Header mÃ u xanh */}
                <Box
                    sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        p: 2,
                        borderTopLeftRadius: '4px',
                        borderTopRightRadius: '4px',
                    }}
                >
                    <Typography variant="h5" sx={{ fontWeight: 'bold', textAlign: 'left', color: 'white' }}>
                        {dictionary['common'].forminfo}
                    </Typography>
                </Box>

                {/* Ná»™i dung dáº¡ng báº£ng */}
                <TableContainer sx={{ p: 2 }}>
                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell variant="head" sx={{ fontWeight: 'bold' }}>
                                    {dictionary['common'].appname}
                                </TableCell>
                                <TableCell>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableBody>
                                                {Object.entries(data).map(([language, title], index) => (
                                                    <TableRow key={index}>
                                                        <TableCell variant="head" sx={{ fontWeight: 'bold', width: '30%' }}>
                                                            {language.toUpperCase()}
                                                        </TableCell>
                                                        <TableCell>{title as string}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

        </>
    );
};

export default MobileInfo;

