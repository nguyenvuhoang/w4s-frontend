'use client';

import Spinner from '@/components/spinners';
import { Locale } from '@/configs/i18n';
import { reportService } from '@/servers/system-service';
import { Report } from '@/types/bankType';
import { PageData } from '@/types/systemTypes';
import { getDictionary } from '@/utils/getDictionary';
import { Box, InputAdornment, Pagination, Table, TableBody, TableCell, TableFooter, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Session } from 'next-auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';

const ReportPageContent = ({ dictionary, reports, session, locale }: {
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    reports: PageData<Report>;
    session: Session | null;
    locale: Locale;
}) => {
    const [dataReport, setSetDataReport] = useState<PageData<Report> | null>(reports);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Hooks
    const router = useRouter();

    const handlePageChange = async (_: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
        setIsLoading(true);
        try {
            const reportApi = await reportService.loadReport({
                sessiontoken: session?.user?.token as string,
                pageindex: page,
                pagesize: 10,
            });
            if (
                reportApi.status !== 200 ||
                !reportApi.payload?.dataresponse?.fo ||
                !reportApi.payload.dataresponse.fo[0]?.input
            ) {
                return <Spinner />;
            }

            const reports = reportApi.payload.dataresponse.fo[0].input;
            setSetDataReport(reports);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        const query = event.target.value.toLowerCase();
        setSearchQuery(query);
        if (!reports) return;

        const filteredReports = reports.items.filter((report) =>
            report.description.toLowerCase().includes(query)
        );

        setSetDataReport({ ...reports, items: filteredReports });
    };


    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                backgroundColor: '#f0f0f0',
            }}
        >
            <Box
                sx={{
                    width: '80%',
                    maxWidth: '1200px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Box
                    sx={{
                        backgroundColor: '#0a6f47',
                        color: '#ffffff',
                        padding: '10px 20px',
                        fontWeight: 'bold',
                    }}
                >
                    <Typography variant="h5" sx={{ fontFamily: 'Quicksand, sans-serif', color: "white", justifyContent: "center", textAlign: "center" }}>
                        {dictionary['report'].reportmenu}
                    </Typography>
                </Box>

                <Box sx={{ padding: '20px', display: 'flex', justifyContent: 'center'}}>
                    <TextField
                        label="Search Report Name"
                        variant="outlined"
                        size="small"
                        value={searchQuery}
                        onChange={handleSearch}
                        fullWidth
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '20px',
                                backgroundColor: '#fff',
                            },
                        }}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="primary" />
                                    </InputAdornment>
                                ),
                            }
                        }}
                    />
                </Box>

                <Box sx={{ flex: 1, padding: '20px', overflow: 'auto' }}>
                    {isLoading ? (
                        <Spinner />
                    ) : (
                        <>
                            <Table>
                                <TableHead>
                                    <TableRow
                                        sx={{
                                            backgroundColor: '#0a6f47',
                                            borderRadius: '8px 8px 0 0',
                                            '& th:first-of-type': {
                                                borderTopLeftRadius: '8px',
                                            },
                                            '& th:last-of-type': {
                                                borderTopRightRadius: '8px',
                                            },
                                        }}
                                    >
                                        <TableCell sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                                            {dictionary['report'].reportcode}
                                        </TableCell>
                                        <TableCell sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                                            {dictionary['report'].reportname}
                                        </TableCell>
                                        <TableCell sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                                            {dictionary['report'].reportdescription}
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody
                                    sx={{
                                        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                                        borderRadius: '0 0 8px 8px',
                                        overflow: 'hidden',
                                        backgroundColor: '#ffffff',
                                    }}
                                >
                                    {dataReport?.items.map((report) => (
                                        <TableRow
                                            key={report.code}
                                            sx={{
                                                cursor: 'pointer',
                                                '&:hover': { backgroundColor: '#f9f9f9' },
                                                borderBottom: '1px solid #ddd',
                                                transition: 'background-color 0.2s ease',
                                            }}
                                            onDoubleClick={() => router.push(`/report/view/${report.code}`)}
                                        >
                                            <TableCell>{report.code}</TableCell>
                                            <TableCell>{report.name}</TableCell>
                                            <TableCell>{report.description}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>

                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={3} sx={{
                                            border: "none",
                                            textAlign: 'center',
                                            padding: '10px'
                                        }}>
                                            <Pagination
                                                count={dataReport?.total_pages ?? 0}
                                                page={currentPage}
                                                onChange={handlePageChange}
                                                color="primary"
                                                size="medium"
                                                sx={{
                                                    display: 'inline-block',
                                                    margin: '0 auto',
                                                    '& .MuiPaginationItem-root': {
                                                        borderRadius: '50%',
                                                        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
                                                    },
                                                    marginTop: '20px',
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                </TableFooter>

                            </Table>

                        </>
                    )}

                </Box>
            </Box>
        </Box>
    );
};

export default ReportPageContent;
