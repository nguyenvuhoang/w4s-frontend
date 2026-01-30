'use client'

import { useState, useEffect, useMemo } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    MenuItem as MuiMenuItem,
    Box,
    IconButton,
    Tabs,
    Tab,
    Switch,
    FormControlLabel,
    Typography,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Paper
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SaveIcon from '@mui/icons-material/Save'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { Controller, useForm } from 'react-hook-form'
import { MenuItem } from '@shared/types/systemTypes'
import type { Locale } from '@configs/i18n'
import { getDictionary } from '@utils/getDictionary'

type MenuFormData = {
    application_code: string
    command_id: string
    parent_id: string
    command_name: string
    command_name_en: string
    command_name_vi: string
    command_name_language: string
    command_type: string
    command_uri: string
    enabled: boolean
    is_visible: boolean
    display_order: number
    group_menu_icon: string
    group_menu_visible: string
    group_menu_list_authorize_form: string
}

type Props = {
    open: boolean
    onClose: () => void
    onSubmit: (data: MenuFormData) => void
    locale: Locale
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    menuItems: MenuItem[]
    applicationCodes: string[]
    editData: MenuItem | null
    loading?: boolean
    error?: string | null
    isSuccess?: boolean
    submittedData?: MenuFormData | null
    onClearError?: () => void
}

export const MenuEditModal = ({
    open,
    onClose,
    onSubmit,
    locale,
    dictionary,
    menuItems,
    applicationCodes,
    editData,
    loading = false,
    error = null,
    isSuccess = false,
    submittedData = null,
    onClearError
}: Props) => {
    const [currentTab, setCurrentTab] = useState(0)

    // Parse command_name_language from editData
    const parsedLanguageNames = useMemo(() => {
        if (!editData?.command_name_language) return { en: '', vi: '' }
        try {
            return JSON.parse(editData.command_name_language)
        } catch {
            return { en: editData.command_name, vi: editData.command_name }
        }
    }, [editData])

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<MenuFormData>({
        defaultValues: {
            application_code: editData?.application_code || '',
            command_id: editData?.command_id || '',
            parent_id: editData?.parent_id || '0',
            command_name: editData?.command_name || '',
            command_name_en: parsedLanguageNames.en,
            command_name_vi: parsedLanguageNames.vi,
            command_name_language: editData?.command_name_language || '',
            command_type: editData?.command_type || 'M',
            command_uri: editData?.command_uri || '',
            enabled: editData?.enable ?? true,
            is_visible: editData?.is_visible ?? true,
            display_order: editData?.display_order || 0,
            group_menu_icon: editData?.group_menu_icon || '',
            group_menu_visible: editData?.group_menu_visible || '1',
            group_menu_list_authorize_form: editData?.group_menu_list_authorize_form || ''
        }
    })

    // Update form when editData changes
    useEffect(() => {
        if (editData) {
            const parsed = parsedLanguageNames
            reset({
                application_code: editData.application_code,
                command_id: editData.command_id,
                parent_id: editData.parent_id || '0',
                command_name: editData.command_name,
                command_name_en: parsed.en,
                command_name_vi: parsed.vi,
                command_name_language: editData.command_name_language,
                command_type: editData.command_type,
                command_uri: editData.command_uri || '',
                enabled: editData.enable ?? true,
                is_visible: editData.is_visible ?? true,
                display_order: editData.display_order,
                group_menu_icon: editData.group_menu_icon || '',
                group_menu_visible: editData.group_menu_visible || '1',
                group_menu_list_authorize_form: editData.group_menu_list_authorize_form || ''
            })
        }
    }, [editData, reset, parsedLanguageNames])

    const handleFormSubmit = (data: MenuFormData) => {
        onSubmit(data)
    }

    const handleClose = () => {
        if (!loading) {
            reset()
            setCurrentTab(0)
            onClose()
            if (onClearError) onClearError()
        }
    }

    // Parent menu options (only M and T types can be parents)
    const parentOptions = useMemo(() => {
        const parents = menuItems
            .filter(item => item.command_type === 'M' || item.command_type === 'T')
            .filter(item => item.command_id !== editData?.command_id) // Exclude self
        return [
            { command_id: '0', command_name: dictionary['common']?.none || 'None' },
            ...parents
        ]
    }, [menuItems, dictionary, editData])

    // Command type options
    const commandTypeOptions = [
        { value: 'M', label: 'Menu (M)' },
        { value: 'C', label: 'Command (Button) (C)' },
        { value: 'T', label: 'Transaction (T)' },
        { value: 'S', label: 'System (S)' }
    ]

    const renderSuccessScreen = () => (
        <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: '#4caf50', mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: '#225087' }}>
                {dictionary['common']?.success || 'Success!'}
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: '#666' }}>
                {dictionary['menumanagement']?.menu_updated_successfully || 'Menu has been updated successfully'}
            </Typography>

            {submittedData && (
                <TableContainer component={Paper} sx={{ maxWidth: 600, mx: 'auto', boxShadow: 2 }}>
                    <Table size="small">
                        <TableBody>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>
                                    {dictionary['menumanagement']?.command_id || 'Command ID'}
                                </TableCell>
                                <TableCell>{submittedData.command_id}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>
                                    {dictionary['menumanagement']?.command_name || 'Command Name'}
                                </TableCell>
                                <TableCell>{submittedData.command_name}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>
                                    {dictionary['menumanagement']?.application_code || 'Application'}
                                </TableCell>
                                <TableCell>{submittedData.application_code}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>
                                    {dictionary['menumanagement']?.command_type || 'Type'}
                                </TableCell>
                                <TableCell>{submittedData.command_type}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Box sx={{ mt: 4 }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleClose}
                    size="large"
                >
                    {dictionary['common']?.close || 'Close'}
                </Button>
            </Box>
        </Box>
    )

    if (isSuccess) {
        return (
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle
                    sx={{
                        backgroundColor: '#225087',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '1.25rem',
                        py: 2
                    }}
                >
                    {dictionary['menumanagement']?.edit_menu || 'Edit Menu'}
                </DialogTitle>
                <DialogContent>{renderSuccessScreen()}</DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle
                sx={{
                    backgroundColor: '#225087',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 2
                }}
            >
                <Box display="flex" alignItems="center">
                    <SaveIcon sx={{ mr: 1 }} />
                    {dictionary['menumanagement']?.edit_menu || 'Edit Menu'}
                </Box>
                <IconButton onClick={handleClose} sx={{ color: 'white' }} disabled={loading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit(handleFormSubmit)}>
                <DialogContent>
                    {error && (
                        <Alert
                            severity="error"
                            sx={{ mb: 3 }}
                            onClose={onClearError}
                        >
                            {error}
                        </Alert>
                    )}

                    <Grid container spacing={3}>
                        {/* Application Code */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="application_code"
                                control={control}
                                rules={{ required: dictionary['common']?.required || 'Required' }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        select
                                        label={dictionary['menumanagement']?.application_code || 'Application Code'}
                                        error={!!errors.application_code}
                                        helperText={errors.application_code?.message}
                                        required
                                        value={field.value || ''}
                                        disabled={loading}
                                    >
                                        {applicationCodes.map(code => (
                                            <MuiMenuItem key={code} value={code}>
                                                {code}
                                            </MuiMenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                        </Grid>

                        {/* Command ID - Read only for edit */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="command_id"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label={dictionary['menumanagement']?.command_id || 'Command ID'}
                                        slotProps={{ input: { readOnly: true } }}
                                        disabled
                                        value={field.value || ''}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Parent ID */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="parent_id"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        select
                                        label={dictionary['menumanagement']?.parent_id || 'Parent Menu'}
                                        value={field.value || '0'}
                                        disabled={loading}
                                    >
                                        {parentOptions.map(parent => (
                                            <MuiMenuItem key={parent.command_id} value={parent.command_id}>
                                                {parent.command_name}
                                            </MuiMenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                        </Grid>

                        {/* Command Type */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="command_type"
                                control={control}
                                rules={{ required: dictionary['common']?.required || 'Required' }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        select
                                        label={dictionary['menumanagement']?.command_type || 'Command Type'}
                                        error={!!errors.command_type}
                                        helperText={errors.command_type?.message}
                                        required
                                        value={field.value || ''}
                                        disabled={loading}
                                    >
                                        {commandTypeOptions.map(option => (
                                            <MuiMenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MuiMenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                        </Grid>

                        {/* Command Name with Tabs */}
                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                                <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
                                    <Tab label={dictionary['common']?.english || 'English'} />
                                    <Tab label={dictionary['common']?.vietnamese || 'Vietnamese'} />
                                </Tabs>
                            </Box>

                            {currentTab === 0 && (
                                <Controller
                                    name="command_name_en"
                                    control={control}
                                    rules={{ required: dictionary['common']?.required || 'Required' }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label={dictionary['common']?.english || 'English Name'}
                                            error={!!errors.command_name_en}
                                            helperText={errors.command_name_en?.message}
                                            required
                                            value={field.value || ''}
                                            disabled={loading}
                                        />
                                    )}
                                />
                            )}

                            {currentTab === 1 && (
                                <Controller
                                    name="command_name_vi"
                                    control={control}
                                    rules={{ required: dictionary['common']?.required || 'Required' }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label={dictionary['common']?.vietnamese || 'Vietnamese Name'}
                                            error={!!errors.command_name_vi}
                                            helperText={errors.command_name_vi?.message}
                                            required
                                            value={field.value || ''}
                                            disabled={loading}
                                        />
                                    )}
                                />
                            )}
                        </Grid>

                        {/* Command URI */}
                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="command_uri"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label={dictionary['menumanagement']?.command_uri || 'Command URI'}
                                        value={field.value || ''}
                                        disabled={loading}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Display Order */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="display_order"
                                control={control}
                                rules={{
                                    required: dictionary['common']?.required || 'Required',
                                    min: { value: 0, message: 'Must be >= 0' }
                                }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        type="number"
                                        label={dictionary['menumanagement']?.display_order || 'Display Order'}
                                        error={!!errors.display_order}
                                        helperText={errors.display_order?.message}
                                        required
                                        value={field.value ?? 0}
                                        disabled={loading}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Group Menu Icon */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="group_menu_icon"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label={dictionary['menumanagement']?.group_menu_icon || 'Group Menu Icon'}
                                        value={field.value || ''}
                                        disabled={loading}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Switches */}
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Controller
                                name="enabled"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={field.value}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                                disabled={loading}
                                            />
                                        }
                                        label={dictionary['menumanagement']?.enabled || 'Enabled'}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Controller
                                name="is_visible"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={field.value}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                                disabled={loading}
                                            />
                                        }
                                        label={dictionary['menumanagement']?.is_visible || 'Visible'}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Group Menu Visible */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="group_menu_visible"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label={dictionary['menumanagement']?.group_menu_visible || 'Group Menu Visible'}
                                        value={field.value || ''}
                                        disabled={loading}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Authorize Forms */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="group_menu_list_authorize_form"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label={dictionary['menumanagement']?.group_menu_list_authorize_form || 'Authorize Forms'}
                                        value={field.value || ''}
                                        disabled={loading}
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 3 }}>
                    <Button
                        onClick={() => reset()}
                        disabled={loading}
                        variant='outlined'
                        color="warning"
                        startIcon={<RestartAltIcon />}
                    >
                        {dictionary['common']?.reset || 'Reset'}
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        startIcon={<SaveIcon />}
                    >
                        {loading ? (dictionary['common']?.saving || 'Saving...') : (dictionary['common']?.save || 'Save')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}

