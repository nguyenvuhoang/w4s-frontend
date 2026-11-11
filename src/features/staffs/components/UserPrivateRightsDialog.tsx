'use client'

import { useEffect } from 'react'

import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import SecurityIcon from '@mui/icons-material/Security'
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material'

import type { MenuItem } from '@shared/types/systemTypes'

import { useUserPrivateRightsDialog } from '../hooks/useUserPrivateRightsDialog'
import type { StaffDictionary, UserCommandPermission } from '../types'
import { commonText, staffText } from './staff-list/staffListHelpers'

type Props = {
    dictionary: StaffDictionary
    locale: string
    open: boolean
    staff_name: string
    target_user_code: string
    existing_rights: UserCommandPermission[]
    sessiontoken?: string
    is_super_admin: boolean
    on_close: () => void
    on_saved: () => Promise<void>
}

const MenuTreeNode = ({
    node,
    level,
    selectedId,
    onSelect
}: {
    node: MenuItem
    level: number
    selectedId?: string
    onSelect: (menu: MenuItem) => void
}) => {
    // Backend localizes `label` by request `lang`; render it directly.
    const label = node.label || node.command_name || node.command_id
    const selected = selectedId === node.command_id

    return (
        <Box>
            <Box
                onClick={() => onSelect(node)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mx: 1,
                    my: 0.375,
                    px: 1.5,
                    py: 1,
                    pl: 1.5 + level * 2,
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    color: selected ? '#0a9150' : '#225087',
                    bgcolor: selected ? 'rgba(10,145,80,0.08)' : 'transparent',
                    borderLeft: selected ? '4px solid #0a9150' : '4px solid transparent',
                    '&:hover': { bgcolor: 'action.hover' }
                }}
            >
                <Typography variant="body2" sx={{ fontWeight: selected ? 900 : 700, overflowWrap: 'anywhere' }}>
                    {label}
                </Typography>
            </Box>
            {(node.children ?? []).map(child => (
                <MenuTreeNode key={child.command_id} node={child} level={level + 1} selectedId={selectedId} onSelect={onSelect} />
            ))}
        </Box>
    )
}

const UserPrivateRightsDialog = ({ dictionary, locale, open, staff_name, target_user_code, existing_rights, sessiontoken, is_super_admin, on_close, on_saved }: Props) => {
    const form = useUserPrivateRightsDialog({ dictionary, sessiontoken, language: locale, target_user_code, existing_rights, is_super_admin, open, on_saved })

    useEffect(() => {
        if (!open) form.resetState()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    const handleSubmit = async () => {
        const success = await form.submit()

        if (success) on_close()
    }

    return (
        <Dialog
            open={open}
            fullWidth
            maxWidth="lg"
            disableEscapeKeyDown
            onClose={(_, reason) => {
                if (form.submitting || reason === 'backdropClick' || reason === 'escapeKeyDown') return

                on_close()
            }}
            slotProps={{ paper: { sx: { borderRadius: 2 } } }}
        >
            <DialogTitle sx={{ pr: 7 }}>
                <Stack direction="row" alignItems="center" spacing={1.25}>
                    <SecurityIcon color="primary" />
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 900 }}>
                            {staffText(dictionary, 'private_rights_dialog_title', 'Add special rights')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                            {staff_name} ({target_user_code || '-'})
                        </Typography>
                    </Box>
                </Stack>
                <IconButton
                    aria-label={commonText(dictionary, 'close', 'Close')}
                    onClick={on_close}
                    disabled={form.submitting}
                    sx={{ position: 'absolute', right: 16, top: 16 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2.5} sx={{ py: 1 }}>
                    <Alert severity="info">
                        {staffText(
                            dictionary,
                            'private_rights_scope_note',
                            'This is a permission grant specific to this user. It does not modify the Role and does not affect other users sharing the same Role.'
                        )}
                    </Alert>

                    {form.submit_error && <Alert severity="error">{form.submit_error}</Alert>}

                    <Stack spacing={2}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder={staffText(dictionary, 'private_rights_menu_search_placeholder', 'Search menu')}
                                value={form.menu_search}
                                onChange={event => form.setMenuSearch(event.target.value)}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon fontSize="small" />
                                            </InputAdornment>
                                        )
                                    }
                                }}
                            />
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 2 }}>
                                <Box sx={{ border: '1px solid #225087', borderRadius: 2, overflow: 'hidden' }}>
                                    <Box sx={{ backgroundColor: '#225087', color: 'white', px: 2, py: 1 }}>
                                        <Typography sx={{ color: 'white', fontWeight: 900 }}>
                                            {staffText(dictionary, 'menu_category', 'Menu')}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ maxHeight: 420, overflow: 'auto', py: 1 }}>
                                        {form.menu_loading ? (
                                            <Stack alignItems="center" sx={{ py: 4 }}>
                                                <CircularProgress size={24} />
                                            </Stack>
                                        ) : form.menu_error ? (
                                            <Stack spacing={1.5} sx={{ p: 2 }}>
                                                <Alert severity="error">{form.menu_error}</Alert>
                                                <Button size="small" variant="outlined" onClick={() => void form.loadMenus()}>
                                                    {staffText(dictionary, 'private_rights_retry', 'Retry')}
                                                </Button>
                                            </Stack>
                                        ) : form.filtered_menu_parent.length === 0 ? (
                                            <Alert severity="info" sx={{ m: 2 }}>{staffText(dictionary, 'empty_commands', 'No commands found.')}</Alert>
                                        ) : form.filtered_menu_parent.map(node => (
                                            <MenuTreeNode
                                                key={node.command_id}
                                                node={node}
                                                level={0}
                                                selectedId={form.selected_menu?.command_id}
                                                onSelect={menu => void form.selectMenu(menu)}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                                <Box sx={{ border: '1px solid #225087', borderRadius: 2, overflow: 'hidden' }}>
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        flexWrap="wrap"
                                        gap={1}
                                        sx={{ backgroundColor: '#225087', color: 'white', px: 2, py: 1 }}
                                    >
                                        <Typography sx={{ color: 'white', fontWeight: 900 }}>
                                            {form.selected_menu
                                                ? (form.selected_menu.label || form.selected_menu.command_name || staffText(dictionary, 'operation', 'Operation'))
                                                : staffText(dictionary, 'operation', 'Operation')}
                                        </Typography>
                                    </Stack>
                                    <Box sx={{ p: 2 }}>
                                        {!form.selected_menu ? (
                                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                                {staffText(dictionary, 'private_rights_select_menu_hint', 'Select a menu on the left to configure rights.')}
                                            </Typography>
                                        ) : form.operation_loading ? (
                                            <Stack alignItems="center" sx={{ py: 4 }}>
                                                <CircularProgress size={24} />
                                            </Stack>
                                        ) : (
                                            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 380 }}>
                                                <Table stickyHeader size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ fontWeight: 900 }}>{staffText(dictionary, 'permission_name', 'Permission / Operation name')}</TableCell>
                                                            <TableCell align="center" sx={{ fontWeight: 900 }}>
                                                                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                                                                    <span>{staffText(dictionary, 'private_rights_allow', 'Allow')}</span>
                                                                    <Tooltip title={staffText(dictionary, 'private_rights_tick_all', 'Tick all')}>
                                                                        <span>
                                                                            <Checkbox
                                                                                size="small"
                                                                                checked={form.select_all_invoke_state.checked}
                                                                                indeterminate={form.select_all_invoke_state.indeterminate}
                                                                                disabled={form.select_all_invoke_state.eligible_count === 0}
                                                                                onChange={event => form.toggleSelectAllInvoke(event.target.checked)}
                                                                                sx={{ color: 'inherit', '&.Mui-checked': { color: 'inherit' }, '&.MuiCheckbox-indeterminate': { color: 'inherit' } }}
                                                                            />
                                                                        </span>
                                                                    </Tooltip>
                                                                </Stack>
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell sx={{ fontStyle: 'italic' }}>{staffText(dictionary, 'self_invoke', 'Self Invoke')}</TableCell>
                                                            <TableCell align="center">
                                                                <Tooltip title={form.current_menu_meta?.self_invoke && form.hasExistingRight(form.current_menu_meta.self_invoke.command_id, form.current_menu_meta.self_invoke.command_id_detail, 'invoke') ? staffText(dictionary, 'private_rights_existing', 'Already granted') : ''}>
                                                                    <span><Checkbox checked={Boolean(form.current_menu_meta?.self_invoke && form.hasExistingRight(form.current_menu_meta.self_invoke.command_id, form.current_menu_meta.self_invoke.command_id_detail, 'invoke')) || form.current_selection.self_invoke.invoke} disabled={Boolean(form.current_menu_meta?.self_invoke && form.hasExistingRight(form.current_menu_meta.self_invoke.command_id, form.current_menu_meta.self_invoke.command_id_detail, 'invoke'))} onChange={event => form.setSelfInvokeField('invoke', event.target.checked)} /></span>
                                                                </Tooltip>
                                                            </TableCell>
                                                        </TableRow>
                                                        {form.dynamic_columns.map(col => {
                                                            const row = form.current_selection.commands[col.cmdid] ?? { invoke: false, approve: false }
                                                            const command_meta = form.current_menu_meta?.commands[col.cmdid]
                                                            const already_has_invoke = Boolean(command_meta && form.hasExistingRight(command_meta.command_id, command_meta.command_id_detail, 'invoke'))

                                                            return (
                                                                <TableRow key={col.cmdid}>
                                                                    <TableCell>{col.label || col.caption}</TableCell>
                                                                    <TableCell align="center">
                                                                        <Tooltip title={already_has_invoke ? staffText(dictionary, 'private_rights_existing', 'Already granted') : ''}>
                                                                            <span><Checkbox checked={already_has_invoke || row.invoke} disabled={already_has_invoke} onChange={event => form.setCommandField(col.cmdid, 'invoke', event.target.checked)} /></span>
                                                                        </Tooltip>
                                                                    </TableCell>
                                                                </TableRow>
                                                            )
                                                        })}
                                                        {form.dynamic_columns.length === 0 && (
                                                            <TableRow>
                                                                <TableCell colSpan={2} align="center" sx={{ color: 'text.secondary' }}>
                                                                    {staffText(dictionary, 'no_operation_permissions', 'No operation permissions available for this menu.')}
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                    </Stack>

                    {form.total_selected_count > 0 && (
                        <Chip
                            color="primary"
                            variant="outlined"
                            sx={{ alignSelf: 'flex-start' }}
                            label={staffText(dictionary, 'private_rights_selected_summary', 'Selected {count} right(s).').replace('{count}', String(form.total_selected_count))}
                        />
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button disabled={form.submitting} onClick={on_close}>
                    {staffText(dictionary, 'private_rights_cancel', 'Cancel')}
                </Button>
                <Button variant="contained" disabled={form.submitting || form.total_selected_count === 0} onClick={handleSubmit}>
                    {form.submitting ? staffText(dictionary, 'private_rights_saving', 'Saving...') : staffText(dictionary, 'private_rights_save', 'Save private rights')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default UserPrivateRightsDialog
