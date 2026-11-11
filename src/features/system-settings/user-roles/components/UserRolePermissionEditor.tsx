'use client'

import AccountTreeIcon from '@mui/icons-material/AccountTree'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import FolderIcon from '@mui/icons-material/Folder'
import { Accordion, AccordionDetails, AccordionSummary, Box, Checkbox, CircularProgress, Grid, List, ListItem, ListItemIcon, ListItemText, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import Image from 'next/image'

import type { MenuItem, OperationBody } from '@shared/types/systemTypes'

import type { UseUserRolePermissionsReturn } from '../hooks/useUserRolePermissions'
import type { UserRolesDictionary } from '../types'
import { commonText, userRoleText } from './userRoleHelpers'

type Props = {
  dictionary: UserRolesDictionary
  permissions: UseUserRolePermissionsReturn
  disabled: boolean
}

// Backend localize field `label` theo request `lang` (xem fetchRoleMenuTree) -> render thang `label`.
const UserRolePermissionEditor = ({ dictionary, permissions, disabled }: Props) => {
  const operationTitle = permissions.selectedMenu
    ? `${commonText(dictionary, 'operation', 'Operation')} ${permissions.selectedMenu.label || permissions.selectedMenu.command_name || permissions.selectedMenu.command_id}`
    : commonText(dictionary, 'operation', 'Operation')
  const rowsByCommand = new Map(permissions.roleOperations.map(row => [row.command_id, row]))

  const renderMenu = (menu: MenuItem) => (
    <ListItem key={menu.command_id} sx={{ cursor: 'pointer', color: permissions.selectedMenu?.command_id === menu.command_id ? '#0a9150' : 'inherit' }} onClick={() => void permissions.handleMenuClick(menu)}>
      <ListItemIcon><FolderIcon color={permissions.selectedMenu?.command_id === menu.command_id ? 'primary' : 'warning'} /></ListItemIcon>
      <ListItemText primary={menu.label || menu.command_name || menu.command_id} slotProps={{ primary: { style: { color: '#225087', fontWeight: permissions.selectedMenu?.command_id === menu.command_id ? 700 : 400 } } }} />
    </ListItem>
  )

  const renderCheckbox = (row: OperationBody) => {
    const value = permissions.findDraft(row).invoke
    return <Checkbox checked={value} disabled={disabled || permissions.saving} onChange={event => permissions.updatePermission(row, event.target.checked)} />
  }

  return (
    <Grid container size={12} spacing={2} marginTop={2} sx={{ flexGrow: 1 }}>
      <Grid size={3}><Box sx={{ border: '1px solid #225087', borderRadius: 2, mb: 5, boxShadow: 1, overflow: 'hidden' }}>
        <Box sx={{ backgroundColor: '#225087', color: 'white', px: 3, py: 1.5 }}><Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>{commonText(dictionary, 'menu', 'Menu')}</Typography></Box>
        {permissions.menuLoading ? <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress size={28} /></Stack> : permissions.menuParent.map(parent => parent.children?.length ? (
          <Accordion key={parent.command_id} expanded={permissions.expandedMenu === parent.command_id} onChange={() => permissions.toggleMenu(parent.command_id)} sx={{ bgcolor: 'white' }}>
            <AccordionSummary sx={{ pl: 5, color: '#225087' }} expandIcon={<ExpandMoreIcon />}><ListItemIcon><AccountTreeIcon sx={{ color: '#225087' }} /></ListItemIcon><Typography fontWeight="bold" sx={{ color: '#225087', mx: 2 }}>{parent.label || parent.command_name || parent.command_id}</Typography></AccordionSummary>
            <AccordionDetails sx={{ pl: 5, color: '#225087' }}><List>{parent.children.map(renderMenu)}</List></AccordionDetails>
          </Accordion>
        ) : <List key={parent.command_id} sx={{ pl: 0 }}>{renderMenu(parent)}</List>)}</Box></Grid>
      <Grid size={9}><Box sx={{ border: '1px solid #225087', borderRadius: 2, mb: 5, boxShadow: 1, overflow: 'hidden' }}>
        <Box sx={{ backgroundColor: '#225087', color: 'white', px: 3, py: 1.5 }}><Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>{operationTitle}</Typography></Box>
        <Box sx={{ p: 3 }}>{!permissions.selectedMenu ? <Box sx={{ textAlign: 'center' }}><Image src="/images/illustrations/empty-list.svg" width={160} height={160} alt="" priority /><Typography color="text.secondary">{commonText(dictionary, 'menu', 'Menu')}</Typography></Box> : permissions.operationLoading ? <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress size={28} /></Stack> : (
          <TableContainer component={Paper} sx={{ maxHeight: 600, border: '1px solid #ddd' }}><Table stickyHeader><TableHead><TableRow><TableCell sx={{ fontWeight: 'bold', color: 'white', background: '#225087' }}>{userRoleText(dictionary, 'permission_action_column', 'Function')}</TableCell><TableCell sx={{ fontWeight: 'bold', color: 'white', textAlign: 'center', background: '#225087' }}><Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}><Checkbox checked={permissions.allCurrentPermissionsSelected} indeterminate={!permissions.allCurrentPermissionsSelected && permissions.someCurrentPermissionsSelected} disabled={disabled || permissions.saving || permissions.dynamicColumns.length === 0} onChange={event => permissions.setAllCurrentPermissions(event.target.checked)} inputProps={{ 'aria-label': userRoleText(dictionary, 'permission_select_all', 'Select all') }} sx={{ color: 'white', '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: 'white' } }} />{userRoleText(dictionary, 'permission_select_all', 'Select all')}</Stack></TableCell></TableRow></TableHead><TableBody>{permissions.dynamicColumns.map((column, index) => {
            const row = rowsByCommand.get(column.cmdid)
            return <TableRow key={column.cmdid} sx={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#fff' }}><TableCell sx={{ color: '#225087' }}>{column.label || column.caption}</TableCell><TableCell align="center">{row ? renderCheckbox(row) : '-'}</TableCell></TableRow>
          })}{permissions.dynamicColumns.length === 0 && <TableRow><TableCell colSpan={2} align="center">{commonText(dictionary, 'nooperation', 'No operation configured')}</TableCell></TableRow>}</TableBody></Table></TableContainer>
        )}</Box>
      </Box></Grid>
    </Grid>
  )
}

export default UserRolePermissionEditor
