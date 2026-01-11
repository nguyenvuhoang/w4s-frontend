'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
import { value } from 'valibot'

type MenuFormData = {
    application_code: string
    command_id: string
    parent_id: string
    command_name: string
    command_name_en: string
    command_name_vi: string
    command_name_language: string
    command_type: string
    command_option: string
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
            command_option: '',
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
    const commandType = watch('command_type')
    const commandOption = watch('command_option')
    const parentId = watch('parent_id')

    // Command options for type C (Command/Button)
    const commandOptions = [
        { value: '001', label: '001. View', label_en: 'View', label_vi: 'Xem' },
        { value: '002', label: '002. Modify', label_en: 'Modify', label_vi: 'Sửa' },
        { value: '003', label: '003. Delete', label_en: 'Delete', label_vi: 'Xóa' },
        { value: '004', label: '004. Approve', label_en: 'Approve', label_vi: 'Duyệt' },
        { value: '005', label: '005. Reject', label_en: 'Reject', label_vi: 'Từ chối' },
        { value: '006', label: '006. Add', label_en: 'Add', label_vi: 'Thêm' }
    ]

    // Get used command options for the selected parent
    const usedCommandOptions = useMemo(() => {
        if (!parentId || parentId === '0' || commandType !== 'C') return []

        // Find all children of the selected parent that are type C
        const childrenCommands = menuItems.filter(
            item => item.parent_id === parentId && item.command_type === 'C'
        )

        // Extract the last 3 digits (command option suffix) from each child's command_id
        const usedOptions = childrenCommands.map(item => {
            const commandId = item.command_id
            // Get last 3 characters as the option suffix
            if (commandId.length >= 3) {
                return commandId.slice(-3)
            }
            return ''
        }).filter(Boolean)

        return usedOptions
    }, [parentId, commandType, menuItems])

    // Auto-generate command_id when command_type is C and parent_id + command_option change
    useEffect(() => {
        if (commandType === 'C' && parentId && parentId !== '0' && commandOption) {
            const generatedId = `${parentId}${commandOption}`
            setValue('command_id', generatedId)

            // Auto-fill command names based on selected command option
            const selectedOption = commandOptions.find(opt => opt.value === commandOption)
            if (selectedOption) {
                setValue('command_name', selectedOption.label_en)
                setValue('command_name_en', selectedOption.label_en)
                setValue('command_name_vi', selectedOption.label_vi)
            }
        }
    }, [commandType, parentId, commandOption, setValue])

    // Reset command_option and command_id when command_type changes
    useEffect(() => {
        if (commandType !== 'C') {
            setValue('command_option', '')
        }
    }, [commandType, setValue])

    // Reset command_option when parent_id changes (to revalidate available options)
    useEffect(() => {
        if (commandType === 'C') {
            setValue('command_option', '')
            setValue('command_id', '')
            setValue('command_name', '')
            setValue('command_name_en', '')
            setValue('command_name_vi', '')
        }
    }, [parentId])

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
                                                helperText={
                                                    errors.command_id?.message ||
                                                    (commandType === 'C' ? 'Auto-generated from Parent ID + Command Option' : '')
                                                }
                                                placeholder="e.g., 001"
                                                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                                                slotProps={{
                                                    input: {
                                                        readOnly: commandType === 'C'
                                                    }
                                                }}
                                                sx={{
                                                    '& .MuiInputBase-input': {
                                                        bgcolor: commandType === 'C' ? 'action.disabledBackground' : 'inherit'
                                                    }
                                                }}
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

                                {/* Command Option - Only show when command_type is C */}
                                {commandType === 'C' && (
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Controller
                                            name="command_option"
                                            control={control}
                                            rules={{
                                                required: commandType === 'C' ? (dictionary['common']?.required || 'Required') : false
                                            }}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    select
                                                    label={`${dictionary['menumanagement']?.command_option || 'Command Option'} *`}
                                                    error={!!errors.command_option}
                                                    helperText={
                                                        errors.command_option?.message ||
                                                        (parentId === '0'
                                                            ? 'Please select a Parent Menu first'
                                                            : usedCommandOptions.length > 0
                                                                ? `Options already used: ${usedCommandOptions.join(', ')}`
                                                                : '')
                                                    }
                                                    value={field.value || ''}
                                                    disabled={parentId === '0'}
                                                >
                                                    {commandOptions.map(option => {
                                                        const isUsed = usedCommandOptions.includes(option.value)
                                                        return (
                                                            <MuiMenuItem
                                                                key={option.value}
                                                                value={option.value}
                                                                disabled={isUsed}
                                                                sx={{
                                                                    opacity: isUsed ? 0.5 : 1,
                                                                    '&.Mui-disabled': {
                                                                        opacity: 0.5
                                                                    }
                                                                }}
                                                            >
                                                                {option.label}
                                                                {isUsed && (
                                                                    <Typography
                                                                        component="span"
                                                                        sx={{ ml: 1, color: 'error.main', fontSize: '0.75rem' }}
                                                                    >
                                                                        (Already exists)
                                                                    </Typography>
                                                                )}
                                                            </MuiMenuItem>
                                                        )
                                                    })}
                                                </TextField>
                                            )}
                                        />
                                    </Grid>
                                )}

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
