'use client'

import PaginationPage from '@/@core/components/jTable/pagination'
import EmptyListNotice from '@/components/layout/shared/EmptyListNotice'
import { Locale } from '@/configs/i18n'
import { useContractHandler } from '@/services/useContractHandler'
import { PageContentProps } from '@/types'
import { ContractType } from '@/types/bankType'
import { PageData } from '@/types/systemTypes'
import { getDictionary } from '@/utils/getDictionary'
import AddIcon from '@mui/icons-material/Add'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import EditIcon from '@mui/icons-material/Edit'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import ScheduleIcon from '@mui/icons-material/Schedule'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'

import { CustomCheckboxIcon } from '@/@core/components/mui/CustomCheckboxIcon'
import { actionButtonColors, actionButtonSx } from '@/components/forms/button-color/actionButtonSx'
import { getLocalizedUrl } from '@/utils/i18n'
import SwalAlert from '@/utils/SwalAlert'
import {
    Box,
    Button, Checkbox, Grid,
    MenuItem,
    Paper,
    Skeleton,
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow,
    TextField
} from '@mui/material'
import { Session } from 'next-auth'
import Link from 'next/link'
import { Controller, useForm } from 'react-hook-form'

type SearchForm = {
    contractnumber: string
    phonenumber: string
    cifnumber: string
    fullname: string
    idcard: string
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

const ContractManagementContent = ({ dictionary, contractdata, session, locale }: PageProps) => {
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
        statusOptions,
        contractTypeOptions,
        contractLevelOptions,
        selected, isAllSelected, isIndeterminate,
        toggleAll, toggleOne,

        deleteContract
    } = useContractHandler(contractdata, session, locale)

    const { control, handleSubmit } = useForm<SearchForm>({
        defaultValues: {
            contractnumber: '',
            phonenumber: '',
            cifnumber: '',
            fullname: '',
            idcard: '',
            status: 'ALL',
            contracttype: 'IND',
            contractlevel: 'ALL'
        }
    })

    const onSubmit = (data: SearchForm) => handleSearch(data)

    const renderField = (name: keyof SearchForm, label: string) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller
                name={name}
                control={control}
                defaultValue=""
                render={({ field }) => {
                    const isSelect = name === 'status' || name === 'contracttype' || name === 'contractlevel';
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

    const hasSelection = selected.length > 0

    const isDeleted = (s?: string) => ['D', 'DELETE', 'DELETED', 'Delete'].includes((s || '').toUpperCase())
    const isActive = (s?: string) => ['A', 'ACTIVE', 'Active'].includes((s || '').toUpperCase())
    const isProcessing = (s?: string) => !isDeleted(s) && !isActive(s)
    const isModify = (s?: string) => ['E', 'EDIT', 'EDITED', 'Edit'].includes((s || '').toUpperCase())

    const selectedId = selected[0] ?? null
    const selectedRow = contracts?.items.find(x => x.contractnumber === selectedId) || null
    const canDelete = !!selectedRow && isActive(selectedRow.status)
    const canModify = !!selectedRow && isActive(selectedRow.status)


    const handleRowDblClick = (id: string) => {
        if (hasSelection) return;

        window.open(getLocalizedUrl(`/contract-management/view/contractmanagementview/${id}`, locale), '_blank')
    }

    const handleDeleteClick = async () => {
        if (selected.length !== 1) return
        const id = selected[0]
        const row = contracts?.items.find(x => x.contractnumber === id)

        if (!row) return

        if (isDeleted(row.status)) {
            SwalAlert(
                'warning',
                dictionary['contract'].cannot_delete_already_deleted.replace('{0}', id),
                'center'
            )
            return
        }

        if (isProcessing(row.status)) {
            SwalAlert(
                'warning',
                dictionary?.contract?.cannot_delete_processing.replace('{0}', id),
                'center'
            )
            return
        }

        SwalAlert(
            'question',
            dictionary["contract"].deletecontract.replace('{0}', id),
            "center",
            false,
            true,
            true,
            async () => {
                const apideleteContract = await deleteContract(id)
                if (apideleteContract.ok) {
                    SwalAlert('success', dictionary['contract'].delete_success_text.replace('{0}', id), 'center')
                } else {
                    SwalAlert('error', apideleteContract.message, 'center')
                }
            }
        )
    }

    const handleModifyClick = () => {
        if (selected.length !== 1) return
        const id = selected[0]
        const row = contracts?.items.find(x => x.contractnumber === id)

        if (!row) return

        if (isModify(row.status)) {
            SwalAlert(
                'warning',
                dictionary['contract'].cannot_modify_already_deleted.replace('{0}', id),
                'center'
            )
            return
        }

        if (isProcessing(row.status)) {
            SwalAlert(
                'warning',
                dictionary?.contract?.cannot_modify_processing.replace('{0}', id),
                'center'
            )
            return
        }

        window.open(getLocalizedUrl(`/contract-management/modify/contractmanagementview/${id}`, locale), '_blank')
    }

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
                    {renderField('contractlevel', 'Contract Level')}

                    <Grid size={{ xs: 12 }} display="flex" justifyContent="space-between" sx={{ mt: 3 }}>
                        {/* Bên trái: Add, Modify, Delete */}
                        <Box display="flex" gap={2}>
                            <Button
                                variant="outlined"
                                color="inherit"
                                startIcon={<AddIcon sx={{ color: '#225087' }} />}
                                disabled={loading}
                                sx={{ ...actionButtonSx, ...actionButtonColors.primary }}
                                component={Link}
                                href={getLocalizedUrl('/contract-management/add/', locale as Locale)}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {dictionary['common'].add}
                            </Button>

                            <Button
                                variant="outlined"
                                color="inherit"
                                startIcon={<VisibilityIcon sx={{ color: '#1876d1' }} />}
                                disabled={loading || selected.length !== 1}
                                sx={{ ...actionButtonSx, ...actionButtonColors.info }}
                                onClick={() => {
                                    const id = selected[0]
                                    window.open(getLocalizedUrl(`/contract-management/view/contractmanagementview/${id}`, locale), '_blank')
                                }}
                            >
                                {dictionary['common'].view ?? 'View'}
                            </Button>

                            <Button
                                variant="outlined"
                                color="inherit"
                                startIcon={<EditIcon sx={{ color: '#f0a000' }} />}
                                disabled={loading || selected.length !== 1 || !canModify}
                                sx={{ ...actionButtonSx, ...actionButtonColors.warning }}
                                onClick={handleModifyClick}
                            >
                                {dictionary['common'].modify}
                            </Button>

                            <Button
                                variant="outlined"
                                color="inherit"
                                startIcon={<DeleteIcon sx={{ color: '#d33' }} />}
                                disabled={loading || selected.length !== 1 || !canDelete}
                                sx={{ ...actionButtonSx, ...actionButtonColors.error }}
                                onClick={handleDeleteClick}
                            >
                                {dictionary['common'].delete}
                            </Button>
                        </Box>


                        {/* Bên phải: Search */}
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
                        ) : contracts?.items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10}>
                                    <EmptyListNotice message={dictionary.account.nodatatransactionhistory} />
                                </TableCell>
                            </TableRow>
                        ) : (
                            contracts?.items.map((row, index) => {
                                const id = row.contractnumber
                                const checked = selected.includes(id)
                                const isDisabledRow = hasSelection && id !== selectedId
                                return (
                                    <TableRow key={`${row.contractnumber}-${index}`}
                                        hover
                                        onDoubleClick={() => handleRowDblClick(row.contractnumber)}
                                        sx={{
                                            cursor: isDisabledRow ? 'default' : 'pointer',
                                            pointerEvents: isDisabledRow ? 'none' : 'auto',
                                            opacity: isDisabledRow ? 0.6 : 1,
                                        }}
                                    >
                                        <TableCell sx={{ width: 48, padding: '0 16px' }}>
                                            <Checkbox
                                                icon={
                                                    isDisabledRow
                                                        ? <LockOutlinedIcon sx={{ fontSize: 18, color: '#9e9e9e' }} />
                                                        : <CustomCheckboxIcon checked={false} />
                                                }
                                                checkedIcon={<CustomCheckboxIcon checked={true} />}
                                                size="small"
                                                checked={checked}
                                                onChange={() => toggleOne(id)}
                                                onClick={(e) => e.stopPropagation()}
                                                slotProps={{
                                                    input: {
                                                        'aria-label': `select row ${id}`,
                                                    },
                                                }}

                                            />
                                        </TableCell>
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
                                                ) : row.status === 'B' ? (
                                                    <LockOutlinedIcon sx={{ color: '#9c27b0', fontSize: 20 }} />
                                                ) : (
                                                    <HelpOutlineIcon sx={{ color: '#9e9e9e', fontSize: 20 }} />
                                                )}
                                                <span>{row.status_caption}</span>
                                            </Box>

                                        </TableCell>

                                        <TableCell>{row.branchcode}</TableCell>
                                    </TableRow>
                                )
                            }
                            )
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
export default ContractManagementContent

