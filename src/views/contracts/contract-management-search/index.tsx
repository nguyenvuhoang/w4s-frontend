'use client'

import PaginationPage from '@/@core/components/jTable/pagination'
import EmptyListNotice from '@/components/layout/shared/EmptyListNotice'
import { Locale } from '@/configs/i18n'
import { useContractApproveHandler } from '@/services/useContractApproveHandler'
import { PageContentProps } from '@/types'
import { ContractType } from '@/types/bankType'
import { PageData } from '@/types/systemTypes'
import { getDictionary } from '@/utils/getDictionary'
import { getLocalizedUrl } from '@/utils/i18n'
import ContentWrapper from '@/views/components/layout/content-wrapper'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import ScheduleIcon from '@mui/icons-material/Schedule'
import SearchIcon from '@mui/icons-material/Search'
import {
    Box,
    Button, Grid,
    MenuItem,
    Paper,
    Skeleton,
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow,
    TextField
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import { Session } from 'next-auth'
import { Controller, useForm } from 'react-hook-form'

type SearchForm = {
    contractnumber: string
    phonenumber: string
    cifnumber: string
    fullname: string
    idcard: string
    opendate: string
    expiredate: string
    status: string
    contracttype: string
    contractlevel: string
}

type PageProps = PageContentProps & {
    contractdata: PageData<ContractType>
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    session: Session | null
    locale: Locale
}

const ContractManagementApproveSearchContent = ({ dictionary, contractdata, session, locale }: PageProps) => {
    const {
        contracts,
        page,
        jumpPage,
        rowsPerPage,
        totalCount,
        loading,
        handleSearch,
        handleJumpPage,
        handlePageChange,
        handlePageSizeChange,
        contractLevelOptions,
        statusOptions,
        contractTypeOptions
    } = useContractApproveHandler(contractdata, session, locale)

    const { control, handleSubmit } = useForm<SearchForm>({
        defaultValues: {
            contractnumber: '',
            phonenumber: '',
            cifnumber: '',
            fullname: '',
            idcard: '',
            status: 'ALL',
            opendate: '',
            expiredate: '',
            contracttype: 'ALL',
            contractlevel: 'ALL'
        }
    })

    const onSubmit = (data: SearchForm) => handleSearch(data)

    const renderField = (name: keyof SearchForm, label: string) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller
                name={name}
                control={control}
                defaultValue="ALL"
                render={({ field }) => {
                    const isSelect = name === 'status' || name === 'contracttype';
                    const options =
                        name === 'status'
                            ? statusOptions
                            : name === 'contracttype'
                                ? contractTypeOptions
                                : name === 'contractlevel'
                                    ? contractLevelOptions
                                    : [];

                    return (
                        <TextField
                            {...field}
                            fullWidth
                            size="small"
                            label={label}
                            select={isSelect}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value)}
                        >
                            {isSelect &&
                                options.map((o) => (
                                    <MenuItem key={o.value} value={o.value}>
                                        {o.label}
                                    </MenuItem>
                                ))}
                        </TextField>
                    );
                }}
            />

        </Grid>
    )

    const renderDateField = (name: 'opendate' | 'expiredate', label: string) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller
                name={name}
                control={control}
                render={({ field: { value, onChange } }) => (
                    <DatePicker
                        label={label}
                        value={value ? dayjs(value, 'DD/MM/YYYY') : null}
                        format="DD/MM/YYYY"
                        onChange={(newValue) => {
                            const formatted = newValue ? dayjs(newValue).format('DD/MM/YYYY') : ''
                            onChange(formatted)
                        }}
                        slotProps={{
                            textField: {
                                size: 'small',
                                fullWidth: true
                            },
                            openPickerButton: {
                                sx: {
                                    color: '#225087 !important',
                                    '& .MuiSvgIcon-root': {
                                        color: '#225087 !important'
                                    }
                                },
                                children: (<><CalendarTodayIcon sx={{ marginRight: 1 }} /></>)
                            }
                        }}
                    />
                )}
            />
        </Grid>
    )

    const isEmptyRow = (row: any) => {
        if (!row || typeof row !== 'object') return true
        const vals = Object.values(row)
        if (vals.length === 0) return true
        return vals.every(v => v === null || v === undefined || v === '')
    }

    const safeItems = (contracts?.items ?? []).filter(r => !isEmptyRow(r))
    const showEmpty = !loading && safeItems.length === 0

    return (

        <Box sx={{ my: 5, width: '100%' }}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={3} mb={5}>
                    {renderField('contractnumber', 'Contract Number')}
                    {renderField('phonenumber', 'Phone Number')}
                    {renderField('cifnumber', 'CIF Number')}
                    {renderField('fullname', 'Full Name')}
                    {renderField('idcard', 'ID Card')}
                    {renderField('status', 'Status')}
                    {renderField('contracttype', 'Contract Type')}
                    {renderDateField('opendate', 'Open Date')}
                    {renderDateField('expiredate', 'Expire Date')}
                    {renderField('contractlevel', 'Contract Level')}


                    <Grid size={{ xs: 12 }} display="flex" justifyContent="flex-end">
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            startIcon={<SearchIcon />}
                            disabled={loading}
                        >
                            {dictionary['common'].search}
                        </Button>
                    </Grid>
                </Grid>

            </form>

            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
                <Table
                    size="small"
                    sx={{
                        border: '1px solid #d0d0d0',
                        fontSize: '15px',
                        '& th, & td': {
                            borderBottom: '1px solid #e0e0e0',
                            paddingY: '12px',
                            paddingX: '10px'
                        },
                        '& th': {
                            fontSize: '14px',
                            fontWeight: 600,
                            backgroundColor: '#225087',
                            color: 'white'
                        },
                        '& tbody tr:nth-of-type(odd)': {
                            backgroundColor: '#fafafa'
                        },
                        '& tbody tr:hover': {
                            backgroundColor: '#f1fdf5'
                        }
                    }}
                >
                    <TableHead>
                        <TableRow>
                            {[
                                'contractnumber',
                                'phonenumber',
                                'fullname',
                                'idcard',
                                'usercreated',
                                'opendate',
                                'expiredate',
                                'corebankingcifnumber',
                                'status',
                                'branchcode'
                            ].map(key => (
                                <TableCell key={key}>{dictionary.contract?.[key as keyof typeof dictionary.contract] ?? key}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {loading ? (
                            [...Array(rowsPerPage)].map((_, index) => (
                                <TableRow key={`skeleton-row-${index}`}>
                                    {[...Array(10)].map((_, colIndex) => (
                                        <TableCell key={`skeleton-cell-${colIndex}`}>
                                            <Skeleton variant="text" width="100%" height={20} />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : showEmpty ? (
                            <TableRow>
                                <TableCell colSpan={10}>
                                    <EmptyListNotice message={dictionary.common.nodata} />
                                </TableCell>
                            </TableRow>
                        ) : (
                            contracts?.items.map((row, index) => (
                                <TableRow key={`${row.contractnumber}-${index}`}
                                    hover
                                    onDoubleClick={() => {
                                        window.open(
                                            getLocalizedUrl(`/contract-management/approve/contractmanagementview/${row.contractnumber}`, locale), '_blank'
                                        )
                                    }}
                                    sx={{ cursor: 'pointer' }}
                                    title={row.request_refid || ''}
                                >
                                    <TableCell>{row.contractnumber}</TableCell>
                                    <TableCell>{row.phone}</TableCell>
                                    <TableCell>{row.fullname}</TableCell>
                                    <TableCell>{row.idcard}</TableCell>
                                    <TableCell>{row.usercreate}</TableCell>
                                    <TableCell>{row.opendate?.split('T')[0]}</TableCell>
                                    <TableCell>{row.expiredate?.split('T')[0]}</TableCell>
                                    <TableCell>{row.corebankingcifnumber}</TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {row.status === 'A' ? (
                                                <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />
                                            ) : row.status === 'P' ? (
                                                <ScheduleIcon sx={{ color: '#ff9800', fontSize: 20 }} />
                                            ) : row.status === 'C' ? (
                                                <CancelIcon sx={{ color: '#f44336', fontSize: 20 }} />
                                            ) : row.status === 'D' ? (
                                                <DeleteForeverIcon sx={{ color: '#f44336', fontSize: 20 }} />
                                            ) : row.status === 'G' ? (
                                                <HourglassTopIcon sx={{ color: '#d32f2f', fontSize: 20 }} />
                                            ) : (
                                                <HelpOutlineIcon sx={{ color: '#9e9e9e', fontSize: 20 }} />
                                            )}
                                            <span>{row.status_caption}</span>
                                        </Box>
                                    </TableCell>

                                    <TableCell>{row.branchcode}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>


            {totalCount > 0 && (
                <Box mt={5}>
                    <PaginationPage
                        page={page}
                        pageSize={rowsPerPage}
                        totalResults={totalCount}
                        jumpPage={jumpPage}
                        handlePageChange={handlePageChange}
                        handlePageSizeChange={handlePageSizeChange}
                        handleJumpPage={handleJumpPage}
                        dictionary={dictionary}
                    />
                </Box>
            )}

        </Box>
    )
}
export default ContractManagementApproveSearchContent

