'use client'

import PaginationPage from '@/@core/components/jTable/pagination'
import { CustomCheckboxIcon } from '@/@core/components/mui/CustomCheckboxIcon'
import { Locale } from '@/configs/i18n'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { LearnAPISearchForm, useLearnAPIHandler } from '@/services/useLearnAPIHandler'
import { actionButtonColors, actionButtonSx } from '@/shared/components/forms/button-color/actionButtonSx'
import EmptyListNotice from '@/shared/components/layout/shared/EmptyListNotice'
import { LearnAPIType, PageData } from '@/shared/types'
import { getDictionary } from '@/shared/utils/getDictionary'
import ApiIcon from '@mui/icons-material/Api'
import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'
import {
    Box, Button, Checkbox, Chip, Grid, MenuItem, Paper, Skeleton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField
} from '@mui/material'
import { Session } from 'next-auth'
import { Controller, useForm } from 'react-hook-form'

type PageProps = {
    learnAPIData: PageData<LearnAPIType>
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    session: Session | null
    locale: Locale
}

export default function LearnAPIManagementContent({ dictionary, learnAPIData, session, locale }: PageProps) {
    const dict = dictionary['common'] || ({} as any)

    const {
        learnAPIs,
        page,
        jumpPage,
        rowsPerPage,
        totalCount,
        loading,
        handleSearch,
        handleJumpPage,
        handlePageChange,
        handlePageSizeChange,
        channelOptions,
        methodOptions,
        selected,
        isAllSelected,
        isIndeterminate,
        toggleAll,
        toggleOne,
        hasSelection,
        selectedId,
        handleRowDblClick,
        openViewPage,
        openModifyPage
    } = useLearnAPIHandler(learnAPIData, session, locale, dictionary)

    const onSubmit = (data: LearnAPISearchForm) => handleSearch(data)
    const { control, handleSubmit } = useForm<LearnAPISearchForm>({
        defaultValues: {
            query: '',
            channel: 'ALL',
            method: 'ALL'
        }
    })

    const getMethodColor = (method: string): 'success' | 'info' | 'warning' | 'error' | 'default' => {
        switch (method?.toUpperCase()) {
            case 'GET': return 'success'
            case 'POST': return 'info'
            case 'PUT': return 'warning'
            case 'DELETE': return 'error'
            default: return 'default'
        }
    }

    return (
        <ContentWrapper
            title="Learn APIs"
            description="Manage LearnAPI configurations"
            icon={<ApiIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            dictionary={dictionary}
            issearch
        >
            <Box sx={{ my: 5, width: '100%' }}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={3} mb={5}>
                        {/* Search Query */}
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Controller
                                name="query"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} fullWidth size="small" label="API ID / Name / URI" />
                                )}
                            />
                        </Grid>

                        {/* Channel */}
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Controller
                                name="channel"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} fullWidth size="small" label="Channel" select>
                                        {channelOptions.map(o => (
                                            <MenuItem key={o.value} value={o.value}>
                                                {o.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                        </Grid>

                        {/* Method */}
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Controller
                                name="method"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} fullWidth size="small" label="Method" select>
                                        {methodOptions.map(o => (
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
                                    startIcon={<VisibilityIcon sx={{ color: '#1876d1' }} />}
                                    disabled={!selectedId}
                                    sx={{ ...actionButtonSx, ...actionButtonColors.info }}
                                    onClick={openViewPage}
                                >
                                    {dict.view ?? 'View'}
                                </Button>

                                <Button
                                    variant="outlined"
                                    color="inherit"
                                    startIcon={<EditIcon sx={{ color: '#f0a000' }} />}
                                    disabled={!selectedId}
                                    sx={{ ...actionButtonSx, ...actionButtonColors.warning }}
                                    onClick={openModifyPage}
                                >
                                    {dict.modify ?? 'Modify'}
                                </Button>
                            </Box>

                            <Button type="submit" variant="contained" color="primary" startIcon={<SearchIcon />}>
                                {dict.search}
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
                            '& th': { fontSize: '14px', fontWeight: 600, backgroundColor: 'primary.main', color: 'white' },
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
                                <TableCell>API ID</TableCell>
                                <TableCell>API Name</TableCell>
                                <TableCell>Method</TableCell>
                                <TableCell>Channel</TableCell>
                                <TableCell>URI</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {loading ? (
                                [...Array(rowsPerPage)].map((_, index) => (
                                    <TableRow key={`skeleton-row-${index}`}>
                                        {[...Array(6)].map((__, colIndex) => (
                                            <TableCell key={`skeleton-cell-${colIndex}`}>
                                                <Skeleton variant="text" width="100%" height={20} />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : !learnAPIs || learnAPIs.items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6}>
                                        <EmptyListNotice message={dictionary.account?.nodatatransactionhistory ?? 'No data found'} />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                learnAPIs.items.map((row, index) => {
                                    const id = row.learn_api_id
                                    const checked = selected.includes(id)
                                    const isDisabledRow = hasSelection && id !== selectedId

                                    return (
                                        <TableRow
                                            key={`${row.learn_api_id}-${index}`}
                                            hover
                                            onDoubleClick={() => handleRowDblClick(row.learn_api_id)}
                                            sx={{
                                                cursor: isDisabledRow ? 'default' : 'pointer',
                                                pointerEvents: isDisabledRow ? 'none' : 'auto',
                                                opacity: isDisabledRow ? 0.6 : 1
                                            }}
                                            onClick={() => toggleOne(id)}
                                        >
                                            <TableCell sx={{ width: 48, p: '0 16px' }}>
                                                <Checkbox
                                                    icon={<CustomCheckboxIcon checked={false} />}
                                                    checkedIcon={<CustomCheckboxIcon checked={true} />}
                                                    size="small"
                                                    checked={checked}
                                                    onChange={() => toggleOne(id)}
                                                    onClick={e => e.stopPropagation()}
                                                    slotProps={{ input: { 'aria-label': `select row ${id}` } }}
                                                />
                                            </TableCell>

                                            <TableCell>{row.learn_api_id}</TableCell>
                                            <TableCell>{row.learn_api_name}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={row.learn_api_method}
                                                    size="small"
                                                    color={getMethodColor(row.learn_api_method)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={row.channel}
                                                    size="small"
                                                    variant="outlined"
                                                    color={row.channel === 'BO' ? 'primary' : 'secondary'}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {row.uri}
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
