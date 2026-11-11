'use client'

import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import EditRounded from '@mui/icons-material/EditRounded'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import RouteRounded from '@mui/icons-material/RouteRounded'
import SaveRounded from '@mui/icons-material/SaveRounded'
import SchemaRounded from '@mui/icons-material/SchemaRounded'
import VerifiedUserRounded from '@mui/icons-material/VerifiedUserRounded'
import {
  Alert,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
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
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@shared/hooks/useRouter'

import { useWorkingProjectIsSuperAdmin } from '@/@core/stores/useWorkingProjectStore'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import { useAppContext } from '@/shared/contexts/AppContext'
import { hasEffectiveScreenActionAccess } from '@/shared/utils/authorization'

import { useMenuCommandDelete } from '../hooks/useMenuCommandDelete'
import { useMenuCommandEdit } from '../hooks/useMenuCommandEdit'
import type { MenuCommandItem, MenuCommandWorkflowErrorInfo, MenuManagementPageProps } from '../types'
import {
  commonText,
  getBooleanDisplayLabel,
  getCommandTypeMeta,
  getGroupMenuVisibleMeta,
  getMenuCommandCaption,
  menuManagementText,
  resolveMenuCommandCaption,
  toMenuManagementPath
} from './menuCommandHelpers'
import MenuCommandDetailSection from './MenuCommandDetailSection'
import MenuCommandEditableField from './MenuCommandEditableField'
import MenuCommandIconPreview from './MenuCommandIconPreview'
import MenuCommandInfoItem from './MenuCommandInfoItem'
import MenuCommandLanguageCard from './MenuCommandLanguageCard'
import MenuCommandSummaryCard from './MenuCommandSummaryCard'

const MENU_MANAGEMENT_ROUTE = '/system-settings/menu-management'

type Props = MenuManagementPageProps & {
  item: MenuCommandItem | null
  error?: MenuCommandWorkflowErrorInfo | null
}

const MenuCommandDetailContent = ({ dictionary, session, locale, item: initialItem, error }: Props) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSuperAdmin = useWorkingProjectIsSuperAdmin()
  const { menuData } = useAppContext()
  const sessiontoken = session?.user?.token ?? undefined
  const edit = useMenuCommandEdit({
    dictionary,
    sessiontoken,
    language: locale,
    item: initialItem
  })
  const item = edit.item
  const isEditing = edit.editMode
  const form = edit.form
  const deleteState = useMenuCommandDelete({ dictionary, sessiontoken, locale, item })

  // Deny-by-default, same mechanism as every other screen's action gating (see
  // UserRolesContent's canModify/canCreate) — resolves against this screen's own route in the
  // WF_BO_LOAD_MENU-derived permission tree. Until an admin registers MODIFY/DELETE commands
  // under /system-settings/menu-management, only Super Admin sees these buttons; that's correct
  // deny-by-default behavior for a freshly added screen, not a bug.
  const canModify = hasEffectiveScreenActionAccess({ userCommand: menuData, route: MENU_MANAGEMENT_ROUTE, action: 'MODIFY', isSuperAdmin })
  const canDelete = hasEffectiveScreenActionAccess({ userCommand: menuData, route: MENU_MANAGEMENT_ROUTE, action: 'DELETE', isSuperAdmin })

  // The list now always opens detail in a new tab (see MenuManagementContent), so there is no
  // reliable "back" history entry to pop — instead rebuild the list URL from this page's own
  // query string, which already carries the search_text/page_index/page_size the list was on
  // when the row was double-clicked (see buildMenuCommandQueryString).
  const backToList = () => {
    router.push(toMenuManagementPath(locale, searchParams.toString()))
  }

  const typeMeta = item ? getCommandTypeMeta(dictionary, item.command_type) : null
  const visibleMeta = item ? getGroupMenuVisibleMeta(dictionary, item.group_menu_visible) : null
  const savedCaption = item ? getMenuCommandCaption(item, locale) : null
  const liveCaption = isEditing && form ? resolveMenuCommandCaption(form.languages, locale, form.command_name) : savedCaption
  const displayNames = isEditing && form ? form.languages : (item?.command_name_language_parsed ?? {})
  const isCommand = (isEditing && form ? form.command_type : item?.command_type) === 'C'

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Breadcrumbs sx={{ mb: 1 }}>
            <MuiLink component={NextLink} href={`/${locale}/system-settings`} underline="hover">
              {menuManagementText(dictionary, 'breadcrumb_system_settings', 'Thiết lập hệ thống')}
            </MuiLink>
            <MuiLink component={NextLink} href={toMenuManagementPath(locale)} underline="hover">
              {menuManagementText(dictionary, 'list_title', 'Quản lý Menu')}
            </MuiLink>
            <Typography color="text.primary">
              {menuManagementText(dictionary, 'detail_title', 'Chi tiết Menu / Tính năng')}
            </Typography>
          </Breadcrumbs>

          <Stack direction="row" gap={1.5} alignItems="flex-start">
            <SchemaRounded color="primary" sx={{ fontSize: 38, mt: 0.25 }} />
            <Stack>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {menuManagementText(dictionary, 'detail_title', 'Chi tiết Menu / Tính năng')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {menuManagementText(
                  dictionary,
                  'detail_subtitle',
                  'Xem thông tin chi tiết menu, tính năng và command/action.'
                )}
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} gap={1.5}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackRounded />}
            onClick={backToList}
            disabled={edit.saving || deleteState.deleting}
            sx={{ alignSelf: 'flex-start' }}
          >
            {menuManagementText(dictionary, 'back_to_list', 'Quay lại danh sách Quản lý Menu')}
          </Button>

          {item && !error && (
            isEditing ? (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<CloseRounded />}
                  onClick={edit.cancelEdit}
                  disabled={edit.saving}
                >
                  {commonText(dictionary, 'cancel', 'Hủy')}
                </Button>
                <Button
                  variant="contained"
                  startIcon={edit.saving ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />}
                  onClick={() => void edit.save()}
                  disabled={edit.saving}
                >
                  {edit.saving
                    ? menuManagementText(dictionary, 'saving', 'Đang lưu...')
                    : menuManagementText(dictionary, 'save_changes', 'Lưu thay đổi')}
                </Button>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1}>
                {canModify && (
                  <Button variant="contained" startIcon={<EditRounded />} onClick={edit.startEdit} disabled={deleteState.deleting}>
                    {menuManagementText(dictionary, 'change', 'Thay đổi')}
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={deleteState.deleting ? <CircularProgress size={16} color="error" /> : <DeleteOutlineRounded />}
                    onClick={() => void deleteState.confirmDelete()}
                    disabled={deleteState.deleting}
                  >
                    {deleteState.deleting
                      ? menuManagementText(dictionary, 'deleting', 'Đang xóa...')
                      : commonText(dictionary, 'delete', 'Xóa')}
                  </Button>
                )}
              </Stack>
            )
          )}
        </Stack>

        {error && (
          <WorkflowErrorAlert
            title={menuManagementText(dictionary, 'detail_error_title', 'Không thể tải thông tin menu/tính năng')}
            message={error.message}
            errorCode={error.workflowStep}
            errorCodeLabel={menuManagementText(dictionary, 'error_code_label', 'Mã lỗi')}
            executionId={error.executionId}
            referenceLabel={menuManagementText(dictionary, 'error_reference_label', 'Mã tra cứu lỗi')}
            copyLabel={menuManagementText(dictionary, 'copy_label', 'Sao chép')}
            copiedLabel={menuManagementText(dictionary, 'copied_label', 'Đã sao chép')}
            copySuccessMessage={menuManagementText(dictionary, 'copy_success', 'Đã sao chép mã tra cứu lỗi.')}
            copyFailedMessage={menuManagementText(dictionary, 'copy_failed', 'Không thể sao chép mã tra cứu lỗi.')}
            technicalDetails={error.technicalDetails}
            technicalDetailsLabel={menuManagementText(dictionary, 'technical_details', 'Chi tiết kỹ thuật')}
          />
        )}

        {!item ? (
          !error && (
            <Alert severity="info">
              {menuManagementText(dictionary, 'detail_not_found', 'Không tìm thấy thông tin menu/tính năng.')}
            </Alert>
          )
        ) : (
          <Stack spacing={2.5}>
            <MenuCommandSummaryCard
              dictionary={dictionary}
              caption={liveCaption ?? '-'}
              commandId={item.command_id}
              commandType={isEditing && form ? form.command_type : item.command_type}
              groupMenuVisible={isEditing && form ? (form.group_menu_visible ? '1' : '0') : item.group_menu_visible}
              actionCode={item.action_code}
              href={isEditing && form ? form.command_uri : item.href}
              icon={isEditing && form ? form.group_menu_icon : item.icon}
              editing={isEditing}
            />

            <MenuCommandDetailSection
              icon={<InfoOutlined color="primary" fontSize="small" />}
              title={menuManagementText(dictionary, 'section_basic', 'Thông tin cơ bản')}
            >
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <MenuCommandInfoItem label={menuManagementText(dictionary, 'field_command_id', 'Mã')} value={item.command_id} mono />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <MenuCommandInfoItem label={menuManagementText(dictionary, 'field_name', 'Tên menu / tính năng')} value={liveCaption} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <MenuCommandEditableField
                    label={menuManagementText(dictionary, 'field_label', 'Label hệ thống')}
                    editing={isEditing && Boolean(form)}
                    value={item.label}
                    input={form && (
                      <TextField
                        fullWidth
                        size="small"
                        value={form.command_name}
                        onChange={event => edit.updateField('command_name', event.target.value)}
                        error={Boolean(edit.fieldErrors.command_name)}
                        helperText={edit.fieldErrors.command_name}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <MenuCommandInfoItem label={menuManagementText(dictionary, 'field_command_type', 'Loại')}>
                    {isEditing && form ? (
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={form.command_type}
                        onChange={event => edit.updateField('command_type', event.target.value)}
                        error={Boolean(edit.fieldErrors.command_type)}
                        helperText={edit.fieldErrors.command_type}
                      >
                        <MenuItem value="M">{menuManagementText(dictionary, 'type_menu', 'Menu')}</MenuItem>
                        <MenuItem value="C">{menuManagementText(dictionary, 'type_command', 'Chức năng')}</MenuItem>
                      </TextField>
                    ) : (
                      typeMeta && <Chip size="small" color={typeMeta.color} label={typeMeta.label} />
                    )}
                  </MenuCommandInfoItem>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <MenuCommandEditableField
                    label={menuManagementText(dictionary, 'field_parent_id', 'Menu cha')}
                    editing={isEditing && Boolean(form)}
                    value={item.parent_id}
                    mono
                    input={form && (
                      <TextField
                        fullWidth
                        size="small"
                        value={form.parent_id}
                        onChange={event => edit.updateField('parent_id', event.target.value)}
                        sx={{ '& input': { fontFamily: 'monospace' } }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <MenuCommandEditableField
                    label={menuManagementText(dictionary, 'field_display_order', 'Thứ tự')}
                    editing={isEditing && Boolean(form)}
                    value={item.display_order ?? undefined}
                    input={form && (
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={form.display_order}
                        onChange={event => edit.updateField('display_order', event.target.value)}
                        error={Boolean(edit.fieldErrors.display_order)}
                        helperText={edit.fieldErrors.display_order}
                        slotProps={{ htmlInput: { step: 1 } }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <MenuCommandInfoItem label={menuManagementText(dictionary, 'field_icon', 'Icon')}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                      <MenuCommandIconPreview icon={isEditing && form ? form.group_menu_icon : item.icon} boxSize={30} iconSize={16} />
                      {isEditing && form ? (
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="ri-bar-chart-2-line"
                          value={form.group_menu_icon}
                          onChange={event => edit.updateField('group_menu_icon', event.target.value)}
                          sx={{ '& input': { fontFamily: 'monospace', fontSize: '0.85rem' } }}
                        />
                      ) : (
                        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.85rem', color: item.icon ? 'text.primary' : 'text.disabled' }}>
                          {item.icon || '—'}
                        </Typography>
                      )}
                    </Stack>
                  </MenuCommandInfoItem>
                </Grid>
              </Grid>
            </MenuCommandDetailSection>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <MenuCommandDetailSection
                  icon={<RouteRounded color="primary" fontSize="small" />}
                  title={menuManagementText(dictionary, 'section_navigation', 'Điều hướng & Hiển thị')}
                >
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12 }}>
                      <MenuCommandEditableField
                        label={menuManagementText(dictionary, 'field_href', 'Đường dẫn')}
                        editing={isEditing && Boolean(form)}
                        value={item.href}
                        mono
                        input={form && (
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="/api-manager/overview"
                            value={form.command_uri}
                            onChange={event => edit.updateField('command_uri', event.target.value)}
                            sx={{ '& input': { fontFamily: 'monospace' } }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <MenuCommandInfoItem label={menuManagementText(dictionary, 'field_prefix', 'Prefix')} value={item.prefix} mono />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <MenuCommandInfoItem label={menuManagementText(dictionary, 'field_group_menu_id', 'Group Menu ID')} value={item.group_menu_id} mono />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <MenuCommandEditableField
                        label={menuManagementText(dictionary, 'field_group_menu_list_authorize_form', 'Form phân quyền')}
                        editing={isEditing && Boolean(form)}
                        value={item.group_menu_list_authorize_form}
                        input={form && (
                          <TextField
                            fullWidth
                            size="small"
                            value={form.group_menu_list_authorize_form}
                            onChange={event => edit.updateField('group_menu_list_authorize_form', event.target.value)}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <MenuCommandInfoItem label={menuManagementText(dictionary, 'field_group_menu_visible_nav', 'Hiển thị trên menu')}>
                        {isEditing && form ? (
                          <FormControlLabel
                            sx={{ ml: 0 }}
                            control={
                              <Switch
                                checked={form.group_menu_visible}
                                onChange={event => edit.updateField('group_menu_visible', event.target.checked)}
                              />
                            }
                            label={form.group_menu_visible
                              ? menuManagementText(dictionary, 'header_visible_yes', 'Đang hiển thị')
                              : menuManagementText(dictionary, 'header_visible_no', 'Đang ẩn')}
                          />
                        ) : (
                          visibleMeta && <Chip size="small" color={visibleMeta.color} label={visibleMeta.label} />
                        )}
                      </MenuCommandInfoItem>
                    </Grid>
                  </Grid>
                </MenuCommandDetailSection>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <MenuCommandDetailSection
                  icon={<VerifiedUserRounded color={isCommand ? 'info' : 'primary'} fontSize="small" />}
                  title={menuManagementText(dictionary, 'section_permission', 'Quyền / Hành động')}
                  highlighted={isCommand}
                >
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <MenuCommandInfoItem label={menuManagementText(dictionary, 'field_action_code', 'Action Code')}>
                        {item.action_code
                          ? <Chip size="small" color="info" variant="outlined" label={item.action_code} sx={{ fontFamily: 'monospace', fontWeight: 700 }} />
                          : <Typography sx={{ color: 'text.disabled' }}>—</Typography>}
                      </MenuCommandInfoItem>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <MenuCommandEditableField
                        label={menuManagementText(dictionary, 'field_workflow_id', 'Workflow ID')}
                        editing={isEditing && Boolean(form)}
                        value={item.workflow_id}
                        mono
                        input={form && (
                          <TextField
                            fullWidth
                            size="small"
                            value={form.workflow_id}
                            onChange={event => edit.updateField('workflow_id', event.target.value)}
                            sx={{ '& input': { fontFamily: 'monospace' } }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <MenuCommandInfoItem label={menuManagementText(dictionary, 'field_invoke', 'Thực hiện')} value={getBooleanDisplayLabel(dictionary, item.invoke)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <MenuCommandInfoItem label={menuManagementText(dictionary, 'field_approve', 'Phê duyệt')} value={getBooleanDisplayLabel(dictionary, item.approve)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <MenuCommandInfoItem label={menuManagementText(dictionary, 'field_is_agreement', 'Agreement')} value={getBooleanDisplayLabel(dictionary, item.is_agreement)} />
                    </Grid>
                  </Grid>
                </MenuCommandDetailSection>
              </Grid>
            </Grid>

            <MenuCommandLanguageCard
              dictionary={dictionary}
              names={displayNames}
              editing={isEditing}
              onChange={edit.updateLanguageField}
            />
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}

export default MenuCommandDetailContent
