'use client'

import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import ApartmentIcon from '@mui/icons-material/Apartment'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import BadgeIcon from '@mui/icons-material/Badge'
import BlockIcon from '@mui/icons-material/Block'
import CakeIcon from '@mui/icons-material/Cake'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import EmailIcon from '@mui/icons-material/Email'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import FemaleIcon from '@mui/icons-material/Female'
import FingerprintIcon from '@mui/icons-material/Fingerprint'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import LoginIcon from '@mui/icons-material/Login'
import MaleIcon from '@mui/icons-material/Male'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import PersonIcon from '@mui/icons-material/Person'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import PolicyIcon from '@mui/icons-material/Policy'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import DynamicMuiIcon from '@components/DynamicMuiIcon'
import { useWorkingProjectIsSuperAdmin } from '@/@core/stores/useWorkingProjectStore'
import { useCodeListCaptionMap } from '@/shared/hooks/useCodeListCaptionMap'
import {
    Alert,
    Avatar,
    Box,
    Breadcrumbs,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    CircularProgress,
    Grid,
    Link as MuiLink,
    Paper,
    Skeleton,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    Tooltip,
    Typography
} from '@mui/material'
import NextLink from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { SyntheticEvent } from 'react'
import { useState } from 'react'

import { useStaffDetail } from '../hooks/useStaffDetail'
import { getDetailFullName, getStaffAvatarUrl, mapBoolChip } from '../services/staffService'
import type { StaffDictionary, StaffOperationRole, UserAccountDetail, UserCommandPermission, UserDetailResponse, UserProjectAssignmentItem, UserRoleDetail } from '../types'
import ProjectAssignmentDialog from './ProjectAssignmentDialog'
import { commonText, formatStaffDateTime, getBooleanLabel, getStaffGenderLabel, getStaffStatusColor, getStaffStatusLabel, staffText } from './staff-list/staffListHelpers'
import StaffChangePasswordDialog from './StaffChangePasswordDialog'
import StaffDeleteDialog from './StaffDeleteDialog'
import StaffModifyDialog from './StaffModifyDialog'
import { formatStaffBirthDate } from '../utils/staffDate'
import StaffStatusWatermark from './StaffStatusWatermark'
import UserPrivateRightsDialog from './UserPrivateRightsDialog'

type Props = {
    dictionary: StaffDictionary
    locale: string
    usercode: string
    detail: UserDetailResponse
    sessiontoken?: string
    error?: string | null
    route_base?: string
    text_namespace?: 'staffs' | 'residents_tenants'
    show_admin_actions?: boolean
}

type StaffDetailTabKey = 'account' | 'roles' | 'projects' | 'permission'

const DEPARTMENT_CODE_GROUP = 'IPS'
const DEPARTMENT_CODE_NAME = 'DEPARTMENT'

const valueText = (value: React.ReactNode) => {
    if (value === null || value === undefined || value === '') return '-'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (typeof value !== 'string' && typeof value !== 'number') return value

    return String(value)
}

type AccountInfoItemModel = {
    icon: React.ReactNode
    label: string
    value: React.ReactNode
}

const InfoItem = ({ icon, label, value }: AccountInfoItemModel) => (
    <Paper variant="outlined" sx={{ p: 2, height: '100%', borderRadius: 2, bgcolor: 'background.paper' }}>
        <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
                <Box sx={{ display: 'inline-flex', color: 'primary.main', '& svg': { fontSize: 18 } }}>
                    {icon}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                    {label}
                </Typography>
            </Stack>
            <Typography component="div" variant="body2" sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>
                {valueText(value)}
            </Typography>
        </Stack>
    </Paper>
)

const SectionCard = ({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) => (
    <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
        <CardContent sx={{ p: { xs: 3, md: 4 }, '&:last-child': { pb: { xs: 3, md: 4 } } }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} sx={{ mb: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    {title}
                </Typography>
                {action}
            </Stack>
            {children}
        </CardContent>
    </Card>
)

const GenderDisplay = ({ dictionary, gender }: { dictionary: StaffDictionary; gender?: number | null }) => {
    if (gender === 1) {
        return <Chip icon={<MaleIcon />} label={getStaffGenderLabel(dictionary, 1)} size="small" variant="outlined" />
    }

    if (gender === 2) {
        return <Chip icon={<FemaleIcon />} label={getStaffGenderLabel(dictionary, 2)} size="small" variant="outlined" />
    }

    return <Chip icon={<PersonIcon />} label={getStaffGenderLabel(dictionary, 0)} size="small" variant="outlined" />
}

const nullableBooleanText = (dictionary: StaffDictionary, value?: boolean | null) => (
    value === null || value === undefined ? '-' : getBooleanLabel(dictionary, value)
)

// uuid, branch_code and policy_id are leftover fields from the shared core-banking framework
// this console originated from — IPS has no branch or password-policy concept, so they're kept
// out of the UI (data is not deleted, just not rendered) to avoid confusing property-management admins.
const accountInfoItems = (
    dictionary: StaffDictionary,
    account: UserAccountDetail | null,
    audit_actor_names: { user_created: string; user_modified: string },
    department_caption: string | null
): AccountInfoItemModel[] => [
    { icon: <BadgeIcon />, label: staffText(dictionary, 'field_user_code', 'User code'), value: account?.user_code },
    { icon: <PersonIcon />, label: staffText(dictionary, 'field_user_id', 'User id'), value: account?.user_id },
    { icon: <AccountCircleIcon />, label: staffText(dictionary, 'field_login_name', 'Login name'), value: account?.login_name },
    { icon: <EmailIcon />, label: staffText(dictionary, 'field_email', 'Email'), value: account?.email },
    { icon: account?.gender === 1 ? <MaleIcon /> : account?.gender === 2 ? <FemaleIcon /> : <PersonIcon />, label: staffText(dictionary, 'field_gender', 'Gender'), value: <GenderDisplay dictionary={dictionary} gender={account?.gender} /> },
    { icon: <CakeIcon />, label: staffText(dictionary, 'field_birthday', 'Birthday'), value: formatStaffBirthDate(account?.birthday) },
    { icon: <LocationOnIcon />, label: staffText(dictionary, 'field_address', 'Address'), value: account?.address },
    { icon: <ApartmentIcon />, label: staffText(dictionary, 'field_department', 'Department'), value: department_caption },
    { icon: <PolicyIcon />, label: staffText(dictionary, 'field_description', 'Description'), value: account?.description },
    { icon: <ErrorOutlineIcon />, label: staffText(dictionary, 'field_failnumber', 'Fail number'), value: account?.failnumber },
    { icon: <LoginIcon />, label: staffText(dictionary, 'field_is_first_login', 'Password change required at sign-in'), value: nullableBooleanText(dictionary, account?.is_first_login) },
    { icon: <FingerprintIcon />, label: staffText(dictionary, 'field_biometric_supported', 'Biometric supported'), value: nullableBooleanText(dictionary, account?.is_biometric_supported) },
    { icon: <PersonAddIcon />, label: staffText(dictionary, 'field_user_created', 'User created'), value: audit_actor_names.user_created },
    { icon: <ManageAccountsIcon />, label: staffText(dictionary, 'field_user_modified', 'User modified'), value: audit_actor_names.user_modified }
]

const RolesTable = ({ dictionary, roles }: { dictionary: StaffDictionary; roles: UserRoleDetail[] }) => (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mt: 0.5 }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { py: 1.25, px: 2 } }}>
            <TableHead>
                <TableRow>
                    {[
                        staffText(dictionary, 'field_role_id', 'Role ID'),
                        staffText(dictionary, 'field_role_name', 'Role name'),
                        staffText(dictionary, 'field_role_description', 'Role description'),
                        staffText(dictionary, 'field_user_type', 'User type'),
                        staffText(dictionary, 'field_status', 'Status'),
                        staffText(dictionary, 'field_is_show', 'Is show'),
                        staffText(dictionary, 'field_sort_order', 'Sort order')
                    ].map(label => <TableCell key={label} sx={{ fontWeight: 900 }}>{label}</TableCell>)}
                </TableRow>
            </TableHead>
            <TableBody>
                {roles.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>{staffText(dictionary, 'empty_roles', 'No roles found.')}</TableCell></TableRow>
                ) : roles.map((role, index) => (
                    <TableRow key={`${role.role_id}-${index}`} hover>
                        <TableCell>{role.role_id ?? '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>{role.role_name || '-'}</TableCell>
                        <TableCell>{role.role_description || '-'}</TableCell>
                        <TableCell>{role.user_type || '-'}</TableCell>
                        <TableCell><Chip size="small" color={getStaffStatusColor(role.status || '')} label={getStaffStatusLabel(dictionary, role.status || '')} /></TableCell>
                        <TableCell>{role.is_show || '-'}</TableCell>
                        <TableCell>{role.sort_order ?? '-'}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </TableContainer>
)

const getProjectAssignmentStatusLabel = (dictionary: StaffDictionary, status: string) => {
    if (status === 'A') return staffText(dictionary, 'project_assignment_status_active', 'Active')
    if (status === 'I') return staffText(dictionary, 'project_assignment_status_inactive', 'Inactive')

    return null
}

const getProjectAssignmentStatusColor = (status: string): 'success' | 'default' => (status === 'A' ? 'success' : 'default')

const ProjectAssignmentStatusChip = ({ dictionary, status }: { dictionary: StaffDictionary; status: string }) => {
    const label = getProjectAssignmentStatusLabel(dictionary, status)

    if (!label) return <>-</>

    return <Chip size="small" color={getProjectAssignmentStatusColor(status)} label={label} />
}

const ProjectAssignmentsTable = ({
    dictionary,
    items,
    loading,
    error
}: {
    dictionary: StaffDictionary
    items: UserProjectAssignmentItem[]
    loading: boolean
    error: string | null
}) => {
    if (error) {
        return <Alert severity="error">{error}</Alert>
    }

    const column_count = 5

    return (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mt: 0.5 }}>
            <Table size="small" sx={{ '& .MuiTableCell-root': { py: 1.25, px: 2 } }}>
                <TableHead>
                    <TableRow>
                        {[
                            staffText(dictionary, 'field_project_code', 'Project code'),
                            staffText(dictionary, 'field_project_name', 'Project name'),
                            staffText(dictionary, 'field_project_address', 'Address'),
                            staffText(dictionary, 'field_assignment_status', 'Assignment status'),
                            staffText(dictionary, 'field_project_status', 'Project status')
                        ].map(label => <TableCell key={label} sx={{ fontWeight: 900 }}>{label}</TableCell>)}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {loading ? (
                        Array.from({ length: 3 }).map((_, index) => (
                            <TableRow key={index}>
                                {Array.from({ length: column_count }).map((__, cell_index) => (
                                    <TableCell key={cell_index}><Skeleton height={24} /></TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : items.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={column_count} align="center" sx={{ py: 4 }}>
                                {staffText(dictionary, 'empty_project_assignments', 'This user has not been assigned to any project.')}
                            </TableCell>
                        </TableRow>
                    ) : items.map((item, index) => (
                        <TableRow key={`${item.id || item.project_code}-${index}`} hover>
                            <TableCell sx={{ fontWeight: 800 }}>{item.project_code || '-'}</TableCell>
                            <TableCell>{item.project_name || '-'}</TableCell>
                            <TableCell sx={{ maxWidth: 240 }}>
                                {item.project_address ? (
                                    <Tooltip title={item.project_address}>
                                        <Typography
                                            variant="body2"
                                            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                        >
                                            {item.project_address}
                                        </Typography>
                                    </Tooltip>
                                ) : '-'}
                            </TableCell>
                            <TableCell><ProjectAssignmentStatusChip dictionary={dictionary} status={item.assignment_status || ''} /></TableCell>
                            <TableCell><ProjectAssignmentStatusChip dictionary={dictionary} status={item.project_status || ''} /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

const MenuTreeItem = ({
    command,
    level,
    selectedId,
    onSelect
}: {
    command: UserCommandPermission
    level: number
    selectedId?: string
    onSelect: (commandId: string) => void
}) => {
    const selected = selectedId === command.command_id
    // Backend localizes `label` by request `lang`; render it directly (no client-side locale resolve).
    const command_label = command.label || command.command_name || command.command_id

    return (
        <Box>
            <Box
                onClick={() => onSelect(command.command_id)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    mx: 1,
                    my: 0.375,
                    px: 1.75,
                    py: 1.25,
                    pl: 1.75 + level * 2,
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    color: selected ? '#0a9150' : '#225087',
                    bgcolor: selected ? 'rgba(10,145,80,0.08)' : 'transparent',
                    borderLeft: selected ? '4px solid #0a9150' : '4px solid transparent',
                    '&:hover': { bgcolor: 'action.hover' }
                }}
            >
                <Avatar sx={{ width: 28, height: 28, bgcolor: selected ? '#0a9150' : '#225087', color: 'common.white' }}>
                    <DynamicMuiIcon iconName={command.group_menu_icon} fontSize="small" />
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                    {/* command_id is kept in the model for selection/permission logic but is not shown in the UI. */}
                    <Typography variant="body2" sx={{ fontWeight: selected ? 900 : 700, overflowWrap: 'anywhere' }}>
                        {command_label}
                    </Typography>
                </Box>
            </Box>
            {(command.children ?? []).map(child => (
                <MenuTreeItem key={child.command_id} command={child} level={level + 1} selectedId={selectedId} onSelect={onSelect} />
            ))}
        </Box>
    )
}

const PermissionMatrix = ({
    dictionary,
    selectedMenu,
    roles,
    dynamicColumns,
    loading,
    error
}: {
    dictionary: StaffDictionary
    selectedMenu: UserCommandPermission | null
    roles: StaffOperationRole[]
    dynamicColumns: { cmdid: string; caption: string; label?: string }[]
    loading: boolean
    error: string | null
}) => (
    <Stack spacing={2.5}>
        <Box sx={{ backgroundColor: '#225087', color: 'white', px: 3, py: 2, borderRadius: 1 }}>
            {/* Only the localized menu label is shown; command_id stays in the model for logic/API. */}
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 900 }}>
                {staffText(dictionary, 'operation', 'Operation')} {selectedMenu?.label || selectedMenu?.command_name || ''}
            </Typography>
        </Box>
        {error ? (
            <Alert severity="error">{error}</Alert>
        ) : loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={28} />
            </Box>
        ) : roles.length === 0 ? (
            <Alert severity="info">{staffText(dictionary, 'no_operation_permissions', 'No operation permissions available for this menu.')}</Alert>
        ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 520 }}>
                <Table stickyHeader size="small" sx={{ '& .MuiTableCell-root': { py: 1.25, px: 2 } }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 900, color: 'white', background: '#225087', whiteSpace: 'nowrap' }}>
                                {staffText(dictionary, 'field_role_name', 'Role name')}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 900, color: 'white', background: '#225087', whiteSpace: 'nowrap' }}>
                                {staffText(dictionary, 'self_invoke', 'Self Invoke')}
                            </TableCell>
                            {dynamicColumns.map(col => (
                                <TableCell key={col.cmdid} align="center" sx={{ fontWeight: 900, color: 'white', background: '#225087', whiteSpace: 'nowrap' }}>
                                    {col.label || col.caption}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {roles.map(role => {
                            const self_invoke_checked = Object.values(role.commands).some(command => command.command_type === 'M' && mapBoolChip(command.invoke))

                            return (
                                <TableRow key={role.role_id} hover>
                                    <TableCell sx={{ fontWeight: 800 }}>{role.role_name}</TableCell>
                                    <TableCell align="center"><Checkbox checked={self_invoke_checked} disabled /></TableCell>
                                    {dynamicColumns.map(col => {
                                        const command = role.commands[col.cmdid]
                                        const applicable = command?.command_type === 'C'

                                        return (
                                            <TableCell key={col.cmdid} align="center">
                                                {applicable ? <Checkbox checked={mapBoolChip(command.invoke)} disabled /> : '-'}
                                            </TableCell>
                                        )
                                    })}
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        )}
    </Stack>
)

const PermissionAccess = ({ dictionary, detail, isSuperAdmin, on_add_special_rights }: { dictionary: StaffDictionary; detail: ReturnType<typeof useStaffDetail>; isSuperAdmin: boolean; on_add_special_rights: () => void }) => {
    return <Box sx={{ border: '1px solid #225087', borderRadius: 2, boxShadow: 1, overflow: 'hidden' }}>
        <Box sx={{ backgroundColor: '#225087', color: 'white', px: 3, py: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 900 }}>
                    {staffText(dictionary, 'permission_access', 'Permission Access')}
                </Typography>
                {isSuperAdmin && (
                    <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={on_add_special_rights}
                        sx={{
                            color: 'primary.contrastText',
                            '& .MuiButton-startIcon': { color: 'inherit' },
                            '&:hover': { bgcolor: 'primary.dark', color: 'primary.contrastText' },
                            '&:active': { bgcolor: 'primary.dark' },
                            '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'text.disabled' }
                        }}
                    >
                        {staffText(dictionary, 'private_rights_button', 'Add special rights')}
                    </Button>
                )}
            </Stack>
        </Box>
        <Box sx={{ p: { xs: 3, md: 3.5 } }}>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', height: '100%' }}>
                        <Box sx={{ backgroundColor: '#225087', px: 2.5, py: 1.5 }}>
                            <Typography sx={{ color: 'white', fontWeight: 900 }}>{staffText(dictionary, 'menu_category', 'Menu')}</Typography>
                        </Box>
                        <Box sx={{ maxHeight: 600, overflow: 'auto', py: 1 }}>
                            {detail.menu_tree.length === 0 ? (
                                <Alert severity="info" sx={{ m: 2 }}>{staffText(dictionary, 'empty_commands', 'No commands found.')}</Alert>
                            ) : detail.menu_tree.map(command => (
                                <MenuTreeItem
                                    key={command.command_id}
                                    command={command}
                                    level={0}
                                    selectedId={detail.selected_menu?.command_id}
                                    onSelect={detail.setSelectedMenuId}
                                />
                            ))}
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                    <PermissionMatrix
                        dictionary={dictionary}
                        selectedMenu={detail.selected_menu}
                        roles={detail.operation_roles}
                        dynamicColumns={detail.dynamic_operation_columns}
                        loading={detail.operation_loading}
                        error={detail.operation_error}
                    />
                </Grid>
            </Grid>
        </Box>
    </Box>
}

const StaffDetailContent = ({
    dictionary,
    locale,
    usercode,
    detail,
    sessiontoken,
    error,
    route_base = '/users/staffs',
    text_namespace = 'staffs',
    show_admin_actions = true
}: Props) => {
    const staff_detail = useStaffDetail(detail, { dictionary, sessiontoken, language: locale, route_usercode: usercode })
    const { captionMap: department_caption_map } = useCodeListCaptionMap({
        code_group: DEPARTMENT_CODE_GROUP,
        code_name: DEPARTMENT_CODE_NAME,
        language: locale
    })
    // See StaffListContent for why MODIFY here is isSuperAdmin-gated instead of the retired
    // top-menu usercommand permission.
    const isSuperAdmin = useWorkingProjectIsSuperAdmin()
    const search_params = useSearchParams()
    const list_query = search_params.toString()
    // Preserves the list's search/page/filter query string (forwarded here from StaffListContent)
    // so "Back to staff list" returns to where the user came from instead of resetting to page 1.
    const list_href = `/${locale}${route_base}${list_query ? `?${list_query}` : ''}`
    const account = staff_detail.account
    const department_code = account?.department_code?.trim() ?? ''
    const department_caption = department_code
        ? department_caption_map.get(department_code.toUpperCase()) ?? department_code
        : null
    const subtitle = account?.user_code || account?.user_id || account?.login_name || ''
    const avatar_url = getStaffAvatarUrl(staff_detail)
    // A deleted account is read-only: every action below that would mutate it (status toggle,
    // password, modify, admin assignment, delete, project assignment, private rights) is hidden.
    const is_deleted = account?.status === 'D'
    const [active_tab, setActiveTab] = useState<StaffDetailTabKey>('account')
    const [assign_project_dialog_open, setAssignProjectDialogOpen] = useState(false)
    const [private_rights_dialog_open, setPrivateRightsDialogOpen] = useState(false)

    const handleTabChange = (_: SyntheticEvent, value: StaffDetailTabKey) => {
        setActiveTab(value)
        if (value === 'permission') staff_detail.openPermissionTab()
    }

    if (error || !account) {
        return (
            <Stack spacing={3} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                <Button component={NextLink} href={list_href} startIcon={<ArrowBackIcon />} sx={{ alignSelf: 'flex-start' }}>
                    {staffText(dictionary, 'back_to_list', 'Back to staff list', text_namespace)}
                </Button>
                <Alert severity="error">{error || staffText(dictionary, 'detail_empty', 'User detail not found.', text_namespace)}</Alert>
            </Stack>
        )
    }

    return (
        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
            <StaffStatusWatermark dictionary={dictionary} status={account.status || ''} text_namespace={text_namespace} />
            <Stack spacing={4} sx={{ p: { xs: 2, sm: 3, md: 4 }, position: 'relative', zIndex: 1 }}>
            <Stack
                direction={{ xs: 'column', xl: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', xl: 'flex-start' }}
                gap={{ xs: 2, xl: 3 }}
            >
                <Box sx={{ minWidth: 0 }}>
                    <Breadcrumbs sx={{ mb: 1 }}>
                        <Typography color="text.secondary">{staffText(dictionary, 'breadcrumb_users', 'Users', text_namespace)}</Typography>
                        <MuiLink component={NextLink} href={list_href} underline="hover">{staffText(dictionary, 'breadcrumb_staffs', 'Staffs', text_namespace)}</MuiLink>
                        <Typography color="text.primary">{staffText(dictionary, 'breadcrumb_user_detail', 'User Detail', text_namespace)}</Typography>
                    </Breadcrumbs>
                    <Typography variant="h4" sx={{ fontWeight: 900 }}>{staff_detail.full_name}</Typography>
                    <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
                </Box>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        flexWrap: { sm: 'wrap' },
                        gap: 1,
                        alignSelf: { xs: 'stretch', xl: 'flex-start' },
                        justifyContent: { sm: 'flex-start', xl: 'flex-end' },
                        width: { xs: '100%', xl: 'auto' },
                        '& .MuiButton-root': {
                            flexShrink: 0,
                            whiteSpace: 'nowrap'
                        }
                    }}
                >
                    {show_admin_actions && isSuperAdmin && !is_deleted && (
                        <Button
                            startIcon={account.status === 'A' ? <BlockIcon /> : <CheckCircleOutlineIcon />}
                            color={account.status === 'A' ? 'warning' : 'success'}
                            variant="outlined"
                            disabled={staff_detail.toggling_status}
                            onClick={staff_detail.toggleStatus}
                        >
                            {staff_detail.toggling_status
                                ? commonText(dictionary, 'processing', 'Processing...')
                                : account.status === 'A'
                                    ? staffText(dictionary, 'deactivate_user', 'Deactivate', text_namespace)
                                    : staffText(dictionary, 'activate_user', 'Activate', text_namespace)}
                        </Button>
                    )}
                    {show_admin_actions && !is_deleted && (
                        <Button startIcon={<VpnKeyIcon />} variant="outlined" onClick={staff_detail.openChangePasswordDialog}>
                            {staffText(dictionary, 'change_password', 'Change Password', text_namespace)}
                        </Button>
                    )}
                    {show_admin_actions && isSuperAdmin && !is_deleted && (
                        <Button startIcon={<EditIcon />} variant="contained" onClick={staff_detail.openModifyDialog}>
                            {dictionary.common?.modify ?? staffText(dictionary, 'modify', 'Modify', text_namespace)}
                        </Button>
                    )}
                    {show_admin_actions && !account.is_super_admin && !is_deleted && (
                        <Button
                            startIcon={<AdminPanelSettingsIcon />}
                            variant="outlined"
                            disabled={staff_detail.assigning_admin}
                            onClick={staff_detail.assignAdmin}
                        >
                            {staff_detail.assigning_admin
                                ? commonText(dictionary, 'processing', 'Processing...')
                                : staffText(dictionary, 'assign_admin', 'Assign to Admin', text_namespace)}
                        </Button>
                    )}
                    {show_admin_actions && isSuperAdmin && !is_deleted && (
                        <Button
                            color="error"
                            variant="outlined"
                            startIcon={<DeleteOutlineIcon />}
                            onClick={staff_detail.openDeleteDialog}
                            disabled={staff_detail.deleting}
                        >
                            {staffText(dictionary, 'delete_user', 'Delete User', text_namespace)}
                        </Button>
                    )}
                    <Button component={NextLink} href={list_href} startIcon={<ArrowBackIcon />} variant="outlined">
                        {staffText(dictionary, 'back_to_list', 'Back to staff list', text_namespace)}
                    </Button>
                </Box>
            </Stack>

            <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                <CardContent sx={{ p: { xs: 3, md: 4 }, '&:last-child': { pb: { xs: 3, md: 4 } } }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', md: 'center' }}>
                        <Avatar src={avatar_url || undefined} sx={{ width: 88, height: 88, bgcolor: 'primary.main', color: 'common.white', fontSize: 34, fontWeight: 900 }}>
                            {getDetailFullName(account).slice(0, 1) || account.user_name?.slice(0, 1) || account.login_name?.slice(0, 1) || <PersonIcon />}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h5" sx={{ fontWeight: 900 }}>{getDetailFullName(account) || account.login_name}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{account.login_name || account.user_name}</Typography>
                            <Stack direction="row" flexWrap="wrap" gap={1}>
                                <Chip size="small" label={account.email || '-'} />
                                <Chip size="small" label={account.phone || '-'} />
                                <GenderDisplay dictionary={dictionary} gender={account.gender} />
                                <Chip size="small" color={getStaffStatusColor(account.status || '')} label={getStaffStatusLabel(dictionary, account.status || '')} />
                                <Chip size="small" color={account.is_login ? 'success' : 'default'} label={account.is_login ? staffText(dictionary, 'logged_in', 'Logged in') : staffText(dictionary, 'not_logged_in', 'Not logged in')} />
                                <Chip size="small" color={account.is_super_admin ? 'info' : 'default'} label={account.is_super_admin ? staffText(dictionary, 'super_admin', 'Super Admin') : staffText(dictionary, 'normal_user', 'Normal user')} />
                            </Stack>
                        </Box>
                        <Stack spacing={0.5}>
                            <Typography variant="caption" color="text.secondary">{staffText(dictionary, 'field_last_login_time', 'Last login time')}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>{formatStaffDateTime(account.last_login_time)}</Typography>
                            <Typography variant="caption" color="text.secondary">{staffText(dictionary, 'field_created_on_utc', 'Created on UTC')}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>{formatStaffDateTime(account.created_on_utc)}</Typography>
                            <Typography variant="caption" color="text.secondary">{staffText(dictionary, 'field_updated_on_utc', 'Updated on UTC')}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>{formatStaffDateTime(account.updated_on_utc)}</Typography>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>

            <Box
                sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    px: { xs: 1, sm: 2 },
                    background: theme => `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 55%, ${theme.palette.primary.dark} 100%)`
                }}
            >
                <Tabs
                    value={active_tab}
                    onChange={handleTabChange}
                    aria-label={staffText(dictionary, 'tabs_label', 'User detail tabs')}
                    variant="scrollable"
                    scrollButtons="auto"
                    textColor="inherit"
                    sx={{
                        minHeight: 48,
                        '& .MuiTabs-flexContainer': {
                            gap: { xs: 2, sm: 4 }
                        },
                        '& .MuiTabs-indicator': {
                            backgroundColor: 'common.white',
                            height: 3,
                            borderRadius: 1.5
                        },
                        '& .MuiTab-root': {
                            color: 'rgba(255,255,255,0.65)',
                            fontWeight: 600,
                            textTransform: 'none',
                            minHeight: 48,
                            p: 0
                        },
                        '& .MuiTab-root.Mui-selected': {
                            color: 'common.white',
                            fontWeight: 800
                        }
                    }}
                >
                    <Tab value="account" label={staffText(dictionary, 'tab_account_information', 'Account information')} />
                    <Tab value="roles" label={`${staffText(dictionary, 'tab_roles', 'Roles')} (${staff_detail.overview.total_roles})`} />
                    <Tab
                        value="projects"
                        label={
                            staff_detail.project_assignments_loading
                                ? staffText(dictionary, 'tab_projects', 'Projects')
                                : `${staffText(dictionary, 'tab_projects', 'Projects')} (${staff_detail.project_assignments.length})`
                        }
                    />
                    <Tab value="permission" label={staffText(dictionary, 'tab_permission', 'Permission Access')} />
                </Tabs>
            </Box>

            <Box role="tabpanel" hidden={active_tab !== 'account'}>
                {active_tab === 'account' && (
                    <SectionCard title={staffText(dictionary, 'account_information', 'Account information')}>
                        <Grid container spacing={2.5}>
                            {accountInfoItems(dictionary, account, staff_detail.audit_actor_names, department_caption).map(item => (
                                <Grid key={item.label} size={{ xs: 12, sm: 6, md: 3 }}>
                                    <InfoItem icon={item.icon} label={item.label} value={item.value} />
                                </Grid>
                            ))}
                        </Grid>
                    </SectionCard>
                )}
            </Box>

            <Box role="tabpanel" hidden={active_tab !== 'roles'}>
                {active_tab === 'roles' && (
                    <SectionCard title={staffText(dictionary, 'user_roles', 'User roles')}>
                        <RolesTable dictionary={dictionary} roles={detail.user_roles} />
                    </SectionCard>
                )}
            </Box>

            <Box role="tabpanel" hidden={active_tab !== 'projects'}>
                {active_tab === 'projects' && (
                    <SectionCard
                        title={staffText(dictionary, 'project_assignments_title', 'Assigned projects')}
                        action={
                            !is_deleted && (
                                <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<AssignmentIndIcon />}
                                    onClick={() => setAssignProjectDialogOpen(true)}
                                >
                                    {staffText(dictionary, 'assign_project_button', 'Project assignment')}
                                </Button>
                            )
                        }
                    >
                        <ProjectAssignmentsTable
                            dictionary={dictionary}
                            items={staff_detail.project_assignments}
                            loading={staff_detail.project_assignments_loading}
                            error={staff_detail.project_assignments_error}
                        />
                    </SectionCard>
                )}
            </Box>

            <Box role="tabpanel" hidden={active_tab !== 'permission'}>
                {active_tab === 'permission' && <PermissionAccess dictionary={dictionary} detail={staff_detail} isSuperAdmin={isSuperAdmin && !is_deleted} on_add_special_rights={() => setPrivateRightsDialogOpen(true)} />}
            </Box>

            <StaffModifyDialog
                dictionary={dictionary}
                locale={locale}
                open={staff_detail.modify_open}
                form_values={staff_detail.modify_form}
                form_errors={staff_detail.modify_errors}
                modal_error={staff_detail.modify_modal_error}
                current_avatar_url={avatar_url}
                selected_avatar_file={staff_detail.modify_avatar_file}
                avatar_preview_url={staff_detail.modify_avatar_preview_url}
                avatar_error={staff_detail.modify_avatar_error}
                saving_label={staff_detail.modify_saving_label}
                saving={staff_detail.saving_modify}
                on_close={staff_detail.cancelModifyDialog}
                on_save={staff_detail.saveModify}
                on_update_form={staff_detail.updateModifyForm}
                on_update_avatar_file={staff_detail.updateModifyAvatarFile}
            />

            <StaffChangePasswordDialog
                dictionary={dictionary}
                open={staff_detail.change_password_open}
                loading={staff_detail.changing_password}
                error={staff_detail.change_password_error}
                on_close={staff_detail.closeChangePasswordDialog}
                on_confirm={password => void staff_detail.confirmChangePassword(password)}
            />

            <StaffDeleteDialog
                dictionary={dictionary}
                open={staff_detail.delete_open}
                loading={staff_detail.deleting}
                error={staff_detail.delete_error}
                target_name={staff_detail.full_name}
                target_code={account.user_code || account.user_id || usercode}
                on_close={staff_detail.closeDeleteDialog}
                on_confirm={() => void staff_detail.confirmDeleteStaff()}
            />

            <ProjectAssignmentDialog
                dictionary={dictionary}
                open={assign_project_dialog_open}
                user_code={account.user_code || account.user_id || usercode}
                already_assigned={staff_detail.project_assignments.map(item => ({ project_code: item.project_code, project_name: item.project_name }))}
                sessiontoken={sessiontoken}
                language={locale}
                on_close={() => setAssignProjectDialogOpen(false)}
                on_assigned={staff_detail.reloadProjectAssignments}
            />

            <UserPrivateRightsDialog
                dictionary={dictionary}
                locale={locale}
                open={private_rights_dialog_open}
                staff_name={staff_detail.full_name}
                target_user_code={account.user_code || account.user_id || usercode}
                existing_rights={staff_detail.commands}
                sessiontoken={sessiontoken}
                is_super_admin={isSuperAdmin}
                on_close={() => setPrivateRightsDialogOpen(false)}
                on_saved={async () => {
                    await staff_detail.reloadDetail()
                    setPrivateRightsDialogOpen(false)
                }}
            />
            </Stack>
        </Box>
    )
}

export default StaffDetailContent
