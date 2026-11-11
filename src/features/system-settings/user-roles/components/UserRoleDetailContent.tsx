'use client'

import type { ReactNode } from 'react'

import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AppsIcon from '@mui/icons-material/Apps'
import BadgeIcon from '@mui/icons-material/Badge'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import KeyIcon from '@mui/icons-material/Key'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import PersonIcon from '@mui/icons-material/Person'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import SmartphoneIcon from '@mui/icons-material/Smartphone'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Alert,
  Breadcrumbs,
  Box,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  Link as MuiLink,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import NextLink from 'next/link'
import { useRouter } from '@shared/hooks/useRouter'

import { useWorkingProjectIsSuperAdmin } from '@/@core/stores/useWorkingProjectStore'
import type { Locale } from '@/configs/i18n'
import { hasStaticRouteAccess } from '@/configs/staticRouteAccess'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import { useAppContext } from '@/shared/contexts/AppContext'
import SwalAlert from '@/shared/utils/SwalAlert'
import { hasEffectiveScreenActionAccess } from '@/shared/utils/authorization'

import { useUserRoleDetail } from '../hooks/useUserRoleDetail'
import { useUserRolePermissions } from '../hooks/useUserRolePermissions'
import type { UserRoleItem, UserRolesDictionary, UserRoleWorkflowErrorInfo } from '../types'
import {
  commonText,
  displayValue,
  formatUserRoleDateTime,
  getUserRoleApplicationDisplayName,
  getUserRoleApplicationMeta,
  getUserRoleShowLabel,
  getUserRoleStatusColor,
  getUserRoleStatusLabel,
  toUserRolesPath,
  userRoleText
} from './userRoleHelpers'
import UserRolePermissionEditor from './UserRolePermissionEditor'

type Props = {
  dictionary: UserRolesDictionary
  locale: Locale
  role: UserRoleItem | null
  error?: UserRoleWorkflowErrorInfo | null
}

const DetailField = ({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) => (
  <Grid size={{ xs: 12, md: 6 }}>
    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'primary.light' }}>
        {icon}
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
          {label}
        </Typography>
      </Stack>
      <Box sx={{ minHeight: 28, display: 'flex', alignItems: 'center', wordBreak: 'break-word' }}>
        {children}
      </Box>
    </Stack>
  </Grid>
)

const applicationIconMap = {
  mobile: SmartphoneIcon,
  backOffice: DesktopWindowsIcon,
  default: AppsIcon
}

const EMPTY_RIGHTS: UserRoleItem['rights'] = []

const UserRoleDetailContent = ({ dictionary, locale, role: initialRole, error: initialError }: Props) => {
  const router = useRouter()
  const isSuperAdmin = useWorkingProjectIsSuperAdmin()
  const { menuData } = useAppContext()
  const detail = useUserRoleDetail({
    role: initialRole,
    initialError,
    locale,
    messages: {
      roleNameRequired: userRoleText(dictionary, 'validation_role_name_required', 'Role name is required.'),
      roleTypeRequired: userRoleText(dictionary, 'validation_role_type_required', 'Role type is required.'),
      serviceRequired: userRoleText(dictionary, 'validation_service_required', 'Service is required.'),
      statusRequired: userRoleText(dictionary, 'validation_status_required', 'Status is required.'),
      updateFailed: userRoleText(dictionary, 'update_failed', 'Unable to update user role.'),
      deleteTitle: userRoleText(dictionary, 'delete_role_title', 'Delete Role'),
      deleteConfirm: userRoleText(dictionary, 'delete_role_confirm', 'Are you sure you want to delete this role?'),
      deleteConfirmButton: userRoleText(dictionary, 'delete', 'Delete'),
      deleteCancelButton: userRoleText(dictionary, 'cancel', 'Cancel'),
      deleteSuccess: userRoleText(dictionary, 'role_delete_success', 'Role deleted successfully.'),
      deleteFailed: userRoleText(dictionary, 'role_delete_failed', 'Unable to delete role.')
    }
  })
  const role = detail.role
  const permissions = useUserRolePermissions({
    roleId: role?.role_id ?? 0,
    rights: role?.rights ?? EMPTY_RIGHTS,
    locale,
    fallbackOperationCaption: commonText(dictionary, 'operation', 'Operation')
  })
  const backToList = () => router.push(toUserRolesPath(locale))
  const traceHref = detail.workflowError?.executionId
    ? `/${locale}/system-settings/application-logs?execution_id=${encodeURIComponent(detail.workflowError.executionId)}`
    : undefined
  const applicationMeta = role ? getUserRoleApplicationMeta(dictionary, role.service_id) : null
  const ApplicationIcon = applicationIconMap[applicationMeta?.icon ?? 'default']
  const applicationTitle = applicationMeta?.label ?? displayValue(role?.role_name)
  const fieldIconSx = { fontSize: 17 }
  const serviceOptions = Array.from(new Set([String(role?.service_id ?? '').trim(), 'MB', 'BO'].filter(Boolean)))
  const statusOptions = ['A', 'I']
  const canTraceApplicationLogs = hasStaticRouteAccess({
    route: '/system-settings/application-logs',
    action: 'VIEW',
    isSuperAdmin
  })
  const canModify = hasEffectiveScreenActionAccess({
    userCommand: menuData,
    route: '/system-settings/user-roles',
    action: 'MODIFY',
    isSuperAdmin
  })
  const canDelete = hasEffectiveScreenActionAccess({
    userCommand: menuData,
    route: '/system-settings/user-roles',
    action: 'DELETE',
    isSuperAdmin
  })

  const saveChanges = async () => {
    const updated = await detail.save()

    if (!updated) return

    const rightsUpdated = await permissions.save(userRoleText(dictionary, 'permission_assign_failed', 'Unable to update role permissions.'))
    if (!rightsUpdated.success) return

    if (!await detail.reload()) return

    SwalAlert('success', userRoleText(dictionary, 'update_success', 'User role updated successfully.'), 'center')
  }

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Breadcrumbs sx={{ mb: 1 }}>
            <MuiLink component={NextLink} href={`/${locale}/system-settings`} underline="hover">
              {userRoleText(dictionary, 'breadcrumb_system_settings', 'System Settings')}
            </MuiLink>
            <MuiLink component={NextLink} href={toUserRolesPath(locale)} underline="hover">
              {userRoleText(dictionary, 'breadcrumb_user_roles', 'Role Management')}
            </MuiLink>
            <Typography color="text.primary">{userRoleText(dictionary, 'detail_title', 'Role Detail')}</Typography>
          </Breadcrumbs>

          <Stack direction="row" gap={1.5} alignItems="flex-start">
            <AdminPanelSettingsIcon color="primary" sx={{ fontSize: 38, mt: 0.25 }} />
            <Stack>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {userRoleText(dictionary, 'detail_title', 'Role Detail')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userRoleText(dictionary, 'detail_subtitle', 'View Back Office role information.')}
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={backToList} sx={{ alignSelf: 'flex-start' }}>
          {userRoleText(dictionary, 'back_to_list', 'Back to role list')}
        </Button>

        {detail.workflowError && (
          <WorkflowErrorAlert
            title={detail.errorContext === 'update'
              ? userRoleText(dictionary, 'update_error_title', 'Unable to update role information')
              : detail.errorContext === 'delete'
                ? userRoleText(dictionary, 'delete_error_title', 'Unable to delete role')
                : userRoleText(dictionary, 'detail_error_title', 'Unable to load role information')}
            message={detail.workflowError.message}
            errorCode={detail.workflowError.workflowStep}
            errorCodeLabel={userRoleText(dictionary, 'error_code_label', 'Error Code')}
            executionId={detail.workflowError.executionId}
            referenceLabel={userRoleText(dictionary, 'error_reference_label', 'Error Reference')}
            copyLabel={userRoleText(dictionary, 'copy_label', 'Copy')}
            copiedLabel={userRoleText(dictionary, 'copied_label', 'Copied')}
            copySuccessMessage={userRoleText(dictionary, 'copy_success', 'Error reference copied.')}
            copyFailedMessage={userRoleText(dictionary, 'copy_failed', 'Unable to copy error reference.')}
            technicalDetails={detail.workflowError.technicalDetails}
            technicalDetailsLabel={userRoleText(dictionary, 'technical_details', 'Technical Details')}
            allowTrace={canTraceApplicationLogs}
            traceHref={traceHref}
            traceLabel={userRoleText(dictionary, 'trace_error', 'Trace error')}
            traceTooltip={userRoleText(dictionary, 'trace_error_tooltip', 'Open application logs to trace this error')}
          />
        )}

        {permissions.workflowError && (
          <WorkflowErrorAlert
            title={userRoleText(dictionary, 'update_error_title', 'Unable to update role information')}
            message={permissions.workflowError.message}
            errorCode={permissions.workflowError.workflowStep}
            errorCodeLabel={userRoleText(dictionary, 'error_code_label', 'Error Code')}
            executionId={permissions.workflowError.executionId}
            referenceLabel={userRoleText(dictionary, 'error_reference_label', 'Error Reference')}
            copyLabel={userRoleText(dictionary, 'copy_label', 'Copy')}
            copiedLabel={userRoleText(dictionary, 'copied_label', 'Copied')}
            copySuccessMessage={userRoleText(dictionary, 'copy_success', 'Error reference copied.')}
            copyFailedMessage={userRoleText(dictionary, 'copy_failed', 'Unable to copy error reference.')}
            technicalDetails={permissions.workflowError.technicalDetails}
            technicalDetailsLabel={userRoleText(dictionary, 'technical_details', 'Technical Details')}
            allowTrace={canTraceApplicationLogs}
            traceHref={permissions.workflowError.executionId
              ? `/${locale}/system-settings/application-logs?execution_id=${encodeURIComponent(permissions.workflowError.executionId)}`
              : undefined}
            traceLabel={userRoleText(dictionary, 'trace_error', 'Trace error')}
            traceTooltip={userRoleText(dictionary, 'trace_error_tooltip', 'Open application logs to trace this error')}
          />
        )}

        {!role ? (
          !detail.workflowError && <Alert severity="info">{userRoleText(dictionary, 'detail_not_found', 'Role detail was not found.')}</Alert>
        ) : (
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
            <Stack spacing={2.5}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1.5}>
                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ApplicationIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>{applicationTitle}</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {userRoleText(dictionary, 'field_role_id', 'Role ID')}: {role.role_id}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                  {!detail.editMode && <>
                    <Chip size="small" color={getUserRoleStatusColor(role.status)} label={getUserRoleStatusLabel(dictionary, role.status)} />
                    <Chip size="small" variant="outlined" label={getUserRoleShowLabel(dictionary, role.is_show)} />
                  </>}
                  {!detail.editMode && canModify && (
                    <Button variant="contained" size="small" startIcon={<EditOutlinedIcon />} onClick={detail.startEdit}>
                      {userRoleText(dictionary, 'modify', 'Modify')}
                    </Button>
                  )}
                  {!detail.editMode && canDelete && (
                    <Button
                      color="error"
                      variant="outlined"
                      size="small"
                      startIcon={<DeleteOutlineIcon />}
                      onClick={() => void detail.deleteRole()}
                      disabled={detail.deleting}
                    >
                      {detail.deleting
                        ? userRoleText(dictionary, 'deleting', 'Deleting...')
                        : userRoleText(dictionary, 'delete', 'Delete')}
                    </Button>
                  )}
                </Stack>
              </Stack>

              <Divider />

              {detail.editMode && detail.editForm ? (
                <Stack component="form" spacing={2.25} onSubmit={event => { event.preventDefault(); void saveChanges() }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{userRoleText(dictionary, 'edit_section_title', 'Edit Role Information')}</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField required fullWidth label={userRoleText(dictionary, 'field_role_name', 'Role Name')} value={detail.editForm.role_name}
                        onChange={event => detail.updateField('role_name', event.target.value)} error={Boolean(detail.fieldErrors.role_name)} helperText={detail.fieldErrors.role_name} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField fullWidth multiline minRows={3} label={userRoleText(dictionary, 'field_role_description', 'Description')} value={detail.editForm.role_description}
                        onChange={event => detail.updateField('role_description', event.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField required select fullWidth label={userRoleText(dictionary, 'field_service_id', 'Service')} value={detail.editForm.service_id}
                        onChange={event => detail.updateField('service_id', event.target.value)} error={Boolean(detail.fieldErrors.service_id)} helperText={detail.fieldErrors.service_id}>
                        {serviceOptions.map(code => <MenuItem key={code} value={code}>{getUserRoleApplicationDisplayName(dictionary, code)}</MenuItem>)}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField required select fullWidth label={userRoleText(dictionary, 'field_status', 'Status')} value={detail.editForm.status}
                        onChange={event => detail.updateField('status', event.target.value)} error={Boolean(detail.fieldErrors.status)} helperText={detail.fieldErrors.status}>
                        {statusOptions.map(status => <MenuItem key={status} value={status}>{getUserRoleStatusLabel(dictionary, status)}</MenuItem>)}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControlLabel control={<Switch checked={detail.editForm.is_show === 'Y'} onChange={event => detail.updateField('is_show', event.target.checked ? 'Y' : 'N')} />}
                        label={userRoleText(dictionary, 'field_is_show', 'Visible')} sx={{ mt: 1 }} />
                    </Grid>
                  </Grid>
                  <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <Button variant="outlined" color="inherit" startIcon={<CancelOutlinedIcon />} onClick={detail.cancelEdit} disabled={detail.saving}>
                      {userRoleText(dictionary, 'cancel', 'Cancel')}
                    </Button>
                    <Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />} disabled={detail.saving || permissions.saving}>
                      {detail.saving || permissions.saving ? userRoleText(dictionary, 'saving', 'Saving...') : userRoleText(dictionary, 'save_changes', 'Save Changes')}
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <>
                  <Stack spacing={2}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{userRoleText(dictionary, 'section_general', 'General Information')}</Typography>
                    <Grid container spacing={2.25}>
                      <DetailField icon={<KeyIcon sx={fieldIconSx} />} label={userRoleText(dictionary, 'field_role_id', 'Role ID')}><Typography>{role.role_id}</Typography></DetailField>
                      <DetailField icon={<BadgeIcon sx={fieldIconSx} />} label={userRoleText(dictionary, 'field_role_name', 'Role Name')}><Typography sx={{ fontWeight: 700 }}>{displayValue(role.role_name)}</Typography></DetailField>
                      <Grid size={{ xs: 12 }}><Stack spacing={0.5}><Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'primary.light' }}><DescriptionOutlinedIcon sx={fieldIconSx} /><Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>{userRoleText(dictionary, 'field_role_description', 'Description')}</Typography></Stack><Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{displayValue(role.role_description)}</Typography></Stack></Grid>
                      <DetailField icon={<PersonIcon sx={fieldIconSx} />} label={userRoleText(dictionary, 'field_user_type', 'User Type')}><Typography>{getUserRoleApplicationDisplayName(dictionary, role.user_type)}</Typography></DetailField>
                      <DetailField icon={<ApplicationIcon sx={fieldIconSx} />} label={userRoleText(dictionary, 'field_service_id', 'Service')}><Typography>{getUserRoleApplicationDisplayName(dictionary, role.service_id)}</Typography></DetailField>
                      <DetailField icon={<DescriptionOutlinedIcon sx={fieldIconSx} />} label={userRoleText(dictionary, 'field_contract_no', 'Contract No.')}><Typography>{displayValue(role.contract_no)}</Typography></DetailField>
                      <DetailField icon={<VerifiedUserOutlinedIcon sx={fieldIconSx} />} label={userRoleText(dictionary, 'field_status', 'Status')}><Chip size="small" color={getUserRoleStatusColor(role.status)} label={getUserRoleStatusLabel(dictionary, role.status)} /></DetailField>
                      <DetailField icon={<VisibilityOutlinedIcon sx={fieldIconSx} />} label={userRoleText(dictionary, 'field_is_show', 'Visible')}><Chip size="small" variant="outlined" label={getUserRoleShowLabel(dictionary, role.is_show)} /></DetailField>
                    </Grid>
                  </Stack>
                  <Divider />
                  <Stack spacing={2}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{userRoleText(dictionary, 'section_audit', 'Audit Information')}</Typography>
                    <Grid container spacing={2.25}>
                      <DetailField icon={<PersonAddIcon sx={fieldIconSx} />} label={userRoleText(dictionary, 'field_user_created', 'Created By')}><Typography>{displayValue(role.user_created)}</Typography></DetailField>
                      <DetailField icon={<EventAvailableIcon sx={fieldIconSx} />} label={userRoleText(dictionary, 'field_date_created', 'Created Date')}><Typography>{formatUserRoleDateTime(role.date_created)}</Typography></DetailField>
                      <DetailField icon={<ManageAccountsIcon sx={fieldIconSx} />} label={userRoleText(dictionary, 'field_user_modified', 'Modified By')}><Typography>{displayValue(role.user_modified)}</Typography></DetailField>
                      <DetailField icon={<CalendarMonthIcon sx={fieldIconSx} />} label={userRoleText(dictionary, 'field_date_modified', 'Modified Date')}><Typography>{formatUserRoleDateTime(role.date_modified)}</Typography></DetailField>
                    </Grid>
                  </Stack>
                </>
              )}
              <Divider />
              <Stack spacing={0.25}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{userRoleText(dictionary, 'permission_section_title', 'Function Permissions')}</Typography>
                <Typography variant="body2" color="text.secondary">{userRoleText(dictionary, 'permission_section_subtitle', 'Configure the execution and approval permissions for this role.')}</Typography>
              </Stack>
              <UserRolePermissionEditor
                dictionary={dictionary}
                permissions={permissions}
                disabled={!canModify || !detail.editMode}
              />
            </Stack>
          </Paper>
        )}
      </Stack>
    </Paper>
  )
}

export default UserRoleDetailContent
