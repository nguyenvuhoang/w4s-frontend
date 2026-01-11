'use client'

import { useState, useEffect } from 'react'
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
import * as MuiIcons from '@mui/icons-material'
import { Controller, useForm } from 'react-hook-form'
import { MenuItem } from '@/types/systemTypes'
import { IconPicker } from '@/components/IconPicker'
import type { Locale } from '@configs/i18n'
import { getDictionary } from '@/utils/getDictionary'
import { systemServiceApi } from '@/servers/system-service'
import { Session } from 'next-auth'
import { isValidResponse } from '@/utils/isValidResponse'

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
    loading?: boolean
    error?: string | null
    isSuccess?: boolean
    submittedData?: MenuFormData | null
    onClearError?: () => void
}

export const MenuFormModal = ({
    open,
    onClose,
    onSubmit,
    locale,
    dictionary,
    menuItems,
    applicationCodes,
    loading = false,
    error = null,
    isSuccess = false,
    submittedData = null,
    onClearError
}: Props) => {
    const [currentTab, setCurrentTab] = useState(0)
    const [isTranslating, setIsTranslating] = useState(false)
    const [iconPickerOpen, setIconPickerOpen] = useState(false)

    const {
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors }
    } = useForm<MenuFormData>({
        defaultValues: {
            application_code: applicationCodes[0] || '',
            command_id: '',
            parent_id: '0',
            command_name: '',
            command_name_en: '',
            command_name_vi: '',
            command_name_language: '',
            command_type: 'M',
            command_uri: '',
            enabled: true,
            is_visible: true,
            display_order: 1,
            group_menu_icon: '',
            group_menu_visible: '1',
            group_menu_list_authorize_form: ''
        }
    })

    const commandName = watch('command_name')

    // Function to detect if text is Vietnamese
    const isVietnamese = (text: string): boolean => {
        const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/
        return vietnameseChars.test(text)
    }

    // Function to translate text using Google Translate API
    const translateText = async (text: string, targetLang: string): Promise<string> => {
        try {
            const response = await fetch(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
            )
            const data = await response.json()
            return data[0][0][0] || text
        } catch (error) {
            console.error('Translation error:', error)
            return text
        }
    }

    // Auto-fill and translate when command_name changes
    useEffect(() => {
        const autoFillTranslations = async () => {
            if (!commandName || commandName.trim() === '' || isTranslating) return

            setIsTranslating(true)

            try {
                const isVi = isVietnamese(commandName)

                if (isVi) {
                    // Vietnamese input -> set to command_name_vi and translate to English
                    setValue('command_name_vi', commandName)
                    const translatedEn = await translateText(commandName, 'en')
                    setValue('command_name_en', translatedEn)
                } else {
                    // English input -> set to command_name_en and translate to Vietnamese
                    setValue('command_name_en', commandName)
                    const translatedVi = await translateText(commandName, 'vi')
                    setValue('command_name_vi', translatedVi)
                }
            } catch (error) {
                console.error('Auto-fill error:', error)
            } finally {
                setIsTranslating(false)
            }
        }

        const timeoutId = setTimeout(() => {
            autoFillTranslations()
        }, 500) // Debounce 500ms

        return () => clearTimeout(timeoutId)
    }, [commandName, setValue, isTranslating])

    const handleClose = () => {
        reset()
        setCurrentTab(0)
        onClearError?.()
        onClose()
    }

    const handleFormSubmit = (data: MenuFormData) => {
        // Chỉ pass data ra ngoài, parent sẽ handle API call
        onSubmit(data)
    }

    // Filter parent menu items (only M and T types can be parents)
    const parentMenuOptions = menuItems.filter(
        item => item.command_type === 'M' || item.command_type === 'T'
    )

    const commandTypeOptions = [
        { value: 'M', label: 'Menu (M)' },
        { value: 'C', label: 'Command / Button (C)' },
        { value: 'T', label: 'Transaction (T)' },
        { value: 'S', label: 'System (S)' }
    ]

    const getCommandTypeLabel = (type: string) => {
        return commandTypeOptions.find(opt => opt.value === type)?.label || type
    }

    const renderSuccessScreen = () => {
        if (!submittedData) return null

        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <MuiIcons.CheckCircle sx={{ fontSize: 80, color: '#4caf50', mb: 2 }} />
                <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: '#4caf50' }}>
                    {dictionary['common']?.success || 'Success!'}
                </Typography>
                <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                    {dictionary['menumanagement']?.menu_created_successfully || 'Menu has been created successfully!'}
                </Typography>

                <TableContainer component={Paper} sx={{ maxWidth: 600, mx: 'auto', boxShadow: 2 }}>
                    <Table size="small">
                        <TableBody>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5', width: '40%' }}>
                                    {dictionary['menumanagement']?.command_id || 'Command ID'}
                                </TableCell>
                                <TableCell>{submittedData.command_id}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>
                                    {dictionary['menumanagement']?.command_name || 'Menu Name'}
                                </TableCell>
                                <TableCell>{submittedData.command_name}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>
                                    {dictionary['menumanagement']?.parent_id || 'Parent ID'}
                                </TableCell>
                                <TableCell>{submittedData.parent_id === '0' ? 'Root' : submittedData.parent_id}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>
                                    {dictionary['menumanagement']?.command_type || 'Command Type'}
                                </TableCell>
                                <TableCell>{getCommandTypeLabel(submittedData.command_type)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>
                                    {dictionary['menumanagement']?.application_code || 'Application'}
                                </TableCell>
                                <TableCell>{submittedData.application_code}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>
                                    {dictionary['menumanagement']?.command_uri || 'Command URI'}
                                </TableCell>
                                <TableCell>{submittedData.command_uri || '-'}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>
                                    {dictionary['menumanagement']?.display_order || 'Display Order'}
                                </TableCell>
                                <TableCell>{submittedData.display_order}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>
                                    {dictionary['menumanagement']?.is_visible || 'Visible'}
                                </TableCell>
                                <TableCell>{submittedData.is_visible ? 'Yes' : 'No'}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ mt: 4 }}>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleClose}
                    >
                        {dictionary['common']?.close || 'Close'}
                    </Button>
                </Box>
            </Box>
        )
    }

    return (
        <Dialog
            open={open}
            onClose={(_, reason) => {
                if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
                    return
                }
                handleClose()
            }}
            maxWidth="md"
            fullWidth
            disableEscapeKeyDown
        >
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', py: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                        {dictionary['menumanagement']?.add_menu || 'Add New Menu'}
                    </Typography>
                    <IconButton onClick={handleClose} size="small" sx={{ color: 'white' }}>
                        <MuiIcons.Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <form onSubmit={handleSubmit(handleFormSubmit)}>
                <DialogContent dividers>
                    {isSuccess ? (
                        renderSuccessScreen()
                    ) : (
                        <>
                            {error && (
                                <Alert severity="error" sx={{ mb: 3 }} onClose={onClearError}>
                                    {error}
                                </Alert>
                            )}
                            <Grid container spacing={3}>
                                {/* Command ID */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Controller
                                        name="command_id"
                                        control={control}
                                        rules={{
                                            required: dictionary['common']?.required || 'Required',
                                            pattern: {
                                                value: /^\d+$/,
                                                message: 'Only numbers allowed'
                                            }
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label={`${dictionary['menumanagement']?.command_id || 'Command ID'} *`}
                                                error={!!errors.command_id}
                                                helperText={errors.command_id?.message}
                                                placeholder="e.g., 001"
                                                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                                            />
                                        )}
                                    />
                                </Grid>

                                {/* Display Order */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Controller
                                        name="display_order"
                                        control={control}
                                        rules={{ required: dictionary['common']?.required || 'Required' }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                type="number"
                                                label={`${dictionary['menumanagement']?.display_order || 'Display Order'} *`}
                                                error={!!errors.display_order}
                                                helperText={errors.display_order?.message}
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
                                            >
                                                <MuiMenuItem value="0">
                                                    {dictionary['common']?.root || 'Root (No Parent)'}
                                                </MuiMenuItem>
                                                {parentMenuOptions.map(item => (
                                                    <MuiMenuItem key={item.command_id} value={item.command_id}>
                                                        {item.command_id} - {item.command_name}
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
                                                label={`${dictionary['menumanagement']?.command_type || 'Command Type'} *`}
                                                error={!!errors.command_type}
                                                helperText={errors.command_type?.message}
                                                value={field.value || 'M'}
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

                                {/* Command Name (Default) */}
                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="command_name"
                                        control={control}
                                        rules={{ required: dictionary['common']?.required || 'Required' }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label={`${dictionary['menumanagement']?.command_name || 'Menu Name'} *`}
                                                error={!!errors.command_name}
                                                helperText={errors.command_name?.message}
                                                placeholder="Enter menu name"
                                            />
                                        )}
                                    />
                                </Grid>

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
                                                label={`${dictionary['menumanagement']?.application_code || 'Application'} *`}
                                                error={!!errors.application_code}
                                                helperText={errors.application_code?.message}
                                                value={field.value || ''}
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

                                {/* Command URI */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Controller
                                        name="command_uri"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label={dictionary['menumanagement']?.command_uri || 'Command URI'}
                                                placeholder="/example-page"
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
                                                label={dictionary['menumanagement']?.icon || 'Icon'}
                                                placeholder="tabler:home"
                                                onClick={() => setIconPickerOpen(true)}
                                                slotProps={{
                                                    input: {
                                                        readOnly: true,
                                                        style: { cursor: 'pointer' },
                                                        endAdornment: (
                                                            <IconButton size="small" onClick={() => setIconPickerOpen(true)}>
                                                                <MuiIcons.Search />
                                                            </IconButton>
                                                        )
                                                    }
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>

                                {/* Visible & Enabled Toggles */}
                                <Grid size={{ xs: 12 }}>
                                    <Box display="flex" gap={4} alignItems="center">
                                        <Controller
                                            name="is_visible"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={field.value}
                                                            onChange={field.onChange}
                                                            color="primary"
                                                        />
                                                    }
                                                    label={dictionary['menumanagement']?.is_visible || 'Visible'}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="enabled"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={field.value}
                                                            onChange={field.onChange}
                                                            color="primary"
                                                        />
                                                    }
                                                    label={dictionary['menumanagement']?.enabled || 'Enabled'}
                                                />
                                            )}
                                        />
                                    </Box>
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
                                                select
                                                label={dictionary['menumanagement']?.group_menu_visible || 'Group Menu Visible'}
                                                value={field.value || '1'}
                                            >
                                                <MuiMenuItem value="1">Yes</MuiMenuItem>
                                                <MuiMenuItem value="0">No</MuiMenuItem>
                                            </TextField>
                                        )}
                                    />
                                </Grid>

                                {/* Group Menu List Authorize Form */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Controller
                                        name="group_menu_list_authorize_form"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label={dictionary['menumanagement']?.group_menu_list_authorize_form || 'Authorize Forms'}
                                                placeholder="Comma separated form IDs"
                                            />
                                        )}
                                    />
                                </Grid>

                                {/* Multi-language names */}
                                <Grid size={{ xs: 12 }}>
                                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
                                            <Tab label="English" />
                                            <Tab label="Vietnamese" />
                                        </Tabs>
                                    </Box>

                                    <Box sx={{ pt: 3 }}>
                                        {currentTab === 0 && (
                                            <Controller
                                                name="command_name_en"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        fullWidth
                                                        label={`${dictionary['menumanagement']?.command_name || 'Menu Name'} (English)`}
                                                        multiline
                                                        rows={2}
                                                    />
                                                )}
                                            />
                                        )}
                                        {currentTab === 1 && (
                                            <Controller
                                                name="command_name_vi"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        fullWidth
                                                        label={`${dictionary['menumanagement']?.command_name || 'Menu Name'} (Vietnamese)`}
                                                        multiline
                                                        rows={2}
                                                    />
                                                )}
                                            />
                                        )}
                                    </Box>
                                </Grid>
                            </Grid>
                        </>
                    )}
                </DialogContent>

                {!isSuccess && (
                    <DialogActions sx={{ p: 3, mt: 2 }}>
                        <Button
                            onClick={() => {
                                reset()
                                onClearError?.()
                            }}
                            variant="outlined"
                            disabled={loading}
                            startIcon={<MuiIcons.RestartAlt />}
                        >
                            {dictionary['common']?.clear || 'Clear Form'}
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            startIcon={<MuiIcons.Save />}
                        >
                            {loading
                                ? dictionary['common']?.saving || 'Saving...'
                                : dictionary['common']?.save || 'Save'}
                        </Button>
                    </DialogActions>
                )}
            </form>

            <IconPicker
                open={iconPickerOpen}
                onClose={() => setIconPickerOpen(false)}
                onSelectIcon={(iconValue) => setValue('group_menu_icon', iconValue)}
                dictionary={{
                    select_icon: dictionary['menumanagement']?.select_icon,
                    search: dictionary['common']?.search,
                    no_results: dictionary['common']?.no_results,
                    filter_style: dictionary['common']?.filter_style
                }}
            />
        </Dialog>
    )
}
