'use client'

import type { SyntheticEvent } from 'react'
import { useState, useTransition } from 'react'

import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import AddHomeWorkOutlinedIcon from '@mui/icons-material/AddHomeWorkOutlined'
import ApartmentIcon from '@mui/icons-material/Apartment'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import HomeIcon from '@mui/icons-material/Home'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import LoginIcon from '@mui/icons-material/Login'
import LogoutIcon from '@mui/icons-material/Logout'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import PersonIcon from '@mui/icons-material/Person'
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined'
import SmartphoneIcon from '@mui/icons-material/Smartphone'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined'
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Avatar,
    Badge,
    Box,
    Breadcrumbs,
    Button,
    Chip,
    Divider,
    Grid,
    Menu,
    MenuItem,
    Paper,
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
import { alpha } from '@mui/material/styles'
import type { Session } from 'next-auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import type { Locale } from '@/configs/i18n'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { compactActionButtonSx } from '@/shared/components/forms/button-color/actionButtonSx'
import { useCodeListCaptionMap } from '@/shared/hooks/useCodeListCaptionMap'

import type { WorkflowErrorPresentation } from '@/shared/utils/workflowError'
import { useResidentDetailActions } from '../hooks/useResidentDetailActions'
import { useResidentRelatedMembersForm } from '../hooks/useResidentRelatedMembersForm'
import type {
    ResidentAccount,
    ResidentContext,
    ResidentContextMember,
    ResidentDetail,
    ResidentHouseholdContext,
    ResidentListStatus
} from '../types'
import { canUseResidentApartmentAction, RESIDENT_APARTMENT_PERMISSION_KEYS } from '../utils/residentPermissions'
import ResidentAccountTab from './resident-detail/ResidentAccountTab'
import ResidentAddApartmentDrawer from './resident-detail/ResidentAddApartmentDrawer'
import ResidentAddMemberDrawer from './resident-detail/ResidentAddMemberDrawer'
import ResidentDetailLoadState from './resident-detail/ResidentDetailLoadState'
import ResidentHistoryTab from './resident-detail/ResidentHistoryTab'
import ResidentRelatedMembersTab from './resident-detail/ResidentRelatedMembersTab'
import { getResidentDetailFallbackFields, getResidentDetailPageState } from './resident-detail/residentDetailErrorHelpers'
import ResidentConfirmDialog from './resident-list/ResidentConfirmDialog'
import {
    formatResidentDate,
    formatResidentDateTime,
    getMobileAccountLabel,
    getResidentGenderLabel,
    getResidentRelationShipLabel,
    getResidentStatusColor,
    getResidentStatusLabel,
    RESIDENT_RELATIONSHIP_CODE_GROUP,
    RESIDENT_RELATIONSHIP_CODE_NAME,
    residentText,
    type ResidentDictionary
} from './resident-list/residentListHelpers'

type DataResult<T> = {
    data: T | null
    error: WorkflowErrorPresentation | null
}

type Props = {
    dictionary: ResidentDictionary
    locale: Locale
    session?: Session | null
    residentId: number
    residentEntityId: number | null
    residentDetail: ResidentDetail | null
    detailError: WorkflowErrorPresentation | null
    contextResult: DataResult<ResidentContext>
    residentStatus?: string | null
    account?: ResidentAccount | null
    accountError?: string | null
}

type ResidentDetailTabKey = 'profile' | 'apartments' | 'related-members' | 'account' | 'history'

type ApartmentRelationView = {
    household: ResidentHouseholdContext
    currentRelation: ResidentContextMember | null
    owner: ResidentContextMember | null
    members: ResidentContextMember[]
}

const emptyText = (value?: string | number | null) => {
    if (value === null || value === undefined || value === '') return '--'

    return value
}

const getInitial = (name?: string | null) => {
    const value = (name ?? '').trim()

    return value ? value.charAt(0).toUpperCase() : <PersonIcon />
}

const getRoleColor = (role?: string | null): 'primary' | 'success' | 'warning' | 'info' | 'default' => {
    if (role === 'OWNER') return 'primary'
    if (role === 'TENANT') return 'success'
    if (role === 'MEMBER') return 'warning'
    if (role === 'REPRESENTATIVE') return 'info'
    if (role === 'FAMILYOWNER') return 'info'

    return 'default'
}

const getRoleLabel = (
    dictionary: ResidentDictionary,
    member?: ResidentContextMember | null
) => {
    if (!member) {
        return residentText(dictionary, 'detail_empty_no_data', '-')
    }

    const role = member.role?.trim().toUpperCase()

    if (role === 'OWNER') {
        return residentText(dictionary, 'role_owner', 'Chủ hộ')
    }

    if (role === 'TENANT') {
        return residentText(dictionary, 'role_tenant', 'Khách thuê')
    }

    if (role === 'FAMILYOWNER') {
        return residentText(dictionary, 'role_familyowner', 'Người thân chủ hộ')
    }

    if (role === 'OFFLINEOWNER') {
        return residentText(dictionary, 'role_offlineowner', 'Văn phòng')
    }

    if (role === 'MEMBER') {
        return residentText(dictionary, 'role_member', 'Thành viên')
    }

    if (role === 'REPRESENTATIVE') {
        return residentText(dictionary, 'role_representative', 'Người đại diện')
    }

    return (
        member.role_caption?.trim() ||
        member.role ||
        residentText(dictionary, 'detail_empty_no_data', '-')
    )
}
const getGenderDisplay = (dictionary: ResidentDictionary, gender?: string | null) => {
    if (!gender) return '--'
    if (gender === 'M' || gender === 'F' || gender === 'O') return getResidentGenderLabel(dictionary, gender)

    return gender
}

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{value}</Typography>
    </Stack>
)

const ContextErrorAlert = ({ dictionary, error }: { dictionary: ResidentDictionary; error: WorkflowErrorPresentation }) => (
    <Alert severity="error">
        {residentText(dictionary, 'detail_context_error', 'Không thể tải thông tin căn hộ liên quan.')}
        {error.executionId && <Box component="span" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>{residentText(dictionary, 'detail_load_error_reference', 'Mã tra cứu')}: {error.executionId}</Box>}
    </Alert>
)

const getFallbackFieldLabel = (dictionary: ResidentDictionary, key: string) => ({
    resident_code: residentText(dictionary, 'detail_profile_resident_code', 'Mã cư dân'),
    full_name: residentText(dictionary, 'detail_table_full_name', 'Họ tên'),
    phone: residentText(dictionary, 'detail_profile_phone', 'Số điện thoại'),
    email: residentText(dictionary, 'detail_profile_email', 'Email'),
    identity_number: residentText(dictionary, 'detail_profile_identity_number', 'CCCD/CMND'),
    date_of_birth: residentText(dictionary, 'detail_profile_date_of_birth', 'Ngày sinh'),
    gender: residentText(dictionary, 'detail_profile_gender', 'Giới tính'),
    user_code: residentText(dictionary, 'detail_profile_user_code', 'Mã user'),
    nationality: residentText(dictionary, 'detail_profile_nationality', 'Quốc tịch'),
    description: residentText(dictionary, 'detail_profile_description', 'Mô tả'),
    id: residentText(dictionary, 'detail_profile_id', 'ID')
}[key] ?? key)

const MemberAvatar = ({ member }: { member: Pick<ResidentContextMember, 'full_name' | 'avatar_url'> }) => (
    <Avatar src={member.avatar_url ?? undefined} sx={{ width: 42, height: 42, fontWeight: 800 }}>
        {!member.avatar_url && getInitial(member.full_name)}
    </Avatar>
)

const buildApartmentViews = (
    households: ResidentHouseholdContext[],
    currentResidentId: number
): ApartmentRelationView[] =>
    households.map(h => {
        const currentRelation =
            h.members.find(m => m.resident_id === currentResidentId)
            ?? (h.owner?.resident_id === currentResidentId ? h.owner : null)

        return {
            household: h,
            currentRelation,
            owner: h.owner,
            members: h.members
        }
    })

const RoleSummaryStrip = ({
    views,
    dictionary
}: {
    views: ApartmentRelationView[]
    dictionary: ResidentDictionary
}) => {
    const roleCounts: Record<string, number> = {}

    for (const v of views) {
        const role = v.currentRelation?.role

        if (role) roleCounts[role] = (roleCounts[role] ?? 0) + 1
    }

    const roleEntries = Object.entries(roleCounts)

    return (
        <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover', border: 1, borderColor: 'divider' }}>
            <Stack direction="row" gap={1.5} flexWrap="wrap" alignItems="center">
                <Chip
                    label={`${views.length} ${residentText(dictionary, 'detail_relations_total', 'căn hộ liên quan')}`}
                    color="primary"
                    variant="filled"
                    sx={{ fontWeight: 800 }}
                />
                {roleEntries.map(([role, count]) => (
                    <Chip
                        key={role}
                        label={`${count} ${getRoleLabel(dictionary, { role, role_caption: null } as ResidentContextMember)}`}
                        color={getRoleColor(role)}
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 700 }}
                    />
                ))}
            </Stack>
        </Paper>
    )
}

const OwnerMiniProfile = ({
    owner,
    isCurrentResident,
    dictionary
}: {
    owner: ResidentContextMember | null
    isCurrentResident: boolean
    dictionary: ResidentDictionary
}) => {
    if (!owner) {
        return (
            <Alert severity="info" sx={{ py: 0.5 }}>
                {residentText(dictionary, 'detail_household_no_owner', 'Chưa có thông tin chủ hộ.')}
            </Alert>
        )
    }

    return (
        <Paper
            sx={{
                p: 1.5,
                borderRadius: 2,
                border: 1,
                borderColor: isCurrentResident ? 'primary.main' : 'divider',
                bgcolor: isCurrentResident ? 'primary.50' : 'background.paper'
            }}
        >
            <Stack direction="row" gap={1.5} alignItems="center">
                <MemberAvatar member={owner} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                        <Typography sx={{ fontWeight: 800 }}>{emptyText(owner.full_name)}</Typography>
                        {isCurrentResident && (
                            <Chip
                                label={residentText(dictionary, 'detail_household_owner_is_current', 'Cư dân đang xem')}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ height: 20, fontSize: 11 }}
                            />
                        )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">{emptyText(owner.resident_code)}</Typography>
                    {owner.phone && <Typography variant="body2" color="text.secondary">{owner.phone}</Typography>}
                    {owner.email && <Typography variant="body2" color="text.secondary">{owner.email}</Typography>}
                </Box>
            </Stack>
        </Paper>
    )
}

const EffectivePeriodCell = ({
    member,
    dictionary
}: {
    member: ResidentContextMember
    dictionary: ResidentDictionary
}) => (
    <Stack spacing={0.5}>
        <Stack direction="row" gap={0.5} alignItems="center">
            <LoginIcon sx={{ fontSize: 16, color: 'success.main' }} />
            <Typography variant="caption">{formatResidentDateTime(member.effective_from)}</Typography>
        </Stack>
        <Stack direction="row" gap={0.5} alignItems="center">
            {member.effective_to ? (
                <>
                    <LogoutIcon sx={{ fontSize: 16, color: 'error.main' }} />
                    <Typography variant="caption">{formatResidentDateTime(member.effective_to)}</Typography>
                </>
            ) : (
                <Chip
                    label={residentText(dictionary, 'detail_table_currently_residing', 'Đang cư trú')}
                    color="success"
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: 11 }}
                />
            )}
        </Stack>
    </Stack>
)

const MembersTable = ({
    members,
    currentResidentId,
    dictionary,
    relationshipCaptionMap
}: {
    members: ResidentContextMember[]
    currentResidentId: number
    dictionary: ResidentDictionary
    relationshipCaptionMap: ReadonlyMap<string, string>
}) => {
    if (members.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
                {residentText(dictionary, 'detail_household_no_other_members', 'Không có thành viên liên quan khác.')}
            </Typography>
        )
    }

    const columns = [
        residentText(dictionary, 'detail_table_full_name', 'Họ tên'),
        residentText(dictionary, 'detail_profile_resident_code', 'Mã cư dân'),
        residentText(dictionary, 'detail_table_role', 'Quyền cư dân'),
        residentText(dictionary, 'detail_table_resident_type', 'Loại cư dân'),
        residentText(dictionary, 'detail_table_effective_period', 'Thời gian ra vào'),
        residentText(dictionary, 'detail_table_representative', 'Đại diện'),
        residentText(dictionary, 'detail_table_mobile_account', 'Tài khoản mobile'),
        residentText(dictionary, 'detail_table_phone', 'Số điện thoại'),
        residentText(dictionary, 'detail_profile_email', 'Email')
    ]

    return (
        <TableContainer component={Paper} sx={{ borderRadius: 2, border: 1, borderColor: 'divider' }}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        {columns.map(label => (
                            <TableCell key={label} sx={{ fontWeight: 800 }}>{label}</TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {members.map(member => {
                        const isCurrentResident = member.resident_id === currentResidentId

                        return (
                            <TableRow
                                key={`${member.resident_id}-${member.resident_code}`}
                                sx={isCurrentResident ? {
                                    bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
                                    '& td': { borderColor: 'primary.light' }
                                } : undefined}
                            >
                                <TableCell>
                                    <Stack direction="row" gap={0.75} alignItems="center">
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{emptyText(member.full_name)}</Typography>
                                        {isCurrentResident && (
                                            <Chip
                                                label={residentText(dictionary, 'detail_household_owner_is_current', 'Cư dân đang xem')}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                                sx={{ height: 20, fontSize: 11 }}
                                            />
                                        )}
                                    </Stack>
                                </TableCell>
                                <TableCell>{emptyText(member.resident_code)}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={getRoleLabel(dictionary, member)}
                                        color={getRoleColor(member.role)}
                                        size="small"
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>
                                    {getResidentRelationShipLabel(
                                        member.relationship_with_owner,
                                        relationshipCaptionMap
                                    )}
                                </TableCell>
                                <TableCell>
                                    <EffectivePeriodCell member={member} dictionary={dictionary} />
                                </TableCell>
                                <TableCell>{member.is_representative ? residentText(dictionary, 'detail_relations_representative', 'Đại diện') : '--'}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={getMobileAccountLabel(dictionary, member.has_mobile_account)}
                                        color={member.has_mobile_account ? 'success' : 'default'}
                                        size="small"
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>{emptyText(member.phone)}</TableCell>
                                <TableCell>{emptyText(member.email)}</TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

const AddApartmentActions = ({
    dictionary,
    onSelect
}: {
    dictionary: ResidentDictionary
    onSelect: (mode: 'OWNER' | 'TENANT') => void
}) => {
    const [menu_anchor, setMenuAnchor] = useState<HTMLElement | null>(null)
    const canAddOwner = canUseResidentApartmentAction(RESIDENT_APARTMENT_PERMISSION_KEYS.addOwnerApartment)
    const canAddResident = canUseResidentApartmentAction(RESIDENT_APARTMENT_PERMISSION_KEYS.addResidentApartment)

    if (!canAddOwner && !canAddResident) return null

    return (
        <>
            <Stack direction="row" gap={1} flexWrap="wrap" sx={{ display: { xs: 'none', md: 'flex' } }}>
                {canAddOwner && (
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<AddHomeWorkOutlinedIcon />}
                        onClick={() => onSelect('OWNER')}
                    >
                        {residentText(dictionary, 'add_apartment_owner_title', 'Sở hữu thêm căn hộ')}
                    </Button>
                )}
                {canAddResident && (
                    <Button
                        variant="outlined"
                        color="secondary"
                        size="small"
                        startIcon={<VpnKeyOutlinedIcon />}
                        onClick={() => onSelect('TENANT')}
                    >
                        {residentText(dictionary, 'add_apartment_tenant_title', 'Thuê căn hộ')}
                    </Button>
                )}
            </Stack>

            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    endIcon={<ExpandMoreIcon />}
                    onClick={event => setMenuAnchor(event.currentTarget)}
                >
                    {residentText(dictionary, 'add_relation_menu_label', 'Thêm quan hệ')}
                </Button>
                <Menu anchorEl={menu_anchor} open={Boolean(menu_anchor)} onClose={() => setMenuAnchor(null)}>
                    {canAddOwner && (
                        <MenuItem onClick={() => { setMenuAnchor(null); onSelect('OWNER') }}>
                            <AddHomeWorkOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />
                            {residentText(dictionary, 'add_apartment_owner_title', 'Sở hữu thêm căn hộ')}
                        </MenuItem>
                    )}
                    {canAddResident && (
                        <MenuItem onClick={() => { setMenuAnchor(null); onSelect('TENANT') }}>
                            <VpnKeyOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />
                            {residentText(dictionary, 'add_apartment_tenant_title', 'Thuê căn hộ')}
                        </MenuItem>
                    )}
                </Menu>
            </Box>
        </>
    )
}

const ApartmentCard = ({
    view,
    currentResidentId,
    defaultExpanded,
    dictionary,
    locale,
    relationshipCaptionMap,
    onAddMember
}: {
    view: ApartmentRelationView
    currentResidentId: number
    defaultExpanded: boolean
    dictionary: ResidentDictionary
    locale: Locale
    relationshipCaptionMap: ReadonlyMap<string, string>
    onAddMember: (household: ResidentHouseholdContext) => void
}) => {
    const isOwner = view.owner?.resident_id === currentResidentId
    const isCurrentResidentOwner = isOwner || view.currentRelation?.role === 'OWNER'
    const household = view.household
    const relation = view.currentRelation

    return (
        <Accordion
            defaultExpanded={defaultExpanded}
            sx={{
                borderRadius: '8px !important',
                border: 1,
                borderColor: 'divider',
                boxShadow: 'none',
                overflow: 'hidden',
                '&:before': { display: 'none' }
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                    px: 2.75,
                    py: 1.5,
                    position: 'relative',
                    overflow: 'hidden',
                    background: theme => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.14)} 0%, ${alpha(theme.palette.primary.light, 0.06)} 55%, ${theme.palette.background.paper} 100%)`,
                    '& .MuiAccordionSummary-content': { my: 0, zIndex: 1, minWidth: 0 },
                    '&.Mui-expanded': { borderBottom: 1, borderColor: 'divider' }
                }}
            >
                <ApartmentIcon
                    sx={{
                        position: 'absolute',
                        right: -14,
                        top: -18,
                        fontSize: 120,
                        color: 'primary.main',
                        opacity: 0.06,
                        transform: 'rotate(-8deg)',
                        pointerEvents: 'none'
                    }}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} alignItems={{ sm: 'center' }} justifyContent="space-between" sx={{ flex: 1, minWidth: 0 }} flexWrap="wrap">
                    <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} alignItems={{ sm: 'center' }} flexWrap="wrap">
                        <Box>
                            <Typography sx={{ fontWeight: 900, color: 'primary.dark', fontSize: '1.05rem' }}>
                                {emptyText(household.apartment_code)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {residentText(dictionary, 'detail_relations_project', 'Dự án')}: {emptyText(household.project_code)}
                                {' · '}
                                {residentText(dictionary, 'detail_relations_building', 'Tòa')}: {emptyText(household.building_code)}
                            </Typography>
                        </Box>
                        <Stack direction="row" gap={1} flexWrap="wrap">
                            <Chip
                                icon={<HomeIcon sx={{ fontSize: '14px !important' }} />}
                                label={`${residentText(dictionary, 'detail_relations_role_badge', 'Quyền cư dân')}: ${getRoleLabel(dictionary, relation)}`}
                                color={getRoleColor(relation?.role)}
                                size="small"
                                sx={{ fontWeight: 700 }}
                            />
                            {relation?.is_representative && (
                                <Chip
                                    icon={<HowToRegIcon sx={{ fontSize: '14px !important' }} />}
                                    label={residentText(dictionary, 'detail_relations_representative', 'Đại diện')}
                                    color="secondary"
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                            {relation?.effective_from && (
                                <Chip
                                    icon={<LoginIcon sx={{ fontSize: '14px !important' }} />}
                                    label={`${residentText(dictionary, 'detail_household_move_in', 'Ngày bắt đầu ở')}: ${formatResidentDate(relation.effective_from)}`}
                                    color="success"
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                            {relation?.effective_to && (
                                <Chip
                                    icon={<LogoutIcon sx={{ fontSize: '14px !important' }} />}
                                    label={`${residentText(dictionary, 'detail_household_move_out', 'Ngày kết thúc ở')}: ${formatResidentDate(relation.effective_to)}`}
                                    color="error"
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        </Stack>
                    </Stack>
                    {isCurrentResidentOwner && (
                        <Button
                            component="span"
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<PersonAddAlt1OutlinedIcon fontSize="small" />}
                            onClick={event => {
                                event.stopPropagation()
                                onAddMember(household)
                            }}
                            sx={{ flexShrink: 0 }}
                        >
                            {residentText(dictionary, 'add_member_title', 'Thêm thành viên')}
                        </Button>
                    )}
                </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Stack spacing={2}>
                    {!relation && (
                        <Alert severity="warning" sx={{ py: 0.5 }}>
                            {residentText(dictionary, 'detail_household_no_relation_found', 'Không tìm thấy quan hệ của cư dân trong căn này')}
                        </Alert>
                    )}
                    <Stack spacing={1}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {residentText(dictionary, 'detail_household_owner', 'Chủ hộ')}
                        </Typography>
                        <OwnerMiniProfile owner={view.owner} isCurrentResident={isOwner} dictionary={dictionary} />
                    </Stack>
                    <Divider />
                    <Stack spacing={1}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {residentText(dictionary, 'detail_household_other_members', 'Danh sách thành viên liên quan trong căn hộ')}
                        </Typography>
                        <MembersTable
                            members={view.members}
                            currentResidentId={currentResidentId}
                            dictionary={dictionary}
                            relationshipCaptionMap={relationshipCaptionMap}
                        />
                    </Stack>
                    <Divider />
                    <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="flex-end">
                        <Button
                            component={Link}
                            href={`/${locale}/properties/unit/${household.apartment_id}`}
                            size="small"
                            variant="outlined"
                            startIcon={<VisibilityOutlinedIcon fontSize="small" />}
                        >
                            {residentText(dictionary, 'detail_apartment_action_view', 'Xem')}
                        </Button>
                        <Tooltip title={residentText(dictionary, 'detail_apartment_action_disabled_tooltip', 'Chức năng đang được phát triển.')}>
                            <span>
                                <Button size="small" variant="outlined" disabled startIcon={<EditOutlinedIcon fontSize="small" />}>
                                    {residentText(dictionary, 'detail_apartment_action_edit_role', 'Sửa vai trò')}
                                </Button>
                            </span>
                        </Tooltip>
                        <Tooltip title={residentText(dictionary, 'detail_apartment_action_disabled_tooltip', 'Chức năng đang được phát triển.')}>
                            <span>
                                <Button size="small" variant="outlined" color="error" disabled startIcon={<LinkOffIcon fontSize="small" />}>
                                    {residentText(dictionary, 'detail_apartment_action_unlink', 'Gỡ liên kết')}
                                </Button>
                            </span>
                        </Tooltip>
                    </Stack>
                </Stack>
            </AccordionDetails>
        </Accordion>
    )
}

const ResidentDetailPage = ({ dictionary, locale, session, residentId, residentEntityId, residentDetail, detailError, contextResult, residentStatus, account = null, accountError = null }: Props) => {
    const router = useRouter()
    const [retrying, startRetry] = useTransition()
    const context = contextResult.data
    const general = context?.general ?? null
    const headerResident = general ?? residentDetail
    const currentResidentId = general?.resident_id ?? residentDetail?.id ?? residentId
    const detailPageState = getResidentDetailPageState(residentDetail, detailError)
    const canRenderResidentActions = detailPageState === 'ready' && !contextResult.error && Boolean(general && currentResidentId > 0)
    const listHref = `/${locale}/resident/list`
    const status = (residentStatus as ResidentListStatus) || 'A'
    const sessiontoken = session?.user?.token as string | undefined
    const [activeTab, setActiveTab] = useState<ResidentDetailTabKey>('profile')
    // ref_record_id must be the validated dynamic-route resident id. The detail workflow's
    // own `id` field is a different entity reference and must never be used here.
    const relatedMembersResidentId = Number.isInteger(residentId) && residentId > 0 ? residentId : 0
    const relatedMembersEditor = useResidentRelatedMembersForm({ residentId: relatedMembersResidentId, active: activeTab === 'related-members', dictionary, sessiontoken, language: locale })

    const { captionMap: relationshipCaptionMap } = useCodeListCaptionMap({
        code_group: RESIDENT_RELATIONSHIP_CODE_GROUP,
        code_name: RESIDENT_RELATIONSHIP_CODE_NAME,
        language: locale
    })

    const actions = useResidentDetailActions({
        dictionary,
        sessiontoken,
        language: locale,
        residentId: currentResidentId,
        onDeleteSuccess: () => router.replace(listHref)
    })

    const apartmentViews =
        context && context.households.length > 0
            ? buildApartmentViews(context.households, currentResidentId)
            : []

    const handleTabChange = (_event: SyntheticEvent, value: ResidentDetailTabKey) => {
        if (value === activeTab) return
        if (activeTab === 'related-members' && !relatedMembersEditor.confirmTabLeave()) return
        setActiveTab(value)
    }

    const retryDetailLoad = () => startRetry(() => router.refresh())

    return (
        <ContentWrapper
            title={residentText(dictionary, 'detail_title', 'Chi tiết cư dân')}
            description={residentText(dictionary, 'detail_subtitle', 'Hồ sơ, liên hệ, căn hộ và hộ gia đình của cư dân.')}
            icon={<PeopleAltIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            dictionary={dictionary}
            issearch
        >
            <Stack spacing={3} sx={{ mt: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                    <Stack spacing={1}>
                        <Breadcrumbs>
                            <Typography color="text.secondary">{residentText(dictionary, 'resident', 'Cư dân')}</Typography>
                            <Link href={listHref} style={{ color: 'inherit', textDecoration: 'none' }}>
                                {residentText(dictionary, 'list_title', 'Danh sách cư dân')}
                            </Link>
                            <Typography color="text.primary">{residentText(dictionary, 'detail_title', 'Chi tiết cư dân')}</Typography>
                        </Breadcrumbs>
                        <Typography variant="h4" sx={{ fontWeight: 900 }}>{residentText(dictionary, 'detail_header_title', 'Thông tin cư dân')}</Typography>
                        {headerResident && (
                            <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                                <Typography variant="body2" color="text.secondary">
                                    {emptyText(headerResident.resident_code)} · {emptyText(headerResident.full_name)}
                                </Typography>
                                <Chip size="small" color={getResidentStatusColor(status)} label={getResidentStatusLabel(dictionary, status)} />
                            </Stack>
                        )}
                    </Stack>
                    <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                        <Button component={Link} href={listHref} variant="outlined" size="small" startIcon={<ArrowBackIcon />} sx={compactActionButtonSx}>
                            {residentText(dictionary, 'detail_back_to_list', 'Quay lại danh sách')}
                        </Button>
                        {canRenderResidentActions && <><Button
                            component={Link}
                            href={`/${locale}/resident/detail/${residentId}/edit`}
                            variant="outlined"
                            size="small"
                            startIcon={<EditOutlinedIcon />}
                            disabled={!general}
                            sx={compactActionButtonSx}
                        >
                            {residentText(dictionary, 'detail_action_edit', 'Chỉnh sửa')}
                        </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<DeleteOutlineIcon />}
                                disabled={!general}
                                onClick={actions.startDeleteConfirm}
                                sx={compactActionButtonSx}
                            >
                                {residentText(dictionary, 'action_delete', 'Xóa')}
                            </Button>
                        </>}
                    </Stack>
                </Stack>

                {detailPageState === 'ready' ? <><Box
                    sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        px: { xs: 1, sm: 2 },
                        background: theme => `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 55%, ${theme.palette.primary.dark} 100%)`
                    }}
                >
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        aria-label={residentText(dictionary, 'detail_tabs_label', 'Các tab thông tin cư dân')}
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
                        <Tab
                            value="profile"
                            icon={<PersonIcon fontSize="small" />}
                            iconPosition="start"
                            label={residentText(dictionary, 'detail_tab_profile', 'Thông tin cá nhân')}
                        />
                        <Tab
                            value="apartments"
                            icon={<ApartmentIcon fontSize="small" />}
                            iconPosition="start"
                            label={
                                <Badge
                                    badgeContent={apartmentViews.length}
                                    color="secondary"
                                    sx={{ '& .MuiBadge-badge': { right: -14, top: 2 } }}
                                >
                                    <Box component="span" sx={{ pr: 1 }}>
                                        {residentText(dictionary, 'detail_tab_apartments', 'Căn hộ liên quan')}
                                    </Box>
                                </Badge>
                            }
                        />
                        <Tab
                            value="related-members"
                            icon={<PeopleAltIcon fontSize="small" />}
                            iconPosition="start"
                            label={residentText(dictionary, 'related_members_title', '')}
                        />
                        <Tab
                            value="account"
                            icon={<AccountCircleOutlinedIcon fontSize="small" />}
                            iconPosition="start"
                            label={residentText(dictionary, 'detail_tab_account', 'Thông tin đăng nhập')}
                        />
                        <Tab
                            value="history"
                            icon={<HistoryOutlinedIcon fontSize="small" />}
                            iconPosition="start"
                            label={residentText(dictionary, 'detail_tab_history', 'Lịch sử thao tác')}
                        />
                    </Tabs>
                </Box>

                    <Box role="tabpanel" hidden={activeTab !== 'profile'}>
                        {activeTab === 'profile' && (
                            contextResult.error ? (
                                residentDetail ? (
                                    <Paper sx={{ p: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                                        <Grid container spacing={2}>
                                            {getResidentDetailFallbackFields(residentDetail).map(([key, value]) => (
                                                <Grid key={key} size={key === 'description' ? { xs: 12 } : { xs: 12, sm: 6, md: 4 }}><DetailItem label={getFallbackFieldLabel(dictionary, key)} value={key === 'gender' ? getGenderDisplay(dictionary, String(value)) : key === 'date_of_birth' ? formatResidentDate(String(value)) : value} /></Grid>
                                            ))}
                                        </Grid>
                                    </Paper>
                                ) : null
                            ) : general ? (
                                <Paper sx={{ p: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                                        <Stack alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1.5} sx={{ minWidth: 220 }}>
                                            <Avatar src={general.avatar_url ?? undefined} sx={{ width: 96, height: 96, fontSize: 38, fontWeight: 900 }}>
                                                {!general.avatar_url && getInitial(general.full_name)}
                                            </Avatar>
                                            <Typography variant="h6" sx={{ fontWeight: 900 }}>{emptyText(general.full_name)}</Typography>
                                            <Chip
                                                size="small"
                                                icon={<SmartphoneIcon sx={{ fontSize: '14px !important' }} />}
                                                color={general.has_mobile_account ? 'success' : 'default'}
                                                label={getMobileAccountLabel(dictionary, general.has_mobile_account)}
                                            />
                                        </Stack>
                                        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
                                        <Grid container spacing={2} sx={{ flex: 1 }}>
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }}><DetailItem label={residentText(dictionary, 'detail_profile_resident_code', 'Mã cư dân')} value={emptyText(general.resident_code)} /></Grid>
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }}><DetailItem label={residentText(dictionary, 'detail_profile_phone', 'Số điện thoại')} value={emptyText(general.phone)} /></Grid>
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }}><DetailItem label={residentText(dictionary, 'detail_profile_email', 'Email')} value={emptyText(general.email)} /></Grid>
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }}><DetailItem label={residentText(dictionary, 'detail_profile_identity_number', 'CCCD/CMND')} value={emptyText(general.identity_number)} /></Grid>
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }}><DetailItem label={residentText(dictionary, 'detail_profile_date_of_birth', 'Ngày sinh')} value={formatResidentDate(general.date_of_birth) === '-' ? '--' : formatResidentDate(general.date_of_birth)} /></Grid>
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }}><DetailItem label={residentText(dictionary, 'detail_profile_gender', 'Giới tính')} value={getGenderDisplay(dictionary, general.gender)} /></Grid>
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }}><DetailItem label={residentText(dictionary, 'detail_profile_user_code', 'Mã user')} value={emptyText(general.user_code)} /></Grid>
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }}><DetailItem label={residentText(dictionary, 'detail_profile_id', 'ID')} value={general.resident_id} /></Grid>
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }}><DetailItem label={residentText(dictionary, 'detail_profile_mobile_account', 'Tài khoản mobile')} value={getMobileAccountLabel(dictionary, general.has_mobile_account)} /></Grid>
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }}><DetailItem label={residentText(dictionary, 'detail_profile_nationality', 'Quốc tịch')} value={emptyText(residentDetail?.nationality)} /></Grid>
                                            <Grid size={{ xs: 12 }}><DetailItem label={residentText(dictionary, 'detail_profile_description', 'Mô tả')} value={emptyText(residentDetail?.description)} /></Grid>
                                        </Grid>
                                    </Stack>
                                </Paper>
                            ) : (
                                <Alert severity="info">{residentText(dictionary, 'detail_empty_no_data', 'Không có dữ liệu cư dân.')}</Alert>
                            )
                        )}
                    </Box>

                    <Box role="tabpanel" hidden={activeTab !== 'apartments'}>
                        {activeTab === 'apartments' && (
                            <Paper sx={{ p: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                                <Stack spacing={2.5}>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={1.5}>
                                        <Stack spacing={0.5}>
                                            <Stack direction="row" alignItems="center" gap={1}>
                                                <ApartmentIcon color="primary" />
                                                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                                                    {residentText(dictionary, 'detail_relations_title', 'Các căn hộ liên quan')}
                                                </Typography>
                                            </Stack>
                                            <Typography variant="body2" color="text.secondary">
                                                {residentText(dictionary, 'detail_relations_subtitle', 'Hiển thị các căn hộ mà cư dân này đang là chủ hộ, người thuê, thành viên hoặc người đại diện.')}
                                            </Typography>
                                        </Stack>
                                        {canRenderResidentActions && <AddApartmentActions dictionary={dictionary} onSelect={actions.openAddApartment} />}
                                    </Stack>

                                    {contextResult.error ? (
                                        <ContextErrorAlert dictionary={dictionary} error={contextResult.error} />
                                    ) : apartmentViews.length === 0 ? (
                                        <Alert severity="info">{residentText(dictionary, 'detail_empty_no_households', 'Cư dân này chưa có thông tin căn hộ liên quan.')}</Alert>
                                    ) : (
                                        <Stack spacing={2}>
                                            <RoleSummaryStrip views={apartmentViews} dictionary={dictionary} />
                                            <Stack spacing={1.5}>
                                                {apartmentViews.map((view, index) => (
                                                    <ApartmentCard
                                                        key={view.household.apartment_id}
                                                        view={view}
                                                        currentResidentId={currentResidentId}
                                                        defaultExpanded={index === 0}
                                                        dictionary={dictionary}
                                                        locale={locale}
                                                        relationshipCaptionMap={relationshipCaptionMap}
                                                        onAddMember={household => actions.openAddMember({
                                                            apartment_id: household.apartment_id,
                                                            apartment_code: household.apartment_code,
                                                            project_code: household.project_code,
                                                            building_code: household.building_code
                                                        })}
                                                    />
                                                ))}
                                            </Stack>
                                        </Stack>
                                    )}
                                </Stack>
                            </Paper>
                        )}
                    </Box>

                    <Box role="tabpanel" hidden={activeTab !== 'related-members'}>
                        {activeTab === 'related-members' && (
                            <ResidentRelatedMembersTab dictionary={dictionary} editor={relatedMembersEditor} />
                        )}
                    </Box>

                    <Box role="tabpanel" hidden={activeTab !== 'account'}>
                        {activeTab === 'account' && (
                            <ResidentAccountTab dictionary={dictionary} account={account} error={accountError} />
                        )}
                    </Box>

                    <Box role="tabpanel" hidden={activeTab !== 'history'}>
                        {activeTab === 'history' && (
                            <ResidentHistoryTab dictionary={dictionary} locale={locale} residentEntityId={residentEntityId} active={activeTab === 'history'} />
                        )}
                    </Box></> : <ResidentDetailLoadState
                    dictionary={dictionary}
                    state={detailPageState}
                    error={detailError}
                    backHref={listHref}
                    retrying={retrying}
                    onRetry={retryDetailLoad}
                />}
            </Stack>

            <ResidentConfirmDialog
                dictionary={dictionary}
                type={actions.confirm_type}
                error={actions.confirm_error}
                loading={actions.deleting}
                on_close={actions.closeConfirm}
                on_confirm={() => void actions.handleConfirm()}
            />

            <ResidentAddApartmentDrawer
                dictionary={dictionary}
                locale={locale}
                sessiontoken={sessiontoken}
                mode={actions.add_apartment_mode}
                residentCode={general?.resident_code}
                residentFullName={general?.full_name}
                form_values={actions.add_apartment_form}
                form_errors={actions.add_apartment_errors}
                general_error={actions.add_apartment_general_error}
                saving={actions.add_apartment_saving}
                on_close={actions.closeAddApartment}
                on_save={() => void actions.handleSaveAddApartment()}
                on_update_form={actions.updateAddApartmentForm}
            />

            <ResidentAddMemberDrawer
                dictionary={dictionary}
                open={Boolean(actions.add_member_context)}
                context={actions.add_member_context}
                form_values={actions.add_member_form}
                form_errors={actions.add_member_errors}
                general_error={actions.add_member_general_error}
                saving={actions.add_member_saving}
                on_close={actions.closeAddMember}
                on_save={() => void actions.handleSaveAddMember()}
                on_update_form={actions.updateAddMemberForm}
            />
        </ContentWrapper>
    )
}

export default ResidentDetailPage
