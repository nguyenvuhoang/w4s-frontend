'use client'

import PaginationPage from '@/@core/components/jTable/pagination';
import PreviewContent from '@/components/forms/previewcontent';
import NoData from '@/components/layout/shared/card/nodata';
import { useSMSMessageHandler } from '@/services/useSMSMessageHandler';
import { SMSContentType } from '@/types/bankType';
import { PageData } from '@/types/systemTypes';
import { getDictionary } from '@/utils/getDictionary';
import { maskText } from '@/utils/maskText';
import * as Icons from '@mui/icons-material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import {
    Box,
    Button,
    Grid,
    IconButton,
    MenuItem,
    Modal,
    Paper,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { Session } from 'next-auth';
import { useState } from 'react';
import SMSExportModal from './sms-export-modal';

const SMSMessageContent = ({
    session,
    dictionary,
    initialData
}: {
    session: Session | null
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    initialData: PageData<SMSContentType>
}) => {

    const [smsData, setSmsData] = useState<PageData<SMSContentType>>(initialData)

    const {
        page,
        rowsPerPage,
        visibleIds,
        modalContent,
        isModalOpen,
        searchPhone,
        jumpPage,
        isExportModalOpen,
        pageSize,
        loading,
        totalResults,
        setExportModalOpen,
        setModalOpen,
        handleToggleView,
        handlePageChange,
        handleJumpPage,
        handlePageSizeChange,
        handlePreviewModal,
        handleExport,
        filters,
        handleFilterChange,
        handleSearch
    } = useSMSMessageHandler(session, smsData, setSmsData)

    const validRows = smsData.items.filter(row => row && row.id != null)

    return (
        <Box sx={{ mt: 5, width: '100%' }}>
            <Box className="my-10 rounded-md">
                <Typography variant="subtitle1" className="mb-2 font-semibold text-black inline-block px-2 py-1 rounded">
                    {dictionary['common'].filter}
                </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid size={{ xs: 12, sm: 2.5 }}>
                            <TextField
                                fullWidth
                                label={dictionary['common'].phonenumber}
                                size="small"
                                value={filters.phonenumber}
                                onChange={(e) => handleFilterChange('phonenumber', e.target.value)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2.5 }}>
                            <TextField
                                select
                                fullWidth
                                label={dictionary['common'].providername}
                                size="small"
                                value={filters.providername}
                                onChange={(e) => handleFilterChange('providername', e.target.value)}
                                slotProps={{
                                    inputLabel: { shrink: true }
                                }}
                            >
                                <MenuItem value="ALL">{dictionary['common'].all}</MenuItem>
                                <MenuItem value="LTC">LTC</MenuItem>
                                <MenuItem value="ETL">ETL</MenuItem>
                                <MenuItem value="TWL">TWILIO</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2 }}>
                            <TextField
                                select
                                fullWidth
                                label={dictionary['sms'].status}
                                size="small"
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                slotProps={{
                                    inputLabel: { shrink: true }
                                }}
                            >
                                <MenuItem value="ALL">{dictionary['common'].all}</MenuItem>
                                <MenuItem value="SUCCESS">{dictionary['sms'].statussuccess}</MenuItem>
                                <MenuItem value="FAILED">{dictionary['sms'].statusfailed}</MenuItem>
                            </TextField>

                        </Grid>

                        <Grid size={{ xs: 12, sm: 2 }}>
                            <DatePicker
                                label={dictionary['account'].fromdate}
                                value={filters.fromdate ? dayjs(filters.fromdate, 'DD/MM/YYYY') : null}
                                format="DD/MM/YYYY"
                                onChange={(newValue) => {
                                    const formatted = newValue ? dayjs(newValue).format('DD/MM/YYYY') : '';
                                    handleFilterChange('fromdate', formatted);
                                }}
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        fullWidth: true,
                                    },
                                    openPickerButton: {
                                        sx: {
                                            color: '#225087 !important',
                                            '& .MuiSvgIcon-root': {
                                                color: '#225087 !important',
                                            },
                                        },
                                        children: (
                                            <>
                                                <CalendarTodayIcon sx={{ marginRight: 1 }} />
                                            </>
                                        ),
                                    },
                                }}

                            />

                        </Grid>
                        <Grid size={{ xs: 12, sm: 2 }}>

                            <DatePicker
                                label={dictionary['account'].todate}
                                value={filters.todate ? dayjs(filters.todate, 'DD/MM/YYYY') : null}
                                format="DD/MM/YYYY"
                                onChange={(newValue) => {
                                    const formatted = newValue ? dayjs(newValue).format('DD/MM/YYYY') : '';
                                    handleFilterChange('todate', formatted);
                                }}
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        fullWidth: true,
                                    },
                                    openPickerButton: {
                                        sx: {
                                            color: '#225087 !important',
                                            '& .MuiSvgIcon-root': {
                                                color: '#225087 !important',
                                            },
                                        },
                                        children: (
                                            <>
                                                <CalendarTodayIcon sx={{ marginRight: 1 }} />
                                            </>
                                        ),
                                    },
                                }}

                            />

                        </Grid>
                        <Grid size={{ xs: 12, sm: 1 }} className="flex items-end justify-end">
                            <Box>
                                <Button
                                    className="bg-primary text-white rounded-md px-4 py-2 hover:opacity-80 transition"
                                    onClick={handleSearch}
                                >
                                    {dictionary['common'].search}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
                <Box sx={{ mt: 5, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
                    <Box>
                        <IconButton color="primary" onClick={() => setExportModalOpen(true)}>
                            <Icons.Download />
                        </IconButton>
                    </Box>
                </Box>

                <TableContainer component={Paper} sx={{ marginBottom: 5 }}>
                    <Table>
                        <TableHead sx={{ backgroundColor: 'primary.main' }}>
                            <TableRow>
                                <TableCell sx={{ color: '#fff' }}>{dictionary['sms'].phone}</TableCell>
                                <TableCell sx={{ color: '#fff' }}>{dictionary['sms'].otprequestid}</TableCell>
                                <TableCell sx={{ color: '#fff' }}>{dictionary['sms'].providermsgid}</TableCell>
                                <TableCell sx={{ color: '#fff' }}>{dictionary['sms'].providername}</TableCell>
                                <TableCell sx={{ color: '#fff' }}>{dictionary['sms'].request}</TableCell>
                                <TableCell sx={{ color: '#fff' }}>{dictionary['sms'].response}</TableCell>
                                <TableCell sx={{ color: '#fff' }}>{dictionary['sms'].messsage}</TableCell>
                                <TableCell sx={{ color: '#fff' }}>{dictionary['sms'].sendat}</TableCell>
                                <TableCell sx={{ color: '#fff' }}>{dictionary['sms'].status}</TableCell>
                                <TableCell sx={{ color: '#fff' }}>{dictionary['sms'].elapsedtime}</TableCell>
                                <TableCell sx={{ color: '#fff' }}>{dictionary['sms'].action}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                [...Array(rowsPerPage)].map((_, rowIndex) => (
                                    <TableRow key={`skeleton-row-${rowIndex}`}>
                                        {[...Array(10)].map((_, colIndex) => (
                                            <TableCell key={`skeleton-cell-${rowIndex}-${colIndex}`}>
                                                <Skeleton variant="text" height={24} />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : validRows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} align="center">
                                        <Box
                                            display="flex"
                                            justifyContent="center"
                                            alignItems="center"
                                            minHeight="150px"
                                        >
                                            <NoData text={dictionary['common'].nodataform} width={100} height={100} />
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                validRows
                                    .map(row => {
                                        return (
                                            <TableRow
                                                key={row.id}
                                                sx={{ transition: 'background-color 0.2s', '&:hover': { backgroundColor: '#f5f5f5' } }}
                                            >
                                                <TableCell>{row.phonenumber}</TableCell>
                                                <TableCell>
                                                    {row.otprequestid && (
                                                        <Tooltip title={row.otprequestid}>
                                                            <IconButton onClick={() => navigator.clipboard.writeText(row.otprequestid)} size="small">
                                                                <ContentCopyIcon fontSize="small" sx={{ color: 'green' }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </TableCell>
                                                <TableCell>{row.providermsgid}</TableCell>
                                                <TableCell>{row.smsproviderid}</TableCell>
                                                <TableCell>
                                                    <Tooltip title={row.requestmessage || ''} placement="top" arrow>
                                                        <Typography style={{ cursor: 'pointer', display: 'inline-block' }}
                                                            onClick={() => handlePreviewModal(row.requestmessage, row.smsproviderid === 'TWL' ? 'JSON' : 'XML', row.smsproviderid === 'TWL' ? 'JSON' : 'XML')}>
                                                            {row.requestmessage && <Icons.Code style={{ fontSize: '20px', color: 'green' }} />}
                                                        </Typography>
                                                    </Tooltip>
                                                </TableCell>

                                                <TableCell>
                                                    <Tooltip
                                                        title={
                                                            <span style={{ whiteSpace: 'pre-wrap', maxWidth: 300 }}>
                                                                {row.responsemessage}
                                                            </span>
                                                        }
                                                        placement="top"
                                                        arrow
                                                    >
                                                        <Typography
                                                            style={{ cursor: 'pointer', display: 'inline-block' }}
                                                            onClick={() => handlePreviewModal(row.responsemessage, row.smsproviderid === 'TWL' ? 'JSON' : 'XML', row.smsproviderid === 'TWL' ? 'JSON' : 'XML')}
                                                        >
                                                            {row.responsemessage && <Icons.Code style={{ fontSize: '20px', color: 'green' }} />}
                                                        </Typography>
                                                    </Tooltip>
                                                </TableCell>

                                                <TableCell>
                                                    {visibleIds.includes(row.id) ? (
                                                        row.messagecontent
                                                    ) : (
                                                        <Typography variant="body2" sx={{ color: 'gray' }}>
                                                            {maskText(row.messagecontent)}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(row.sentat).toLocaleString('en-GB', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit',
                                                        hour12: false,
                                                    })}
                                                </TableCell>
                                                <TableCell>
                                                    {row.status === 'SUCCESS' ? (
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <Icons.CheckCircleOutline sx={{ color: 'green' }} fontSize="small" />
                                                            <Typography variant="body2" color="green">{dictionary['sms'].statussuccess}</Typography>
                                                        </Box>
                                                    ) : row.status === 'FAILED' ? (
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <Icons.HighlightOff sx={{ color: 'red' }} fontSize="small" />
                                                            <Typography variant="body2" color="red">{dictionary['sms'].statusfailed}</Typography>
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="body2">{row.status}</Typography>
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    {row.elapsedmilliseconds != null
                                                        ? `${(row.elapsedmilliseconds / 1000).toFixed(3)}s`
                                                        : '-'}
                                                </TableCell>

                                                <TableCell>
                                                    <Tooltip title={visibleIds.includes(row.id) ? 'Hide' : 'Show'}>
                                                        <IconButton onClick={() => handleToggleView(row.id)} size="small">
                                                            {visibleIds.includes(row.id) ? (
                                                                <VisibilityIcon fontSize="small" />

                                                            ) : (
                                                                <VisibilityOffIcon fontSize="small" />
                                                            )}
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {totalResults > 0 && (
                    <PaginationPage
                        page={page}
                        pageSize={pageSize}
                        totalResults={totalResults}
                        jumpPage={jumpPage}
                        handlePageSizeChange={handlePageSizeChange}
                        handlePageChange={handlePageChange}
                        handleJumpPage={handleJumpPage}
                        dictionary={dictionary}
                    />
                )}

            {isModalOpen && (
                <Modal open={isModalOpen} onClose={() => setModalOpen(false)}>
                    <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                        <PreviewContent content={modalContent} onClose={() => setModalOpen(false)} dictionary={dictionary} />
                    </Box>
                </Modal>
            )}

            {isExportModalOpen && (
                <SMSExportModal
                    open={isExportModalOpen}
                    onClose={() => setExportModalOpen(false)}
                    onExport={(exportType) => {
                        handleExport(exportType)
                    }}
                    dictionary={dictionary}
                />
            )}
        </Box>
    )
}

export default SMSMessageContent
