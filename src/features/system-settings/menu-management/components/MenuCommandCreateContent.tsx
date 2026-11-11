'use client'

import { useState } from 'react'

import AddRounded from '@mui/icons-material/AddRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import RouteRounded from '@mui/icons-material/RouteRounded'
import SchemaRounded from '@mui/icons-material/SchemaRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import VerifiedUserRounded from '@mui/icons-material/VerifiedUserRounded'
import {
  Alert,
  Autocomplete,
  Breadcrumbs,
  Button,
  CircularProgress,
  FormControlLabel,
  Grid,
  IconButton,
  Link as MuiLink,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import NextLink from 'next/link'
import { useRouter } from '@shared/hooks/useRouter'

import RemixIconPicker from '@/shared/components/icon-picker/RemixIconPicker'

import { useMenuCommandCreate } from '../hooks/useMenuCommandCreate'
import { useMenuTreeData } from '../hooks/useMenuTreeData'
import type { MenuManagementPageProps } from '../types'
import { commonText, menuManagementText, toMenuManagementPath } from './menuCommandHelpers'
import MenuCommandDetailSection from './MenuCommandDetailSection'
import MenuCommandIconPreview from './MenuCommandIconPreview'
import MenuCommandInfoItem from './MenuCommandInfoItem'
import MenuCommandLanguageCard from './MenuCommandLanguageCard'

type Props = MenuManagementPageProps

// Synthetic root option — "0" is the parent_id sentinel the backend (and the W4S menu-management
// module this screen mirrors) already uses for a root-level menu. It is never a real workflow row.
const ROOT_PARENT_ID = '0'

const MenuCommandCreateContent = ({ dictionary, session, locale }: Props) => {
  const router = useRouter()
  const sessiontoken = session?.user?.token ?? undefined
  const [iconPickerOpen, setIconPickerOpen] = useState(false)

  // Single fetch of the full BO menu/command tree — backs the parent-menu picker options, the
  // display_order suggestion, and the command_id suggestion (see useMenuCommandCreate), so
  // there's only ever one workflow round-trip per load/reload, not one per feature.
  const menuTree = useMenuTreeData({
    sessiontoken,
    language: locale,
    fallbackErrorMessage: menuManagementText(dictionary, 'field_parent_id_load_failed', 'Không thể tải danh sách menu cha.')
  })

  const create = useMenuCommandCreate({
    dictionary,
    sessiontoken,
    locale,
    menuTreeItems: menuTree.items,
    menuTreeLoading: menuTree.loading,
    reloadMenuTree: menuTree.reload
  })
  const { form } = create
  const isCommand = form.command_type === 'C'

  const rootParentOption = {
    command_id: ROOT_PARENT_ID,
    caption: menuManagementText(dictionary, 'parent_id_root_option', 'Menu gốc (không có cha)')
  }
  const allParentOptions = [rootParentOption, ...menuTree.options]
  const selectedParentOption = allParentOptions.find(option => option.command_id === form.parent_id) ?? null

  const cancel = () => router.push(toMenuManagementPath(locale))

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
              {menuManagementText(dictionary, 'create_breadcrumb', 'Thêm mới')}
            </Typography>
          </Breadcrumbs>

          <Stack direction="row" gap={1.5} alignItems="flex-start">
            <SchemaRounded color="primary" sx={{ fontSize: 38, mt: 0.25 }} />
            <Stack>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {menuManagementText(dictionary, 'create_title', 'Thêm mới Menu / Tính năng')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {menuManagementText(
                  dictionary,
                  'create_subtitle',
                  'Tạo mới menu, chức năng hoặc command/action cho hệ thống.'
                )}
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        <Stack spacing={2.5}>
          <MenuCommandDetailSection
            icon={<InfoOutlined color="primary" fontSize="small" />}
            title={menuManagementText(dictionary, 'section_basic', 'Thông tin cơ bản')}
          >
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <MenuCommandInfoItem label={menuManagementText(dictionary, 'field_command_id_create', 'Mã Menu / Tính năng')}>
                  <TextField
                    fullWidth
                    size="small"
                    value={menuTree.loading ? '' : form.command_id}
                    slotProps={{
                      input: {
                        readOnly: true,
                        endAdornment: menuTree.loading ? <CircularProgress size={16} /> : undefined
                      },
                      htmlInput: { 'aria-readonly': true }
                    }}
                    error={Boolean(create.fieldErrors.command_id)}
                    helperText={create.fieldErrors.command_id
                      ?? (menuTree.loading
                        ? menuManagementText(dictionary, 'field_command_id_generating', 'Đang tính mã tiếp theo...')
                        : menuManagementText(dictionary, 'field_command_id_helper', 'Mã được hệ thống tự sinh theo menu cha đã chọn.'))}
                    sx={{ '& input': { fontFamily: 'monospace' }, bgcolor: 'action.disabledBackground' }}
                  />
                </MenuCommandInfoItem>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <MenuCommandInfoItem label={menuManagementText(dictionary, 'field_command_name', 'Tên hệ thống')}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Custom Menu"
                    value={form.command_name}
                    onChange={event => create.updateField('command_name', event.target.value)}
                    onBlur={create.flushTranslate}
                    error={Boolean(create.fieldErrors.command_name)}
                    helperText={create.fieldErrors.command_name}
                    slotProps={{
                      input: {
                        endAdornment: create.translating ? <CircularProgress size={16} /> : undefined
                      }
                    }}
                  />
                </MenuCommandInfoItem>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <MenuCommandInfoItem label={menuManagementText(dictionary, 'field_command_type', 'Loại')}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={form.command_type}
                    onChange={event => create.updateField('command_type', event.target.value)}
                    error={Boolean(create.fieldErrors.command_type)}
                    helperText={create.fieldErrors.command_type}
                  >
                    <MenuItem value="M">{menuManagementText(dictionary, 'type_menu', 'Menu')}</MenuItem>
                    <MenuItem value="C">{menuManagementText(dictionary, 'type_command', 'Chức năng / Action')}</MenuItem>
                  </TextField>
                </MenuCommandInfoItem>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <MenuCommandInfoItem
                  label={isCommand
                    ? menuManagementText(dictionary, 'field_parent_id_command', 'Menu / Chức năng cha')
                    : menuManagementText(dictionary, 'field_parent_id', 'Menu cha')}
                >
                  <Stack sx={{ width: '100%' }} spacing={0.25}>
                    <Autocomplete
                      fullWidth
                      size="small"
                      options={allParentOptions}
                      loading={menuTree.loading}
                      value={selectedParentOption}
                      onChange={(_event, newValue) => create.updateField('parent_id', newValue?.command_id ?? '')}
                      getOptionLabel={option => (
                        option.command_id === ROOT_PARENT_ID ? option.caption : `${option.command_id} — ${option.caption}`
                      )}
                      isOptionEqualToValue={(option, current) => option.command_id === current.command_id}
                      noOptionsText={menuManagementText(dictionary, 'parent_id_no_options', 'Không có menu phù hợp')}
                      loadingText={menuManagementText(dictionary, 'parent_id_loading', 'Đang tải danh sách menu cha...')}
                      renderInput={params => (
                        <TextField
                          {...params}
                          placeholder={menuManagementText(dictionary, 'parent_id_placeholder', 'Tìm kiếm menu cha')}
                          error={Boolean(create.fieldErrors.parent_id) || Boolean(menuTree.error)}
                          helperText={create.fieldErrors.parent_id
                            ?? menuTree.error
                            ?? menuManagementText(dictionary, 'field_parent_id_helper', 'Chọn menu cha, hoặc chọn "Menu gốc" nếu đây là menu cấp gốc.')}
                          slotProps={{
                            input: {
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {menuTree.loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              )
                            }
                          }}
                        />
                      )}
                    />
                    {menuTree.error && (
                      <Button size="small" sx={{ alignSelf: 'flex-start', px: 0 }} onClick={() => void menuTree.reload()}>
                        {commonText(dictionary, 'retry', 'Thử lại')}
                      </Button>
                    )}
                  </Stack>
                </MenuCommandInfoItem>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <MenuCommandInfoItem label={menuManagementText(dictionary, 'field_display_order', 'Thứ tự')}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    value={form.display_order}
                    onChange={event => create.updateField('display_order', event.target.value)}
                    disabled={menuTree.loading}
                    error={Boolean(create.fieldErrors.display_order)}
                    helperText={create.fieldErrors.display_order
                      ?? (menuTree.loading
                        ? menuManagementText(dictionary, 'field_display_order_generating', 'Đang tính thứ tự tiếp theo...')
                        : menuManagementText(dictionary, 'field_display_order_helper', 'Hệ thống gợi ý dựa trên menu con hiện có, có thể chỉnh sửa lại.'))}
                    slotProps={{
                      htmlInput: { step: 1 },
                      input: { endAdornment: menuTree.loading ? <CircularProgress size={16} /> : undefined }
                    }}
                  />
                </MenuCommandInfoItem>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <MenuCommandInfoItem label={menuManagementText(dictionary, 'field_icon', 'Icon')}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                    <MenuCommandIconPreview icon={form.group_menu_icon} boxSize={30} iconSize={16} />
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="ri-bar-chart-2-line"
                      value={form.group_menu_icon}
                      onClick={() => setIconPickerOpen(true)}
                      sx={{
                        '& input': { fontFamily: 'monospace', fontSize: '0.85rem', cursor: 'pointer' }
                      }}
                      slotProps={{
                        input: {
                          readOnly: true,
                          endAdornment: (
                            <Stack direction="row" spacing={0.25}>
                              {form.group_menu_icon && (
                                <Tooltip title={menuManagementText(dictionary, 'field_icon_clear', 'Xóa icon')}>
                                  <IconButton
                                    size="small"
                                    onClick={event => {
                                      event.stopPropagation()
                                      create.updateField('group_menu_icon', '')
                                    }}
                                  >
                                    <CloseRounded fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title={menuManagementText(dictionary, 'field_icon_pick', 'Chọn icon')}>
                                <IconButton size="small" onClick={() => setIconPickerOpen(true)}>
                                  <SearchRounded fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          )
                        }
                      }}
                    />
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
                    <MenuCommandInfoItem label={menuManagementText(dictionary, 'field_href', 'Đường dẫn')}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="/custom-menu"
                        value={form.command_uri}
                        onChange={event => create.updateField('command_uri', event.target.value)}
                        sx={{ '& input': { fontFamily: 'monospace' } }}
                      />
                    </MenuCommandInfoItem>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <MenuCommandInfoItem label={menuManagementText(dictionary, 'field_group_menu_list_authorize_form', 'Form phân quyền')}>
                      <TextField
                        fullWidth
                        size="small"
                        value={form.group_menu_list_authorize_form}
                        onChange={event => create.updateField('group_menu_list_authorize_form', event.target.value)}
                      />
                    </MenuCommandInfoItem>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <MenuCommandInfoItem label={menuManagementText(dictionary, 'field_group_menu_visible_nav', 'Hiển thị trên menu')}>
                      <FormControlLabel
                        sx={{ ml: 0 }}
                        control={
                          <Switch
                            checked={form.group_menu_visible}
                            onChange={event => create.updateField('group_menu_visible', event.target.checked)}
                          />
                        }
                        label={form.group_menu_visible
                          ? menuManagementText(dictionary, 'header_visible_yes', 'Đang hiển thị')
                          : menuManagementText(dictionary, 'header_visible_no', 'Đang ẩn')}
                      />
                    </MenuCommandInfoItem>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <MenuCommandInfoItem label={menuManagementText(dictionary, 'field_enabled', 'Kích hoạt')}>
                      <FormControlLabel
                        sx={{ ml: 0 }}
                        control={
                          <Switch
                            checked={form.enabled}
                            onChange={event => create.updateField('enabled', event.target.checked)}
                          />
                        }
                        label={form.enabled
                          ? commonText(dictionary, 'boolean_yes', 'Có')
                          : commonText(dictionary, 'boolean_no', 'Không')}
                      />
                    </MenuCommandInfoItem>
                  </Grid>
                </Grid>
              </MenuCommandDetailSection>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <MenuCommandDetailSection
                icon={<VerifiedUserRounded color={isCommand ? 'info' : 'primary'} fontSize="small" />}
                title={menuManagementText(dictionary, 'section_permission_workflow', 'Quyền / Workflow')}
                highlighted={isCommand}
              >
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12 }}>
                    <MenuCommandInfoItem label={menuManagementText(dictionary, 'field_workflow_id', 'Workflow ID')}>
                      <TextField
                        fullWidth
                        size="small"
                        value={form.workflow_id}
                        onChange={event => create.updateField('workflow_id', event.target.value)}
                        helperText={menuManagementText(dictionary, 'field_workflow_id_helper', 'Để trống nếu không gắn với workflow nào.')}
                        sx={{ '& input': { fontFamily: 'monospace' } }}
                      />
                    </MenuCommandInfoItem>
                  </Grid>
                </Grid>
              </MenuCommandDetailSection>
            </Grid>
          </Grid>

          <Stack spacing={1}>
            <MenuCommandLanguageCard
              dictionary={dictionary}
              names={form.languages}
              editing
              onChange={(lang, value) => { if (lang !== 'la') create.updateLanguageField(lang, value) }}
              languages={['vi', 'en']}
            />
            {create.translateError && (
              <Alert severity="warning">{create.translateError}</Alert>
            )}
          </Stack>

          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button variant="outlined" color="inherit" startIcon={<CloseRounded />} onClick={cancel} disabled={create.saving}>
              {commonText(dictionary, 'cancel', 'Hủy')}
            </Button>
            <Button
              variant="contained"
              startIcon={create.saving ? <CircularProgress size={16} color="inherit" /> : <AddRounded />}
              onClick={() => void create.save()}
              disabled={create.saving}
            >
              {create.saving
                ? menuManagementText(dictionary, 'creating', 'Đang tạo...')
                : menuManagementText(dictionary, 'create_button', 'Tạo mới')}
            </Button>
          </Stack>
        </Stack>
      </Stack>

      <RemixIconPicker
        open={iconPickerOpen}
        onClose={() => setIconPickerOpen(false)}
        value={form.group_menu_icon}
        onSelect={icon => create.updateField('group_menu_icon', icon)}
        messages={{
          title: menuManagementText(dictionary, 'field_icon_pick', 'Chọn icon'),
          searchPlaceholder: menuManagementText(dictionary, 'field_icon_search_placeholder', 'Tìm icon theo tên...'),
          noResults: menuManagementText(dictionary, 'field_icon_no_results', 'Không tìm thấy icon phù hợp'),
          clearIcon: menuManagementText(dictionary, 'field_icon_clear', 'Xóa icon'),
          matchingCount: count => menuManagementText(dictionary, 'field_icon_matching_count', '{count} icon phù hợp').replace('{count}', count.toLocaleString())
        }}
      />
    </Paper>
  )
}

export default MenuCommandCreateContent
