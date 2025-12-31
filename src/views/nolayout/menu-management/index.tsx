'use client'

import type { Locale } from '@configs/i18n'
import { useMemo, useState } from 'react'

// Components
import { CustomCheckboxIcon } from '@/@core/components/mui/CustomCheckboxIcon'
import PaginationPage from '@/@core/components/jTable/pagination'
import EmptyListNotice from '@/components/layout/shared/EmptyListNotice'
import { actionButtonColors, actionButtonSx } from '@/components/forms/button-color/actionButtonSx'
import { MenuItem } from '@/types/systemTypes'
import { getDictionary } from '@/utils/getDictionary'
import { getLocalizedUrl } from '@/utils/i18n'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import {
    Box,
    Button,
    Checkbox,
    Grid,
    MenuItem as MuiMenuItem,
    Paper,
    SelectChangeEvent,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField
} from '@mui/material'
import { Session } from 'next-auth'
import { Controller, useForm } from 'react-hook-form'

type Props = {
    locale: Locale
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    session: Session | null
    data: MenuItem[]
}

type SearchForm = {
    command_id: string
    command_name: string
    application_code: string
    command_type: string
    is_visible: string
}

export default function MenuManagementContent({ locale, dictionary, session, data }: Props) {
    const [loading, setLoading] = useState(false)
    const [selected, setSelected] = useState<string[]>([])
    const [page, setPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [jumpPage, setJumpPage] = useState<number>(1)
    const [filteredData, setFilteredData] = useState<MenuItem[]>(data)

    const { control, handleSubmit } = useForm<SearchForm>({
        defaultValues: {
            command_id: '',
            command_name: '',
            application_code: 'ALL',
            command_type: 'ALL',
            is_visible: 'ALL'
        }
    })

    // Get unique application codes for dropdown
    const applicationCodes = useMemo(() => {
        const codes = [...new Set(data.map(item => item.application_code))].filter(Boolean)
        return [{ value: 'ALL', label: dictionary['common']?.all || 'All' }, ...codes.map(code => ({ value: code, label: code }))]
    }, [data, dictionary])

    // Command type options
    const commandTypeOptions = [
        { value: 'ALL', label: dictionary['common']?.all || 'All' },
        { value: 'T', label: 'Transaction (T)' },
        { value: 'M', label: 'Menu (M)' },
        { value: 'S', label: 'System (S)' }
    ]

    // Visibility options
    const visibilityOptions = [
        { value: 'ALL', label: dictionary['common']?.all || 'All' },
        { value: 'true', label: dictionary['common']?.visible || 'Visible' },
        { value: 'false', label: dictionary['common']?.hidden || 'Hidden' }
    ]

    const onSubmit = (formData: SearchForm) => {
        setLoading(true)
        setTimeout(() => {
            let result = [...data]

            if (formData.command_id) {
                result = result.filter(item =>
                    item.command_id.toLowerCase().includes(formData.command_id.toLowerCase())
                )
            }
            if (formData.command_name) {
                result = result.filter(item =>
                    item.command_name.toLowerCase().includes(formData.command_name.toLowerCase())
                )
            }
            if (formData.application_code !== 'ALL') {
                result = result.filter(item => item.application_code === formData.application_code)
            }
            if (formData.command_type !== 'ALL') {
                result = result.filter(item => item.command_type === formData.command_type)
            }
            if (formData.is_visible !== 'ALL') {
                const visibleValue = formData.is_visible === 'true'
                result = result.filter(item => item.is_visible === visibleValue)
            }

            setFilteredData(result)
            setPage(1)
            setSelected([])
            setLoading(false)
        }, 300)
    }

    // Pagination
    const totalCount = filteredData.length
    const paginatedData = useMemo(() => {
        const startIndex = (page - 1) * rowsPerPage
        return filteredData.slice(startIndex, startIndex + rowsPerPage)
    }, [filteredData, page, rowsPerPage])

    const handlePageChange = (_: any, newPage: number) => {
        setPage(newPage)
        setSelected([])
    }

    const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
        setRowsPerPage(event.target.value as number)
        setPage(1)
        setSelected([])
    }

    const handleJumpPage: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = (event) => {
        const targetPage = parseInt(event.target.value)
        const maxPage = Math.ceil(totalCount / rowsPerPage)
        if (targetPage >= 1 && targetPage <= maxPage) {
            setPage(targetPage)
            setSelected([])
        }
        setJumpPage(1)
    }

    // Selection handlers
    const hasSelection = selected.length > 0
    const selectedId = selected[0] ?? null
    const isAllSelected = paginatedData.length > 0 && selected.length === paginatedData.length
    const isIndeterminate = selected.length > 0 && selected.length < paginatedData.length

    const toggleAll = () => {
        if (isAllSelected) {
            setSelected([])
        } else {
            setSelected(paginatedData.map(row => row.command_id))
        }
    }

    const toggleOne = (id: string) => {
        if (selected.includes(id)) {
            setSelected([])
        } else {
            setSelected([id])
        }
    }

    const handleRowDblClick = (commandId: string) => {
        if (hasSelection) return
        window.open(getLocalizedUrl(`/menu-management/view/${commandId}`, locale), '_blank')
    }

    const renderField = (name: keyof SearchForm, label: string) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller
                name={name}
                control={control}
                defaultValue=""
                render={({ field }) => {
                    const isSelect = name === 'application_code' || name === 'command_type' || name === 'is_visible'
                    const options =
                        name === 'application_code'
                            ? applicationCodes
                            : name === 'command_type'
                                ? commandTypeOptions
                                : name === 'is_visible'
                                    ? visibilityOptions
                                    : []

                    return (
                        <TextField
                            {...field}
                            fullWidth
                            size="small"
                            label={label}
                            select={isSelect}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value)}
                        >
                            {isSelect &&
                                options.map((o) => (
                                    <MuiMenuItem key={o.value} value={o.value}>
                                        {o.label}
                                    </MuiMenuItem>
                                ))}
                        </TextField>
                    )
                }}
            />
        </Grid>
    )

    // Parse command_name_language to get localized name
    const getLocalizedCommandName = (item: MenuItem): string => {
        try {
            const parsed = JSON.parse(item.command_name_language)
            return parsed[locale] || parsed['en'] || item.command_name
        } catch {
            return item.command_name
        }
    }

    return (
        <Box sx={{ my: 5, width: '100%' }}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={3} mb={5}>
                    {renderField('command_id', dictionary['menumanagement']?.command_id || 'Command ID')}
                    {renderField('command_name', dictionary['menumanagement']?.command_name || 'Command Name')}
                    {renderField('application_code', dictionary['menumanagement']?.application_code || 'Application')}
                    {renderField('command_type', dictionary['menumanagement']?.command_type || 'Type')}
                    {renderField('is_visible', dictionary['menumanagement']?.is_visible || 'Visible')}

                    <Grid size={{ xs: 12 }} display="flex" justifyContent="space-between" sx={{ mt: 3 }}>
                        {/* Left side buttons */}
                        <Box display="flex" gap={2}>
                            <Button
                                variant="outlined"
                                color="inherit"
                                startIcon={<AddIcon sx={{ color: '#225087' }} />}
                                disabled={loading}
                                sx={{ ...actionButtonSx, ...actionButtonColors.primary }}
                            >
                                {dictionary['common']?.add || 'Add'}
                            </Button>

                            <Button
                                variant="outlined"
                                color="inherit"
                                startIcon={<VisibilityIcon sx={{ color: '#1876d1' }} />}
                                disabled={loading || selected.length !== 1}
                                sx={{ ...actionButtonSx, ...actionButtonColors.info }}
                                onClick={() => {
                                    const id = selected[0]
                                    window.open(getLocalizedUrl(`/menu-management/view/${id}`, locale), '_blank')
                                }}
                            >
                                {dictionary['common']?.view ?? 'View'}
                            </Button>

                            <Button
                                variant="outlined"
                                color="inherit"
                                startIcon={<EditIcon sx={{ color: '#f0a000' }} />}
                                disabled={loading || selected.length !== 1}
                                sx={{ ...actionButtonSx, ...actionButtonColors.warning }}
                            >
                                {dictionary['common']?.modify || 'Modify'}
                            </Button>

                            <Button
                                variant="outlined"
                                color="inherit"
                                startIcon={<DeleteIcon sx={{ color: '#d33' }} />}
                                disabled={loading || selected.length !== 1}
                                sx={{ ...actionButtonSx, ...actionButtonColors.error }}
                            >
                                {dictionary['common']?.delete || 'Delete'}
                            </Button>
                        </Box>

                        {/* Right side: Search */}
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            startIcon={<SearchIcon />}
                            disabled={loading}
                        >
                            {dictionary['common']?.search || 'Search'}
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
                            <TableCell sx={{ width: 48 }}>
                                <Checkbox
                                    icon={<CustomCheckboxIcon checked={false} header />}
                                    checkedIcon={<CustomCheckboxIcon checked={true} header />}
                                    sx={{ padding: 0 }}
                                    size="small"
                                    indeterminate={isIndeterminate}
                                    checked={isAllSelected}
                                    onChange={toggleAll}
                                    slotProps={{
                                        input: {
                                            'aria-label': 'select all rows'
                                        }
                                    }}
                                    disabled
                                />
                            </TableCell>
                            <TableCell>{dictionary['menumanagement']?.command_id || 'Command'}</TableCell>
                            <TableCell>{dictionary['menumanagement']?.parent_id || 'Parent'}</TableCell>
                            <TableCell>{dictionary['menumanagement']?.command_type || 'Type'}</TableCell>
                            <TableCell>{dictionary['menumanagement']?.command_uri || 'Href'}</TableCell>
                            <TableCell>{dictionary['menumanagement']?.application_code || 'App'}</TableCell>
                            <TableCell>{dictionary['menumanagement']?.display_order || 'Order'}</TableCell>
                            <TableCell>{dictionary['menumanagement']?.is_visible || 'Visible'}</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {loading ? (
                            [...Array(rowsPerPage)].map((_, index) => (
                                <TableRow key={`skeleton-row-${index}`}>
                                    <TableCell sx={{ width: 48, padding: '0 16px' }}>
                                        <Skeleton variant="rectangular" width={18} height={18} />
                                    </TableCell>
                                    {[...Array(7)].map((_, colIndex) => (
                                        <TableCell key={`skeleton-cell-${colIndex}`}>
                                            <Skeleton variant="text" width="100%" height={20} />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : paginatedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8}>
                                    <EmptyListNotice message={dictionary['common']?.nodata || 'No data available'} />
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedData.map((row, index) => {
                                const id = row.command_id
                                const checked = selected.includes(id)
                                const isDisabledRow = hasSelection && id !== selectedId
                                return (
                                    <TableRow
                                        key={`${row.command_id}-${index}`}
                                        hover
                                        onDoubleClick={() => handleRowDblClick(row.command_id)}
                                        sx={{
                                            cursor: isDisabledRow ? 'default' : 'pointer',
                                            pointerEvents: isDisabledRow ? 'none' : 'auto',
                                            opacity: isDisabledRow ? 0.6 : 1
                                        }}
                                    >
                                        <TableCell sx={{ width: 48, padding: '0 16px' }}>
                                            <Checkbox
                                                icon={
                                                    isDisabledRow ? (
                                                        <LockOutlinedIcon sx={{ fontSize: 18, color: '#9e9e9e' }} />
                                                    ) : (
                                                        <CustomCheckboxIcon checked={false} />
                                                    )
                                                }
                                                checkedIcon={<CustomCheckboxIcon checked={true} />}
                                                size="small"
                                                checked={checked}
                                                onChange={() => toggleOne(id)}
                                                onClick={(e) => e.stopPropagation()}
                                                slotProps={{
                                                    input: {
                                                        'aria-label': `select row ${id}`
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box>
                                                <strong>{row.command_id}</strong>
                                                <br />
                                                <span style={{ fontSize: '12px', color: '#666' }}>
                                                    {getLocalizedCommandName(row)}
                                                </span>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{row.parent_id === '0' ? '-' : row.parent_id}</TableCell>
                                        <TableCell>{row.command_type}</TableCell>
                                        <TableCell>{row.command_uri || '-'}</TableCell>
                                        <TableCell>{row.application_code}</TableCell>
                                        <TableCell>{row.display_order}</TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                {row.is_visible ? (
                                                    <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />
                                                ) : (
                                                    <CancelIcon sx={{ color: '#f44336', fontSize: 20 }} />
                                                )}
                                            </Box>
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
                        dictionary={dictionary}
                    />
                </Box>
            )}
        </Box>
    )
}
