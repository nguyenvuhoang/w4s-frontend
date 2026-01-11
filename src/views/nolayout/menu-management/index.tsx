'use client'

import type { Locale } from '@configs/i18n'
import { useEffect, useMemo, useState } from 'react'

// Components
import PaginationPage from '@/@core/components/jTable/pagination'
import { CustomCheckboxIcon } from '@/@core/components/mui/CustomCheckboxIcon'
import { actionButtonColors, actionButtonSx } from '@/components/forms/button-color/actionButtonSx'
import EmptyListNotice from '@/components/layout/shared/EmptyListNotice'
import { MenuItem, PageData } from '@/types/systemTypes'
import { getDictionary } from '@/utils/getDictionary'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'
import ViewListIcon from '@mui/icons-material/ViewList'
import VisibilityIcon from '@mui/icons-material/Visibility'
import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grid,
    MenuItem as MuiMenuItem,
    Paper,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip
} from '@mui/material'
import { Session } from 'next-auth'
import { Controller, useForm } from 'react-hook-form'

// Hooks
import { useMenuManagement } from './hooks/useMenuManagement'
import { useMenuTree } from './hooks/useMenuTree'

// Components
import { MenuEditModal } from './components/MenuEditModal'
import { MenuFormModal } from './components/MenuFormModal'
import { MenuTableRow } from './components/MenuTableRow'
import { MenuViewModal } from './components/MenuViewModal'

type Props = {
    locale: Locale
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    session: Session | null
    data: PageData<MenuItem>
}

type SearchForm = {
    command_id: string
    command_name: string
    application_code: string
    command_type: string
    is_visible: string
}

export default function MenuManagementContent({ locale, dictionary, session, data }: Props) {
    const [menuData, setMenuData] = useState<MenuItem[]>(data?.items || [])

    // Custom hooks
    const menuManagement = useMenuManagement(menuData, {
        sessionToken: session?.user?.token as string,
        locale,
        onDataUpdate: setMenuData,
        initialPagination: {
            total_count: data?.total_count,
            total_pages: data?.total_pages,
            has_previous_page: data?.has_previous_page,
            has_next_page: data?.has_next_page
        }
    })
    const menuTree = useMenuTree(menuManagement.filteredData)

    const { control, handleSubmit, getValues } = useForm<SearchForm>({
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
        const codes = [...new Set(menuData.map(item => item.application_code))].filter(Boolean)
        return [{ value: 'ALL', label: dictionary['common']?.all || 'All' }, ...codes.map(code => ({ value: code, label: code }))]
    }, [menuData, dictionary])

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

    const onSubmit = async (formData: SearchForm) => {
        await menuManagement.handleSearch(formData, menuData, true) // Reset to page 1 on new search
    }
    
    // Auto-search on mount to initialize pagination
    useEffect(() => {
        const initialFormData = getValues()
        menuManagement.handleSearch(initialFormData, menuData, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Only run once on mount

    // Tree data for tree view mode
    const treeData = menuTree.buildTree
    const displayData = useMemo(() => {
        if (menuManagement.viewMode === 'tree') {
            return menuTree.flattenTree(treeData, menuManagement.expandedRows)
        }
        return menuManagement.filteredData.map(item => ({ ...item, level: 0 }))
    }, [menuManagement.filteredData, treeData, menuManagement.expandedRows, menuManagement.viewMode, menuTree])

    // Selection state
    const isAllSelected = displayData.length > 0 && menuManagement.selected.length === displayData.length
    const isIndeterminate = menuManagement.selected.length > 0 && menuManagement.selected.length < displayData.length

    const handleToggleAll = () => {
        menuManagement.toggleAll(displayData.map(row => row.command_id))
    }

    const handleRowDblClick = (commandId: string) => {
        if (menuManagement.hasSelection) return
        const menuItem = menuData.find(item => item.command_id === commandId)
        if (menuItem) {
            menuManagement.handleViewMenu(menuData)
        }
    }

    // Handle expand all
    const handleExpandAll = () => {
        const parentIds = menuTree.getAllParentIds(treeData)
        menuManagement.expandAll(parentIds)
    }

    // Render form field
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
                                disabled={menuManagement.loading}
                                sx={{ ...actionButtonSx, ...actionButtonColors.primary }}
                                onClick={menuManagement.openAddModal}
                            >
                                {dictionary['common']?.add || 'Add'}
                            </Button>

                            <Button
                                variant="outlined"
                                color="inherit"
                                startIcon={<VisibilityIcon sx={{ color: '#1876d1' }} />}
                                disabled={menuManagement.loading || menuManagement.selected.length !== 1}
                                sx={{ ...actionButtonSx, ...actionButtonColors.info }}
                                onClick={() => menuManagement.handleViewMenu(menuData)}
                            >
                                {dictionary['common']?.view ?? 'View'}
                            </Button>

                            <Button
                                variant="outlined"
                                color="inherit"
                                startIcon={<EditIcon sx={{ color: '#f0a000' }} />}
                                disabled={menuManagement.loading || menuManagement.selected.length !== 1}
                                sx={{ ...actionButtonSx, ...actionButtonColors.warning }}
                                onClick={() => menuManagement.openEditModal(menuData)}
                            >
                                {dictionary['common']?.modify || 'Modify'}
                            </Button>

                            <Button
                                variant="outlined"
                                color="inherit"
                                startIcon={<DeleteIcon sx={{ color: '#d33' }} />}
                                disabled={menuManagement.loading || menuManagement.selected.length !== 1 || menuManagement.deleteLoading}
                                sx={{ ...actionButtonSx, ...actionButtonColors.error }}
                                onClick={menuManagement.openDeleteConfirm}
                            >
                                {menuManagement.deleteLoading ? (dictionary['common']?.deleting || 'Deleting...') : (dictionary['common']?.delete || 'Delete')}
                            </Button>
                        </Box>

                        {/* Right side: Search */}
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            startIcon={<SearchIcon />}
                            disabled={menuManagement.loading}
                        >
                            {dictionary['common']?.search || 'Search'}
                        </Button>
                    </Grid>
                </Grid>
            </form>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" gap={1}>
                    <ToggleButtonGroup
                        value={menuManagement.viewMode}
                        exclusive
                        onChange={(_, newMode) => {
                            if (newMode) {
                                menuManagement.setViewMode(newMode)
                                menuManagement.handlePageChange(null, 1)
                            }
                        }}
                        size="small"
                    >
                        <ToggleButton value="table">
                            <Tooltip title={dictionary['common']?.table_view || 'Table View'}>
                                <ViewListIcon />
                            </Tooltip>
                        </ToggleButton>
                        <ToggleButton value="tree">
                            <Tooltip title={dictionary['common']?.tree_view || 'Tree View'}>
                                <AccountTreeIcon />
                            </Tooltip>
                        </ToggleButton>
                    </ToggleButtonGroup>

                    {menuManagement.viewMode === 'tree' && (
                        <Box display="flex" gap={1}>
                            <Button size="small" variant="outlined" onClick={handleExpandAll}>
                                {dictionary['common']?.expand_all || 'Expand All'}
                            </Button>
                            <Button size="small" variant="outlined" onClick={menuManagement.collapseAll}>
                                {dictionary['common']?.collapse_all || 'Collapse All'}
                            </Button>
                        </Box>
                    )}
                </Box>
            </Box>

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
                                    onChange={handleToggleAll}
                                    slotProps={{
                                        input: {
                                            'aria-label': 'select all rows'
                                        }
                                    }}
                                    disabled
                                />
                            </TableCell>
                            {menuManagement.viewMode === 'tree' && <TableCell sx={{ width: 48 }}></TableCell>}
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
                        {menuManagement.loading ? (
                            [...Array(menuManagement.rowsPerPage)].map((_, index) => (
                                <TableRow key={`skeleton-row-${index}`}>
                                    <TableCell sx={{ width: 48, padding: '0 16px' }}>
                                        <Skeleton variant="rectangular" width={18} height={18} />
                                    </TableCell>
                                    {menuManagement.viewMode === 'tree' && (
                                        <TableCell sx={{ width: 48 }}>
                                            <Skeleton variant="rectangular" width={18} height={18} />
                                        </TableCell>
                                    )}
                                    {[...Array(7)].map((_, colIndex) => (
                                        <TableCell key={`skeleton-cell-${colIndex}`}>
                                            <Skeleton variant="text" width="100%" height={20} />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : displayData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={menuManagement.viewMode === 'tree' ? 9 : 8}>
                                    <EmptyListNotice message={dictionary['common']?.nodata || 'No data available'} />
                                </TableCell>
                            </TableRow>
                        ) : (
                            displayData.map((row, index) => (
                                <MenuTableRow
                                    key={`${row.command_id}-${index}`}
                                    row={row}
                                    index={index}
                                    locale={locale}
                                    viewMode={menuManagement.viewMode}
                                    selected={menuManagement.selected}
                                    hasSelection={menuManagement.hasSelection}
                                    selectedId={menuManagement.selectedId}
                                    expandedRows={menuManagement.expandedRows}
                                    hasChildren={menuTree.hasChildren(row.command_id)}
                                    onToggleSelect={menuManagement.toggleOne}
                                    onToggleExpand={menuManagement.toggleExpand}
                                    onRowDoubleClick={handleRowDblClick}
                                    getLocalizedCommandName={getLocalizedCommandName}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {menuManagement.totalCount > 0 && (
                <Box mt={5}>
                    <PaginationPage
                        page={menuManagement.page}
                        pageSize={menuManagement.rowsPerPage}
                        totalResults={menuManagement.totalCount}
                        jumpPage={menuManagement.jumpPage}
                        handlePageChange={menuManagement.handlePageChange}
                        handlePageSizeChange={menuManagement.handlePageSizeChange}
                        handleJumpPage={menuManagement.handleJumpPage}
                        dictionary={dictionary}
                    />
                </Box>
            )}

            {/* Add Menu Modal */}
            <MenuFormModal
                open={menuManagement.isAddModalOpen}
                onClose={menuManagement.closeAddModal}
                onSubmit={menuManagement.handleAddMenu}
                locale={locale}
                dictionary={dictionary}
                menuItems={menuData}
                applicationCodes={applicationCodes.filter(item => item.value !== 'ALL').map(item => item.value)}
                loading={menuManagement.modalLoading}
                error={menuManagement.modalError}
                isSuccess={menuManagement.modalSuccess}
                submittedData={menuManagement.modalSubmittedData}
                onClearError={menuManagement.clearModalError}
            />

            {/* View Menu Modal */}
            <MenuViewModal
                open={menuManagement.isViewModalOpen}
                onClose={menuManagement.closeViewModal}
                menuItem={menuManagement.selectedMenuItem}
                locale={locale}
                dictionary={dictionary}
            />

            {/* Edit Menu Modal */}
            <MenuEditModal
                open={menuManagement.isEditModalOpen}
                onClose={menuManagement.closeEditModal}
                onSubmit={menuManagement.handleEditMenu}
                locale={locale}
                dictionary={dictionary}
                menuItems={menuData}
                applicationCodes={applicationCodes.filter(item => item.value !== 'ALL').map(item => item.value)}
                editData={menuManagement.editMenuItem}
                loading={menuManagement.editLoading}
                error={menuManagement.editError}
                isSuccess={menuManagement.editSuccess}
                submittedData={menuManagement.editSubmittedData}
                onClearError={menuManagement.clearEditError}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={menuManagement.showDeleteConfirm}
                onClose={menuManagement.closeDeleteConfirm}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title">
                    {dictionary['common']?.confirm_delete || 'Confirm Delete'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-dialog-description">
                        {dictionary['common']?.confirm_delete_message || 'Are you sure you want to delete this menu item? This action cannot be undone.'}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={menuManagement.closeDeleteConfirm} color="inherit">
                        {dictionary['common']?.cancel || 'Cancel'}
                    </Button>
                    <Button onClick={() => menuManagement.handleDeleteMenu(menuData)} color="error" variant="contained" autoFocus>
                        {dictionary['common']?.delete || 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
