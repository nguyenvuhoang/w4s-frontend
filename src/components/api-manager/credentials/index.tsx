'use client'

import PaginationPage from '@/@core/components/jTable/pagination'
import { CustomCheckboxIcon } from '@/@core/components/mui/CustomCheckboxIcon'
import { Locale } from '@/configs/i18n'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { SearchForm, useOpenApiClientHandler } from '@/services/useOpenApiClientHandler'
import { actionButtonColors, actionButtonSx } from '@/shared/components/forms/button-color/actionButtonSx'
import EmptyListNotice from '@/shared/components/layout/shared/EmptyListNotice'
import { OpenAPIType, PageContentProps, PageData } from '@/shared/types'
import { getDictionary } from '@/shared/utils/getDictionary'
import AddIcon from '@mui/icons-material/Add'
import ApiIcon from '@mui/icons-material/Api'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import EditIcon from '@mui/icons-material/Edit'
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord"
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import ScheduleIcon from '@mui/icons-material/Schedule'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'
import {
    Box, Button, Checkbox, Grid, MenuItem, Paper, Skeleton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField
} from '@mui/material'
import { Session } from 'next-auth'
import { Controller, useForm } from 'react-hook-form'



type PageProps = PageContentProps & {
    openAPIdata: PageData<OpenAPIType>
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    session: Session | null
    locale: Locale
}


const envOptions = [
    { value: 'ALL', label: 'All' },
    { value: 'DEV', label: 'DEV' },
    { value: 'UAT', label: 'UAT' },
    { value: 'PROD', label: 'PROD' }
]

export default function OpenAPIManagementContent({ dictionary, openAPIdata, session, locale }: PageProps) {

    const dict = dictionary['openapi'] || ({} as any)
    const {
        openapi,
        page,
        jumpPage,
        rowsPerPage,
        totalCount,
        loading,
        handleSearch,
        handleJumpPage,
        handlePageChange,
        handlePageSizeChange,
        statusOptions,
        selected, isAllSelected, isIndeterminate,
        toggleAll, toggleOne,
        // computed
        selectedId, selectedRow, hasSelection, canDelete,
        // row actions
        handleRowDblClick, handleDeleteClick,
        openViewPage, openModifyPage, openAddPage
    } = useOpenApiClientHandler(openAPIdata, session, locale, dictionary)


    const onSubmit = (data: SearchForm) => handleSearch(data)
    const { control, handleSubmit } = useForm<SearchForm>({
        defaultValues: {
            query: '',
            environment: 'ALL',
            status: 'ALL'
        }
    })

    return (
        <ContentWrapper
            title={dict.title || 'OpenAPI Clients'}
            description={dict.description || 'Manage API clients & keys'}
            icon={<ApiIcon sx={{ fontSize: 40, color: '#0C9150' }} />}
            dictionary={dictionary}
            issearch
        >
            <Box sx={{ my: 5, width: '100%' }}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={3} mb={5}>
                        {/* Query */}
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Controller
                                name="query"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} fullWidth size="small" label="Client / Name / Scope / By" />
                                )}
                            />
                        </Grid>

                        {/* Environment */}
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Controller
                                name="environment"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} fullWidth size="small" label="Environment" select>
                                        {envOptions.map(o => (
                                            <MenuItem key={o.value} value={o.value}>
                                                {o.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                        </Grid>

                        {/* Status */}
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} fullWidth size="small" label="Status" select>
                                        {statusOptions.map(o => (
                                            <MenuItem key={o.value} value={o.value}>
                                                {o.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                        </Grid>

                        {/* Actions */}
                        <Grid size={{ xs: 12 }} display="flex" justifyContent="space-between" sx={{ mt: 3 }}>
                            <Box display="flex" gap={2}>
                                <Button
                                    variant="outlined"
                                    color="inherit"
                                    startIcon={<AddIcon sx={{ color: '#0C9150' }} />}
                                    sx={{ ...actionButtonSx, ...actionButtonColors.primary }}
                                    onClick={openAddPage}
                                >
                                    {dictionary['common'].add}
                                </Button>

                                <Button
                                    variant="outlined"
                                    color="inherit"
                                    startIcon={<VisibilityIcon sx={{ color: '#1876d1' }} />}
                                    disabled={!selectedRow}
                                    sx={{ ...actionButtonSx, ...actionButtonColors.info }}
                                    onClick={openViewPage}
                                >
                                    {dictionary['common'].view ?? 'View'}
                                </Button>

                                <Button
                                    variant="outlined"
                                    color="inherit"
                                    startIcon={<EditIcon sx={{ color: '#f0a000' }} />}
                                    disabled={!selectedRow}
                                    sx={{ ...actionButtonSx, ...actionButtonColors.warning }}
                                    onClick={openModifyPage}
                                >
                                    {dictionary['common'].modify}
                                </Button>

                                <Button
                                    variant="outlined"
                                    color="inherit"
                                    startIcon={<DeleteIcon sx={{ color: '#d33' }} />}
                                    disabled={!canDelete}
                                    sx={{ ...actionButtonSx, ...actionButtonColors.error }}
                                    onClick={handleDeleteClick}
                                >
                                    {dictionary['common'].delete}
                                </Button>
                            </Box>

                            <Button type="submit" variant="contained" color="primary" startIcon={<SearchIcon />}>
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
                            '& th, & td': { borderBottom: '1px solid #e0e0e0', py: '12px', px: '10px' },
                            '& th': { fontSize: '14px', fontWeight: 600, backgroundColor: '#0C9150', color: 'white' },
                            '& tbody tr:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                            '& tbody tr:hover': { backgroundColor: '#f1fdf5' }
                        }}
                    >
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ width: 48 }}>
                                    <Checkbox
                                        icon={<CustomCheckboxIcon checked={false} header />}
                                        checkedIcon={<CustomCheckboxIcon checked={true} header />}
                                        sx={{ p: 0 }}
                                        size="small"
                                        indeterminate={isIndeterminate}
                                        checked={isAllSelected}
                                        onChange={toggleAll}
                                        slotProps={{ input: { 'aria-label': 'select all rows' } }}
                                        disabled
                                    />
                                </TableCell>
                                {[
                                    dict.client_id,
                                    dict.display_name,
                                    dict.environment,
                                    dict.scopes,
                                    dict.created_by,
                                    dict.created_on_utc,
                                    dict.expired_on_utc,
                                    dict.status,
                                    dict.usage_count,
                                    dict.is_revoked
                                ].map((key: string, i: number) => (
                                    <TableCell key={`${key}-${i}`}>{key}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {loading ? (
                                [...Array(rowsPerPage)].map((_, index) => (
                                    <TableRow key={`skeleton-row-${index}`}>
                                        {[...Array(10)].map((__, colIndex) => (
                                            <TableCell key={`skeleton-cell-${colIndex}`}>
                                                <Skeleton variant="text" width="100%" height={20} />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : !openapi || openapi.items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10}>
                                        <EmptyListNotice message={dictionary.account.nodatatransactionhistory} />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                openapi.items.map((row, index) => {
                                    console.log(row);
                                    const id = row.id
                                    const checked = selected.includes(id)
                                    const isDisabledRow = hasSelection && id !== selectedId
                                    const s = row.status

                                    const fmtDate = (iso?: string | null) => iso ? (iso.includes('T') ? iso.split('T')[0] : iso) : ''

                                    const scopesView = Array.isArray(row.scopes) ? row.scopes.join(', ') : String(row.scopes ?? '')

                                    return (
                                        <TableRow
                                            key={`${row.id}-${index}`}
                                            hover
                                            onDoubleClick={() => handleRowDblClick(row.clientid, row.environment)}
                                            sx={{
                                                cursor: isDisabledRow ? 'default' : 'pointer',
                                                pointerEvents: isDisabledRow ? 'none' : 'auto',
                                                opacity: isDisabledRow ? 0.6 : 1
                                            }}
                                            onClick={() => toggleOne(id)}
                                        >
                                            <TableCell sx={{ width: 48, p: '0 16px' }}>
                                                <Checkbox
                                                    icon={isDisabledRow ? <LockOutlinedIcon sx={{ fontSize: 18, color: '#9e9e9e' }} /> : <CustomCheckboxIcon checked={false} />}
                                                    checkedIcon={<CustomCheckboxIcon checked={true} />}
                                                    size="small"
                                                    checked={checked}
                                                    onChange={() => toggleOne(id)}
                                                    onClick={e => e.stopPropagation()}
                                                    slotProps={{ input: { 'aria-label': `select row ${id}` } }}
                                                />
                                            </TableCell>

                                            <TableCell>{row.clientid}</TableCell>
                                            <TableCell>{row.displayname}</TableCell>
                                            <TableCell>{row.environment}</TableCell>
                                            <TableCell>{scopesView}</TableCell>
                                            <TableCell>{row.createdby}</TableCell>
                                            <TableCell>{fmtDate(row.createdonutc)}</TableCell>
                                            <TableCell>{fmtDate(row.expiredonutc)}</TableCell>

                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    {s === 'ACTIVE' ? (
                                                        <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />
                                                    ) : s === 'REVOKED' ? (
                                                        <DeleteForeverIcon sx={{ color: '#f44336', fontSize: 20 }} />
                                                    ) : s === 'EXPIRED' ? (
                                                        <HourglassTopIcon sx={{ color: '#d32f2f', fontSize: 20 }} />
                                                    ) : s === 'INACTIVE' ? (
                                                        <ScheduleIcon sx={{ color: '#ff9800', fontSize: 20 }} />
                                                    ) : (
                                                        <HelpOutlineIcon sx={{ color: '#9e9e9e', fontSize: 20 }} />
                                                    )}
                                                    <span>{s}</span>
                                                </Box>
                                            </TableCell>

                                            <TableCell>{row.usage_count}</TableCell>

                                            <TableCell>
                                                {row.isrevoked ? (
                                                    <FiberManualRecordIcon sx={{ fontSize: 14, color: "red" }} />
                                                ) : (
                                                    <FiberManualRecordIcon sx={{ fontSize: 14, color: "green" }} />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
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
                        />
                    </Box>
                )}
            </Box>
        </ContentWrapper>
    )
}
