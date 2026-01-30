'use client';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';

interface Endpoint {
    method: string;
    path: string;
    summary: string;
}

interface EndpointPreviewTableProps {
    endpoints: Endpoint[];
}

export function EndpointPreviewTable({ endpoints }: EndpointPreviewTableProps) {
    if (!endpoints || endpoints.length === 0) return null;

    return (
        <TableContainer component={Paper} variant="outlined" sx={{ mt: 2, maxHeight: 300 }}>
            <Table size="small" stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell>Method</TableCell>
                        <TableCell>Path</TableCell>
                        <TableCell>Summary</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {endpoints.map((ep, idx) => (
                        <TableRow key={idx}>
                            <TableCell>
                                <Chip
                                    label={ep.method}
                                    size="small"
                                    color={ep.method === 'GET' ? 'primary' : ep.method === 'POST' ? 'success' : 'default'}
                                />
                            </TableCell>
                            <TableCell>{ep.path}</TableCell>
                            <TableCell>{ep.summary}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
