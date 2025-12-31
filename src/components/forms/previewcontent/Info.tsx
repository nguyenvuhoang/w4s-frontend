'use client'

import JsonEditorComponent from '@/@core/components/jSONEditor';
import { Box, NoSsr, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from 'react';

type Props = {
    data: any;
};

const Info = ({ data }: Props) => {
    return (
        <>
            <NoSsr>
                {/* Box chứa Form Information */}
                <Paper elevation={3} sx={{ mb: 3 }}>
                    {/* Header màu xanh */}
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
                            Form Information
                        </Typography>
                    </Box>

                    {/* Nội dung dạng bảng */}
                    <TableContainer sx={{ p: 2 }}>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell variant="head" sx={{ fontWeight: 'bold', width: '30%' }}>
                                        Form Code
                                    </TableCell>
                                    <TableCell>{data.form_code}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell variant="head" sx={{ fontWeight: 'bold' }}>
                                        Description
                                    </TableCell>
                                    <TableCell>{data.des}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell variant="head" sx={{ fontWeight: 'bold' }}>
                                        Title
                                    </TableCell>
                                    <TableCell>{data.title}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell variant="head" sx={{ fontWeight: 'bold' }}>
                                        Language form
                                    </TableCell>
                                    <TableCell>
                                        <TableContainer>
                                            <Table size="small">
                                                <TableBody>
                                                    {Object.entries(data.lang_form).map(([language, title], index) => (
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
                                <TableRow>
                                    <TableCell variant="head" sx={{ fontWeight: 'bold' }}>
                                        Last Update
                                    </TableCell>
                                    <TableCell>{data.last_update}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell variant="head" sx={{ fontWeight: 'bold' }}>
                                        Application
                                    </TableCell>
                                    <TableCell>{data.app}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                {/* Box chứa Rules Information */}
                <Paper elevation={3} sx={{ my: 5 }}>
                    {/* Header màu xanh */}
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
                            Form Rule
                        </Typography>
                    </Box>

                    {/* Nội dung dạng bảng */}
                    <TableContainer sx={{ p: 2 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Rule Name</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Order</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Parameter Config</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.ruleStrong.map((rule: { code: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; order: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; isStart: any; inUse: any; config: any; }, index: Key | null | undefined) => (
                                    <TableRow key={index}>
                                        <TableCell>{rule.code}</TableCell>
                                        <TableCell>{rule.order}</TableCell>
                                        <TableCell>{rule.inUse ? 'Đang dùng' : 'Không dùng'}</TableCell>
                                        <TableCell>
                                            <Box
                                                sx={{
                                                    bgcolor: '#f4f4f4',
                                                    p: 1,
                                                    borderRadius: '4px',
                                                    overflow: 'auto',
                                                    maxHeight: '250px',
                                                }}
                                            >
                                                <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                                                    <JsonEditorComponent
                                                        initialJson={rule.config}
                                                        onChange={(updatedJson: object) => console.log(updatedJson)}
                                                    />
                                                </pre>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </NoSsr>

        </>
    );
};

export default Info;
