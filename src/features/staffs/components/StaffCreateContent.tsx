'use client'

import { useEffect, useState } from 'react'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import GroupIcon from '@mui/icons-material/Group'
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import {
    Alert,
    Breadcrumbs,
    Button,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    Link as MuiLink,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography
} from '@mui/material'
import NextLink from 'next/link'
import { useSearchParams } from 'next/navigation'

import { useWorkingProject, useWorkingProjectIsSuperAdmin } from '@/@core/stores/useWorkingProjectStore'
import type { Locale } from '@/configs/i18n'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import { useRouter } from '@shared/hooks/useRouter'
import SwalAlert from '@/shared/utils/SwalAlert'
import type { Session } from 'next-auth'

import { useStaffCreate } from '../hooks/useStaffCreate'
import type { StaffDictionary } from '../types'
import { normalizeStaffGender } from '../utils/staffGender'
import { department_options } from '../constants/departmentOptions'
import ProjectMultiSelectPicker from './staff-create/ProjectMultiSelectPicker'
import RoleAssignmentPicker from './staff-create/RoleAssignmentPicker'
import StaffCreateSuccessDialog from './staff-list/StaffCreateSuccessDialog'
import { commonText, gender_options, getStaffGenderLabel, staffText } from './staff-list/staffListHelpers'
import { getStaffBulkImportHref } from '../utils/staffRoutes'

type Props = {
    dictionary: StaffDictionary
    session: Session | null
    locale: Locale
    route_base?: string
}

const StaffCreateContent = ({ dictionary, session, locale, route_base = '/users/staffs' }: Props) => {
    const router = useRouter()
    const search_params = useSearchParams()
    const list_query = search_params.toString()
    const list_href = `/${locale}${route_base}${list_query ? `?${list_query}` : ''}`
    const sessiontoken = session?.user?.token ?? undefined
    const isSuperAdmin = useWorkingProjectIsSuperAdmin()
    const working_project = useWorkingProject()
    const working_project_code = working_project?.code ?? ''
    const [show_password, setShowPassword] = useState(false)
    const [show_confirm_password, setShowConfirmPassword] = useState(false)

    const create = useStaffCreate({ dictionary, sessiontoken, language: locale })

    const handleCopyPassword = async () => {
        if (!create.form_values.password) return

        await navigator.clipboard.writeText(create.form_values.password)
        SwalAlert('success', staffText(dictionary, 'copy_success', 'Copied.'), 'center')
    }

    useEffect(() => {
        if (!working_project_code || !working_project) return

        create.seedWorkingProject({ id: working_project.id, project_code: working_project.code, project_name: working_project.name })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [working_project_code])

    const backToList = () => router.push(list_href)
    const openCreateMultiple = () => router.push(getStaffBulkImportHref(locale, route_base, list_query))

    const handleSubmit = async () => {
        await create.handleCreate()
    }

    const handleSuccessClose = () => {
        const usercode = create.success_data?.userCode

        router.push(usercode ? `/${locale}${route_base}/${encodeURIComponent(usercode)}` : list_href)
        router.refresh()
    }

    const listBody = (
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
            <Stack spacing={3}>
                <Stack spacing={1}>
                    <Breadcrumbs sx={{ mb: 1 }}>
                        <MuiLink component={NextLink} href={list_href} underline="hover">
                            {staffText(dictionary, 'breadcrumb_staffs', 'Staffs')}
                        </MuiLink>
                        <Typography color="text.primary">{staffText(dictionary, 'breadcrumb_create', 'Create user')}</Typography>
                    </Breadcrumbs>

                    <Stack direction="row" gap={1.5} alignItems="flex-start">
                        <GroupIcon color="primary" sx={{ fontSize: 38, mt: 0.25 }} />
                        <Stack>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                {staffText(dictionary, 'create_title', 'Create user')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {staffText(dictionary, 'create_subtitle', 'Enter account and staff profile information.')}
                            </Typography>
                        </Stack>
                    </Stack>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignSelf="flex-start">
                    <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={backToList}>
                        {staffText(dictionary, 'back_to_list', 'Back to staff list')}
                    </Button>
                    {isSuperAdmin && (
                        <Button variant="outlined" startIcon={<GroupAddOutlinedIcon />} onClick={openCreateMultiple}>
                            {staffText(dictionary, 'action_create_multiple', 'Add multiple users')}
                        </Button>
                    )}
                </Stack>

                {!isSuperAdmin ? (
                    <Alert severity="warning">
                        {staffText(dictionary, 'create_forbidden', 'You do not have permission to create a new staff account.')}
                    </Alert>
                ) : (
                    <Stack
                        component="form"
                        spacing={3}
                        onSubmit={event => {
                            event.preventDefault()
                            void handleSubmit()
                        }}
                    >
                        {create.create_error && <Alert severity="error">{create.create_error}</Alert>}

                        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
                            <Stack spacing={2.25}>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                    {staffText(dictionary, 'create_section_login', 'Login information')}
                                </Typography>
                                <TextField
                                    fullWidth
                                    required
                                    label={staffText(dictionary, 'field_username', 'Username')}
                                    value={create.form_values.login_name}
                                    error={Boolean(create.form_errors.login_name)}
                                    helperText={create.form_errors.login_name}
                                    onChange={event => create.updateForm('login_name', event.target.value)}
                                />
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            required
                                            type={show_password ? 'text' : 'password'}
                                            autoComplete="new-password"
                                            label={staffText(dictionary, 'field_password', 'Password')}
                                            value={create.form_values.password}
                                            error={Boolean(create.form_errors.password)}
                                            helperText={create.form_errors.password || staffText(dictionary, 'password_hint', 'At least 8 characters.')}
                                            onChange={event => create.updateForm('password', event.target.value)}
                                            slotProps={{
                                                input: {
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                aria-label={staffText(dictionary, 'toggle_password_visibility', 'Toggle password visibility')}
                                                                onClick={() => setShowPassword(current => !current)}
                                                                edge="end"
                                                            >
                                                                {show_password ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    )
                                                }
                                            }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            required
                                            type={show_confirm_password ? 'text' : 'password'}
                                            autoComplete="new-password"
                                            label={staffText(dictionary, 'field_confirm_password', 'Confirm password')}
                                            value={create.confirm_password}
                                            error={Boolean(create.form_errors.confirm_password)}
                                            helperText={create.form_errors.confirm_password}
                                            onChange={event => create.updateConfirmPassword(event.target.value)}
                                            slotProps={{
                                                input: {
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                aria-label={staffText(dictionary, 'toggle_password_visibility', 'Toggle password visibility')}
                                                                onClick={() => setShowConfirmPassword(current => !current)}
                                                                edge="end"
                                                            >
                                                                {show_confirm_password ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    )
                                                }
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<AutorenewIcon />}
                                        onClick={() => {
                                            create.generatePassword()
                                            setShowPassword(true)
                                            setShowConfirmPassword(true)
                                        }}
                                    >
                                        {staffText(dictionary, 'generate_password_button', 'Generate password')}
                                    </Button>
                                    <Button
                                        variant="text"
                                        size="small"
                                        startIcon={<ContentCopyIcon />}
                                        disabled={!create.form_values.password}
                                        onClick={() => void handleCopyPassword()}
                                    >
                                        {staffText(dictionary, 'copy_password', 'Copy password')}
                                    </Button>
                                </Stack>
                            </Stack>
                        </Paper>

                        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
                            <Stack spacing={2.25}>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                    {staffText(dictionary, 'create_section_personal', 'Personal information')}
                                </Typography>
                                <TextField
                                    fullWidth
                                    required
                                    label={staffText(dictionary, 'field_full_name', 'Full name')}
                                    value={create.form_values.full_name}
                                    error={Boolean(create.form_errors.full_name)}
                                    helperText={create.form_errors.full_name}
                                    onChange={event => create.updateForm('full_name', event.target.value)}
                                />
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField fullWidth label={staffText(dictionary, 'field_email', 'Email')} value={create.form_values.email} onChange={event => create.updateForm('email', event.target.value)} />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField fullWidth label={staffText(dictionary, 'field_phone', 'Phone')} value={create.form_values.phone} onChange={event => create.updateForm('phone', event.target.value)} />
                                    </Grid>
                                </Grid>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField fullWidth required select label={staffText(dictionary, 'field_gender', 'Gender')} value={create.form_values.gender} error={Boolean(create.form_errors.gender)} helperText={create.form_errors.gender} onChange={event => create.updateForm('gender', normalizeStaffGender(event.target.value))} slotProps={{ inputLabel: { shrink: true } }}>
                                            <MenuItem value="">{staffText(dictionary, 'not_selected', 'Not selected')}</MenuItem>
                                            {gender_options.map(option => <MenuItem key={option} value={option}>{getStaffGenderLabel(dictionary, option)}</MenuItem>)}
                                        </TextField>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField fullWidth type="date" label={staffText(dictionary, 'field_birthday', 'Birthday')} value={create.form_values.birthday} onChange={event => create.updateForm('birthday', event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                                    </Grid>
                                </Grid>
                                <TextField fullWidth label={staffText(dictionary, 'field_address', 'Address')} value={create.form_values.address} onChange={event => create.updateForm('address', event.target.value)} />
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            select
                                            label={staffText(dictionary, 'field_department', 'Department')}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                            value={create.form_values.department_code}
                                            onChange={event => create.updateForm('department_code', event.target.value)}
                                        >
                                            {department_options.map(option => (
                                                <MenuItem key={option.department_code} value={option.department_code}>
                                                    {option.department_name}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                </Grid>
                                <TextField
                                    fullWidth
                                    multiline
                                    minRows={2}
                                    label={staffText(dictionary, 'field_description', 'Description')}
                                    value={create.form_values.description}
                                    onChange={event => create.updateForm('description', event.target.value)}
                                />
                            </Stack>
                        </Paper>

                        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
                            <Stack spacing={2.25}>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                    {staffText(dictionary, 'create_section_project', 'Project')}
                                </Typography>
                                {create.form_errors.projects && <Alert severity="error">{create.form_errors.projects}</Alert>}
                                <ProjectMultiSelectPicker dictionary={dictionary} picker={create.project_picker} />
                            </Stack>
                        </Paper>

                        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
                            <Stack spacing={2.25}>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                    {staffText(dictionary, 'create_section_permission', 'Permission')}
                                </Typography>
                                <RoleAssignmentPicker dictionary={dictionary} picker={create.role_picker} />
                            </Stack>
                        </Paper>

                        <Divider />

                        <Stack direction="row" justifyContent="flex-end" spacing={1}>
                            <Button variant="outlined" color="inherit" startIcon={<CancelOutlinedIcon />} onClick={backToList} disabled={create.saving}>
                                {commonText(dictionary, 'cancel', 'Cancel')}
                            </Button>
                            <Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />} disabled={create.saving}>
                                {create.saving ? commonText(dictionary, 'processing', 'Processing...') : staffText(dictionary, 'create_submit_button', 'Create staff')}
                            </Button>
                        </Stack>
                    </Stack>
                )}
            </Stack>
        </Paper>
    )

    return (
        <>
            <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
                {listBody}
            </RequireWorkingProject>

            <StaffCreateSuccessDialog
                dictionary={dictionary}
                data={create.success_data}
                on_close={handleSuccessClose}
            />
        </>
    )
}

export default StaffCreateContent
