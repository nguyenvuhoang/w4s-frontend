'use client'

import { useState } from 'react'

import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Divider,
  Grid,
  Link as MuiLink,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
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

import { useRoleCreatePermissions } from '../hooks/useRoleCreatePermissions'
import { useUserRoleCreate } from '../hooks/useUserRoleCreate'
import type { UserRolesDictionary } from '../types'
import RoleInvokeApprovePanel from './RoleInvokeApprovePanel'
import {
  USER_ROLE_SERVICE_OPTIONS,
  commonText,
  getUserRoleApplicationDisplayName,
  toUserRolesPath,
  userRoleText
} from './userRoleHelpers'

type Props = {
  dictionary: UserRolesDictionary
  locale: Locale
}

const UserRoleCreateContent = ({ dictionary, locale }: Props) => {
  const router = useRouter()
  const isSuperAdmin = useWorkingProjectIsSuperAdmin()
  const { menuData } = useAppContext()
  const backToList = () => router.push(toUserRolesPath(locale))
  const [activeTab, setActiveTab] = useState(0)

  const create = useUserRoleCreate({
    locale,
    messages: {
      roleNameRequired: userRoleText(dictionary, 'validation_role_name_required', 'Role name is required.'),
      serviceRequired: userRoleText(dictionary, 'validation_service_required', 'Service is required.'),
      createFailed: userRoleText(dictionary, 'create_failed', 'Unable to create user role.')
    }
  })

  // Chi goi WF_BO_LOAD_MENU khi user da mo tab "Phan quyen thuc hien & phe duyet" lan dau;
  // hook tu cache (menuLoaded) nen quay lai tab nay cac lan sau khong goi lai workflow.
  const permissions = useRoleCreatePermissions({
    locale,
    enabled: activeTab === 1,
    fallbackOperationCaption: commonText(dictionary, 'operation', 'Operation')
  })

  const canTraceApplicationLogs = hasStaticRouteAccess({
    route: '/system-settings/application-logs',
    action: 'VIEW',
    isSuperAdmin
  })
  const traceHref = create.workflowError?.executionId
    ? `/${locale}/system-settings/application-logs?execution_id=${encodeURIComponent(create.workflowError.executionId)}`
    : undefined
  const canCreate = hasEffectiveScreenActionAccess({
    userCommand: menuData,
    route: '/system-settings/user-roles',
    action: 'ADD',
    isSuperAdmin
  })

  // Buoc 1 -> 2: chi validate Thong tin quyen, chua goi API tao role.
  const goToPermissionStep = () => {
    if (create.validate()) setActiveTab(1)
  }

  const backToRoleInfoStep = () => setActiveTab(0)

  // Chi thuc su tao Role + gan quyen khi bam "Them Quyen" o buoc 2.
  const submit = async () => {
    const roleNameForMessage = create.form.role_name
    const result = await create.submit()

    if (!result.success) {
      // Dam bao loi validate/workflow o tab "Thong tin quyen" luon hien thi, ke ca khi user dang o tab Phan quyen.
      setActiveTab(0)
      return
    }

    if (permissions.hasSelection) {
      if (!result.roleId) {
        SwalAlert(
          'warning',
          userRoleText(dictionary, 'permission_assign_warning_hint', 'Role "{roleName}" was created successfully. Please configure permissions in Role Profile.').replace('{roleName}', roleNameForMessage),
          'center'
        )
        router.push(toUserRolesPath(locale))
        router.refresh()
        return
      }

      const rightsResult = await permissions.submitRights(result.roleId, {
        assignFailed: userRoleText(dictionary, 'permission_assign_failed', 'Unable to assign permissions to the new role.')
      })

      if (!rightsResult.success) {
        SwalAlert(
          'warning',
          rightsResult.error?.message ?? userRoleText(dictionary, 'permission_assign_failed', 'Unable to assign permissions to the new role.'),
          'center'
        )
        router.push(toUserRolesPath(locale))
        router.refresh()
        return
      }
    }

    SwalAlert('success', userRoleText(dictionary, 'create_success', 'User role created successfully.'), 'center')
    router.push(toUserRolesPath(locale))
    router.refresh()
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
            <Typography color="text.primary">{userRoleText(dictionary, 'create_title', 'Add Role')}</Typography>
          </Breadcrumbs>

          <Stack direction="row" gap={1.5} alignItems="flex-start">
            <AdminPanelSettingsIcon color="primary" sx={{ fontSize: 38, mt: 0.25 }} />
            <Stack>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {userRoleText(dictionary, 'create_title', 'Add Role')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userRoleText(dictionary, 'create_subtitle', 'Create a new role and configure its execution and approval permissions.')}
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={backToList} sx={{ alignSelf: 'flex-start' }}>
          {userRoleText(dictionary, 'back_to_list', 'Back to role list')}
        </Button>

        {!canCreate ? (
          <Alert severity="warning">
            {userRoleText(dictionary, 'create_forbidden', 'You do not have permission to create a new role.')}
          </Alert>
        ) : (
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
            <Stack spacing={2.5}>
              {create.workflowError && (
                <WorkflowErrorAlert
                  title={userRoleText(dictionary, 'create_error_title', 'Unable to create role')}
                  message={create.workflowError.message}
                  errorCode={create.workflowError.workflowStep}
                  errorCodeLabel={userRoleText(dictionary, 'error_code_label', 'Error Code')}
                  executionId={create.workflowError.executionId}
                  referenceLabel={userRoleText(dictionary, 'error_reference_label', 'Error Reference')}
                  copyLabel={userRoleText(dictionary, 'copy_label', 'Copy')}
                  copiedLabel={userRoleText(dictionary, 'copied_label', 'Copied')}
                  copySuccessMessage={userRoleText(dictionary, 'copy_success', 'Error reference copied.')}
                  copyFailedMessage={userRoleText(dictionary, 'copy_failed', 'Unable to copy error reference.')}
                  technicalDetails={create.workflowError.technicalDetails}
                  technicalDetailsLabel={userRoleText(dictionary, 'technical_details', 'Technical Details')}
                  allowTrace={canTraceApplicationLogs}
                  traceHref={traceHref}
                  traceLabel={userRoleText(dictionary, 'trace_error', 'Trace error')}
                  traceTooltip={userRoleText(dictionary, 'trace_error_tooltip', 'Open application logs to trace this error')}
                />
              )}

              <Stack
                component="form"
                spacing={2.25}
                onSubmit={event => {
                  event.preventDefault()
                  // Nut submit thuc su (type="submit") chi ton tai o buoc 2; Enter o buoc 1 duoc coi nhu bam "Tiep theo".
                  if (activeTab !== 1) {
                    goToPermissionStep()
                    return
                  }
                  void submit()
                }}
              >
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs
                    value={activeTab}
                    onChange={(_event, newValue: number) => setActiveTab(newValue)}
                    slotProps={{ indicator: { style: { backgroundColor: '#225087' } } }}
                  >
                    <Tab
                      label={userRoleText(dictionary, 'role_info_tab_label', 'Role Information')}
                      sx={{ color: '#225087', '&.Mui-selected': { color: '#225087', fontWeight: 'bold' } }}
                    />
                    <Tab
                      label={userRoleText(dictionary, 'permission_tab_label', 'Function Permissions')}
                      sx={{ color: '#225087', '&.Mui-selected': { color: '#225087', fontWeight: 'bold' } }}
                    />
                  </Tabs>
                </Box>

                <Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
                  <Stack spacing={2.25}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {userRoleText(dictionary, 'create_section_title', 'Role Information')}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          required
                          fullWidth
                          label={userRoleText(dictionary, 'field_role_name', 'Role Name')}
                          value={create.form.role_name}
                          onChange={event => create.updateField('role_name', event.target.value)}
                          error={Boolean(create.fieldErrors.role_name)}
                          helperText={create.fieldErrors.role_name}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          required
                          select
                          fullWidth
                          label={userRoleText(dictionary, 'field_service_id', 'Service')}
                          value={create.form.service_id}
                          onChange={event => create.updateField('service_id', event.target.value)}
                          error={Boolean(create.fieldErrors.service_id)}
                          helperText={create.fieldErrors.service_id}
                        >
                          {USER_ROLE_SERVICE_OPTIONS.map(code => (
                            <MenuItem key={code} value={code}>{getUserRoleApplicationDisplayName(dictionary, code)}</MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          multiline
                          minRows={3}
                          label={userRoleText(dictionary, 'field_role_description', 'Description')}
                          value={create.form.role_description}
                          onChange={event => create.updateField('role_description', event.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </Stack>
                </Box>

                <Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
                  <RoleInvokeApprovePanel dictionary={dictionary} permissions={permissions} />
                </Box>

                <Divider />

                {activeTab === 0 ? (
                  <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <Button variant="outlined" color="inherit" startIcon={<CancelOutlinedIcon />} onClick={backToList} disabled={create.saving}>
                      {userRoleText(dictionary, 'cancel', 'Cancel')}
                    </Button>
                    <Button type="submit" variant="contained" endIcon={<ArrowForwardIcon />} disabled={create.saving}>
                      {userRoleText(dictionary, 'next_step', 'Next')}
                    </Button>
                  </Stack>
                ) : (
                  <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <Button variant="outlined" color="inherit" startIcon={<ArrowBackIcon />} onClick={backToRoleInfoStep} disabled={create.saving}>
                      {userRoleText(dictionary, 'previous_step', 'Back')}
                    </Button>
                    <Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />} disabled={create.saving}>
                      {create.saving ? userRoleText(dictionary, 'creating', 'Creating...') : userRoleText(dictionary, 'add_role', 'Add Role')}
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Paper>
  )
}

export default UserRoleCreateContent
