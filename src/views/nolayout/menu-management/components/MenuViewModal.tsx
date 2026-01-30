'use client'

import type { Locale } from '@configs/i18n'
import { getDictionary } from '@utils/getDictionary'
import { MenuItem } from '@shared/types/systemTypes'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Grid,
    TextField,
    Divider,
    Typography,
    Chip,
    Paper
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import { useMemo } from 'react'

type Props = {
    open: boolean
    onClose: () => void
    menuItem: MenuItem | null
    locale: Locale
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}

export function MenuViewModal({ open, onClose, menuItem, locale, dictionary }: Props) {
    // Parse command_name_language
    const commandNames = useMemo(() => {
        if (!menuItem?.command_name_language) return { en: '', vi: '' }
        try {
            return JSON.parse(menuItem.command_name_language)
        } catch {
            return { en: menuItem.command_name, vi: menuItem.command_name }
        }
    }, [menuItem])

    // Get command type label
    const getCommandTypeLabel = (type: string) => {
        switch (type) {
            case 'M': return 'Menu (M)'
            case 'C': return 'Command (Button) (C)'
            case 'T': return 'Transaction (T)'
            case 'S': return 'System (S)'
            default: return type
        }
    }

    if (!menuItem) return null

    // Field configurations
    const basicFields = [
        { key: 'command_id', label: dictionary['menumanagement']?.command_id || 'Command ID', value: menuItem.command_id },
        { key: 'command_name', label: dictionary['menumanagement']?.command_name || 'Command Name', value: menuItem.command_name },
        { key: 'application_code', label: dictionary['menumanagement']?.application_code || 'Application Code', value: menuItem.application_code },
        { key: 'parent_id', label: dictionary['menumanagement']?.parent_id || 'Parent ID', value: menuItem.parent_id || '-' },
        { key: 'command_type', label: dictionary['menumanagement']?.command_type || 'Command Type', value: getCommandTypeLabel(menuItem.command_type) },
        { key: 'command_uri', label: dictionary['menumanagement']?.command_uri || 'Command URI', value: menuItem.command_uri || '-' }
    ]

    const languageFields = [
        { key: 'english', label: dictionary['common']?.english || 'English Name', value: commandNames.en || '-' },
        { key: 'vietnamese', label: dictionary['common']?.vietnamese || 'Vietnamese Name', value: commandNames.vi || '-' }
    ]

    const statusFields = [
        { key: 'enabled', label: dictionary['menumanagement']?.enabled || 'Enabled', value: menuItem.enable, type: 'chip' as const },
        { key: 'is_visible', label: dictionary['menumanagement']?.is_visible || 'Visible', value: menuItem.is_visible, type: 'chip' as const },
        { key: 'display_order', label: dictionary['menumanagement']?.display_order || 'Display Order', value: menuItem.display_order, type: 'text' as const }
    ]

    const groupMenuFields = [
        { key: 'group_menu_icon', label: dictionary['menumanagement']?.group_menu_icon || 'Group Menu Icon', value: menuItem.group_menu_icon || '-', cols: 6 },
        { key: 'group_menu_visible', label: dictionary['menumanagement']?.group_menu_visible || 'Group Menu Visible', value: menuItem.group_menu_visible || '-', cols: 6 },
        { key: 'group_menu_list_authorize_form', label: dictionary['menumanagement']?.group_menu_list_authorize_form || 'Authorize Forms', value: menuItem.group_menu_list_authorize_form || '-', cols: 12, multiline: true }
    ]

    const renderTextField = (field: { key: string; label: string; value: any; cols?: number; multiline?: boolean }) => (
        <Grid size={{ xs: 12, sm: field.cols || 6 }} key={field.key}>
            <TextField
                fullWidth
                label={field.label}
                value={field.value}
                slotProps={{ input: { readOnly: true } }}
                variant="filled"
                multiline={field.multiline}
                rows={field.multiline ? 2 : undefined}
            />
        </Grid>
    )

    const renderStatusField = (field: { key: string; label: string; value: any; type: 'chip' | 'text' }) => (
        <Grid size={{ xs: 12, sm: 4 }} key={field.key}>
            {field.type === 'chip' ? (
                <Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        {field.label}
                    </Typography>
                    {field.value ? (
                        <Chip
                            icon={<CheckCircleIcon />}
                            label={field.key === 'is_visible' ? (dictionary['common']?.visible || 'Visible') : (dictionary['common']?.yes || 'Yes')}
                            color="success"
                            size="small"
                        />
                    ) : (
                        <Chip
                            icon={<CancelIcon />}
                            label={field.key === 'is_visible' ? (dictionary['common']?.hidden || 'Hidden') : (dictionary['common']?.no || 'No')}
                            color={field.key === 'is_visible' ? 'default' : 'error'}
                            size="small"
                        />
                    )}
                </Box>
            ) : (
                <TextField
                    fullWidth
                    label={field.label}
                    value={field.value}
                    slotProps={{ input: { readOnly: true } }}
                    variant="filled"
                />
            )}
        </Grid>
    )

    const renderSection = (title: string, children: React.ReactNode) => (
        <>
            <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#225087', fontWeight: 600 }}>
                    {title}
                </Typography>
                <Divider sx={{ mb: 2 }} />
            </Grid>
            {children}
        </>
    )

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: 2,
                        boxShadow: 24
                    }
                }
            }}
        >
            <DialogTitle
                sx={{
                    backgroundColor: '#225087',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '1.25rem',
                    py: 2
                }}
            >
                {dictionary['menumanagement']?.view_menu || 'View Menu Details'}
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                <Grid container spacing={3}>
                    {/* Basic Information */}
                    {renderSection(
                        dictionary['common']?.basic_info || 'Basic Information',
                        basicFields.map(renderTextField)
                    )}

                    {/* Multi-language Names */}
                    {renderSection(
                        dictionary['common']?.multi_language || 'Multi-language Names',
                        languageFields.map(renderTextField)
                    )}

                    {/* Display Settings */}
                    {renderSection(
                        dictionary['common']?.display_settings || 'Display Settings',
                        statusFields.map(renderStatusField)
                    )}

                    {/* Group Menu Settings */}
                    {renderSection(
                        dictionary['common']?.group_menu || 'Group Menu Settings',
                        groupMenuFields.map(renderTextField)
                    )}
                </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 3 }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    color="primary"
                    startIcon={<CloseIcon />}
                >
                    {dictionary['common']?.close || 'Close'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

