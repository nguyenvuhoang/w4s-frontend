'use client'

import AccountTreeIcon from '@mui/icons-material/AccountTree'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import FolderIcon from '@mui/icons-material/Folder'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import Image from 'next/image'

import type { MenuItem } from '@shared/types/systemTypes'

import type { UseRoleCreatePermissionsReturn } from '../hooks/useRoleCreatePermissions'
import type { UserRolesDictionary } from '../types'
import { commonText, userRoleText } from './userRoleHelpers'

type Props = {
  dictionary: UserRolesDictionary
  permissions: UseRoleCreatePermissionsReturn
}

// Giao dien mo phong tab Invoke-Approve tai /roles-profile (cay menu ben trai + bang tac vu ben phai),
// nhung chi hien mot cot "Cho phep" cho DUY NHAT vai tro dang tao (chua co role_id) thay vi ma tran nhieu role.
// Backend localize field `label` theo request `lang` (xem fetchRoleMenuTree) -> render thang `label`.
const RoleInvokeApprovePanel = ({ dictionary, permissions }: Props) => {
  const {
    menuParent,
    menuLoading,
    expandedMenu,
    toggleMenu,
    selectedMenu,
    handleMenuClick,
    dynamicColumns,
    operationLoading,
    currentSelfInvoke,
    currentCommands,
    handleSelfInvokeChange,
    handleCommandChange,
    handleAllCurrentCommandsChange,
    allCurrentCommandsSelected,
    someCurrentCommandsSelected,
    selectedCount
  } = permissions

  // TAM THOI DEBUG - xoa sau khi xac dinh xong nguyen nhan menu rong.
  // eslint-disable-next-line no-console

  const operationTitle = selectedMenu
    ? `${commonText(dictionary, 'operation', 'Operation')} ${selectedMenu.label || selectedMenu.command_name || selectedMenu.command_id}`
    : commonText(dictionary, 'operation', 'Operation')

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {userRoleText(dictionary, 'permission_section_subtitle', 'Select the permissions that apply to the new role.')}
      </Typography>

      <Grid container size={12} spacing={2} sx={{ flexGrow: 1 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ border: '1px solid #225087', borderRadius: 2, boxShadow: 1, overflow: 'hidden' }}>
            <Box sx={{ backgroundColor: '#225087', color: 'white', px: 3, py: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
                {commonText(dictionary, 'menu', 'Menu')}
              </Typography>
            </Box>
            <Box>
              {menuLoading && menuParent.length === 0 ? (
                <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ py: 4 }}>
                  <CircularProgress size={28} sx={{ color: '#225087' }} />
                  <Typography variant="body2" color="text.secondary">
                    {commonText(dictionary, 'loading', 'Loading...')}
                  </Typography>
                </Stack>
              ) : menuParent?.map(parent => {
                const mainmenu = parent.children || []

                if (mainmenu.length > 0) {
                  const label = parent.label || parent.command_name || parent.command_id

                  return (
                    <Accordion
                      key={parent.command_id}
                      expanded={expandedMenu === parent.command_id}
                      onChange={() => toggleMenu(parent.command_id)}
                      sx={{ bgcolor: 'white' }}
                    >
                      <AccordionSummary sx={{ pl: 3, color: '#225087' }} expandIcon={<ExpandMoreIcon />}>
                        <ListItemIcon>
                          <AccountTreeIcon sx={{ color: '#225087' }} />
                        </ListItemIcon>
                        <Typography fontWeight="bold" sx={{ color: '#225087', mx: 2 }}>
                          {label}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pl: 3, color: '#225087' }}>
                        <List>
                          {mainmenu.map((child: MenuItem) => {
                            const childLabel = child.label || child.command_name || child.command_id

                            return (
                              <ListItem
                                key={child.command_id}
                                sx={{
                                  cursor: 'pointer',
                                  color: selectedMenu?.command_id === child.command_id ? '#0a9150' : 'inherit'
                                }}
                                onClick={() => void handleMenuClick(child)}
                              >
                                <ListItemIcon>
                                  <FolderIcon color={selectedMenu?.command_id === child.command_id ? 'primary' : 'warning'} />
                                </ListItemIcon>
                                <ListItemText
                                  primary={childLabel}
                                  slotProps={{
                                    primary: {
                                      style: {
                                        color: '#225087',
                                        fontWeight: selectedMenu?.command_id === child.command_id ? 700 : 400
                                      }
                                    }
                                  }}
                                />
                              </ListItem>
                            )
                          })}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  )
                }

                return (
                  <List key={parent.command_id} sx={{ pl: 0 }}>
                    <ListItem
                      sx={{
                        cursor: 'pointer',
                        color: selectedMenu?.command_id === parent.command_id ? '#0a9150' : 'inherit',
                        pl: 3
                      }}
                      onClick={() => void handleMenuClick(parent)}
                    >
                      <ListItemIcon>
                        <AccountTreeIcon color={selectedMenu?.command_id === parent.command_id ? 'primary' : 'action'} />
                      </ListItemIcon>
                      <ListItemText
                        primary={parent.label || parent.command_name || parent.command_id}
                        slotProps={{
                          primary: {
                            style: {
                              color: '#0a9150',
                              fontWeight: selectedMenu?.command_id === parent.command_id ? 700 : 400
                            }
                          }
                        }}
                      />
                    </ListItem>
                  </List>
                )
              })}
            </Box>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ border: '1px solid #225087', borderRadius: 2, boxShadow: 1, overflow: 'hidden' }}>
            <Box sx={{ backgroundColor: '#225087', color: 'white', px: 3, py: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
                {operationTitle}
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              {!selectedMenu ? (
                <Box display="flex" justifyContent="center" alignItems="center">
                  <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Image src="/images/illustrations/empty-list.svg" width={140} height={140} alt="" style={{ marginBottom: '16px' }} priority />
                    <Typography variant="body1" color="text.secondary">
                      {commonText(dictionary, 'menu', 'Menu')}
                    </Typography>
                  </Box>
                </Box>
              ) : operationLoading ? (
                <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ py: 4 }}>
                  <CircularProgress size={28} sx={{ color: '#225087' }} />
                  <Typography variant="body2" color="text.secondary">
                    {commonText(dictionary, 'loading', 'Loading...')}
                  </Typography>
                </Stack>
              ) : (
                <TableContainer component={Paper} sx={{ maxHeight: 480, border: '1px solid #ddd' }}>
                  <Table stickyHeader sx={{ borderCollapse: 'collapse' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white', borderRight: '1px solid #ddd', background: '#225087' }}>
                          {userRoleText(dictionary, 'permission_command_column', 'Function')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white', textAlign: 'center', background: '#225087', width: 140 }}>
                          <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                            <Checkbox
                              checked={allCurrentCommandsSelected}
                              indeterminate={!allCurrentCommandsSelected && someCurrentCommandsSelected}
                              onChange={event => handleAllCurrentCommandsChange(event.target.checked)}
                              disabled={dynamicColumns.length === 0}
                              inputProps={{ 'aria-label': userRoleText(dictionary, 'permission_select_all', 'Select all') }}
                              sx={{ color: 'white', '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: 'white' } }}
                            />
                            {userRoleText(dictionary, 'permission_select_all', 'Select all')}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow sx={{ backgroundColor: '#f9f9f9', '& td': { borderBottom: '1px solid #e0e0e0' } }}>
                        <TableCell sx={{ borderRight: '1px solid #ddd', fontStyle: 'italic', color: '#225087' }}>
                          {userRoleText(dictionary, 'permission_self_invoke', 'Menu access')}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Checkbox
                            checked={currentSelfInvoke}
                            onChange={event => handleSelfInvokeChange(event.target.checked)}
                          />
                        </TableCell>
                      </TableRow>
                      {dynamicColumns.map((col, index) => (
                        <TableRow
                          key={col.cmdid}
                          sx={{
                            backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9',
                            '&:hover': { backgroundColor: '#f1f1f1' },
                            '& td': { borderBottom: '1px solid #e0e0e0' }
                          }}
                        >
                          <TableCell sx={{ borderRight: '1px solid #ddd', color: '#225087' }}>{col.label || col.caption}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Checkbox
                              checked={currentCommands[col.cmdid] ?? false}
                              onChange={event => handleCommandChange(col.cmdid, event.target.checked)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      {dynamicColumns.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} sx={{ textAlign: 'center', color: 'text.secondary' }}>
                            {commonText(dictionary, 'nooperation', 'No operation configured')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>

      {selectedCount > 0 && (
        <Chip
          sx={{ mt: 2 }}
          color="primary"
          variant="outlined"
          label={userRoleText(dictionary, 'permission_selected_summary', 'Selected {count} permission(s).').replace('{count}', String(selectedCount))}
        />
      )}
    </Box>
  )
}

export default RoleInvokeApprovePanel
