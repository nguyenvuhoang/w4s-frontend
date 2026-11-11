'use client'

import CloseIcon from '@mui/icons-material/Close'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import DownloadIcon from '@mui/icons-material/Download'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import {
    Box,
    Button,
    CircularProgress,
    IconButton,
    Paper,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography
} from '@mui/material'
import type { DropzoneInputProps, DropzoneRootProps } from 'react-dropzone'

import { feeText } from '../../components/feeTypeHelpers'
import type { FeeDictionary } from '../../types'
import type { GenerateFeeImportSourceMode } from '../types'

type Props = {
    dictionary: FeeDictionary
    importSourceMode: GenerateFeeImportSourceMode
    onModeChange: (mode: GenerateFeeImportSourceMode) => void
    /** The clipboard flow remains available internally but is intentionally not exposed on Generate Fee. */
    showClipboardMode?: boolean
    selectedFile: File | null
    onRemoveFile: () => void
    clipboardText: string
    onClipboardTextChange: (value: string) => void
    onClearClipboardText: () => void
    isDownloadingTemplate: boolean
    onDownloadTemplate: () => void
    getRootProps: (props?: DropzoneRootProps) => DropzoneRootProps
    getInputProps: (props?: DropzoneInputProps) => DropzoneInputProps
    isDragActive: boolean
    openFileDialog: () => void
}

const GenerateFeeSourcePanel = ({
    dictionary,
    importSourceMode,
    onModeChange,
    showClipboardMode = false,
    selectedFile,
    onRemoveFile,
    clipboardText,
    onClipboardTextChange,
    onClearClipboardText,
    isDownloadingTemplate,
    onDownloadTemplate,
    getRootProps,
    getInputProps,
    isDragActive,
    openFileDialog
}: Props) => {
    const activeSourceMode = showClipboardMode ? importSourceMode : 'file'

    return (
    <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} alignItems={{ sm: 'center' }}>
            {showClipboardMode && <ToggleButtonGroup
                exclusive
                value={importSourceMode}
                onChange={(_event, value) => value && onModeChange(value)}
                color="primary"
                size="small"
            >
                <ToggleButton value="file">
                    <UploadFileIcon fontSize="small" sx={{ mr: 1 }} />
                    {feeText(dictionary, 'generate_fee_mode_file', 'Upload Excel File')}
                </ToggleButton>
                <ToggleButton value="clipboard">
                    <ContentPasteIcon fontSize="small" sx={{ mr: 1 }} />
                    {feeText(dictionary, 'generate_fee_mode_clipboard', 'Paste from Excel')}
                </ToggleButton>
            </ToggleButtonGroup>}

            <Button
                variant="outlined"
                startIcon={isDownloadingTemplate ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                onClick={onDownloadTemplate}
                disabled={isDownloadingTemplate}
            >
                {feeText(dictionary, 'generate_fee_download_template', 'Download Template')}
            </Button>
        </Stack>

        {activeSourceMode === 'file' ? (
            selectedFile ? (
                <Paper
                    variant="outlined"
                    sx={{ p: 2.5, borderColor: 'primary.main', bgcolor: 'rgba(25, 118, 210, 0.04)' }}
                >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
                        <Stack direction="row" alignItems="center" gap={1.5} minWidth={0}>
                            <InsertDriveFileIcon color="primary" />
                            <Box minWidth={0}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    {feeText(dictionary, 'generate_fee_selected_file_label', 'Selected file')}
                                </Typography>
                                <Typography variant="body1" noWrap>{selectedFile.name}</Typography>
                            </Box>
                        </Stack>
                        <IconButton onClick={onRemoveFile} aria-label={feeText(dictionary, 'generate_fee_remove_file', 'Remove file')}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                </Paper>
            ) : (
                <Paper
                    variant="outlined"
                    sx={{
                        p: { xs: 3, md: 5 },
                        borderStyle: 'dashed',
                        borderWidth: 2,
                        borderColor: isDragActive ? 'primary.main' : 'divider',
                        backgroundColor: isDragActive ? 'action.hover' : 'background.paper'
                    }}
                >
                    <Box
                        {...getRootProps()}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 2,
                            textAlign: 'center',
                            minHeight: 220,
                            cursor: 'pointer'
                        }}
                    >
                        <input
                            {...getInputProps({
                                accept: '.xlsx,.xls,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.ms-excel.sheet.macroEnabled.12'
                            })}
                        />
                        <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                        <Typography variant="h6">
                            {feeText(dictionary, 'generate_fee_upload_title', 'Upload Excel File')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {feeText(dictionary, 'generate_fee_upload_hint', 'Drag and drop an Excel file here, or click the button below to choose a file.')}
                        </Typography>
                        <Button variant="contained" onClick={openFileDialog}>
                            {feeText(dictionary, 'generate_fee_choose_file', 'Choose File')}
                        </Button>
                        <Typography variant="caption" color="text.secondary">
                            {feeText(dictionary, 'generate_fee_upload_accept', 'Accepted formats: .xlsx, .xls, .xlsm')}
                        </Typography>
                    </Box>
                </Paper>
            )
        ) : (
            <Paper
                variant="outlined"
                sx={{
                    p: { xs: 2.5, md: 3 },
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    borderColor: clipboardText ? 'primary.main' : 'divider',
                    backgroundColor: 'action.hover'
                }}
            >
                <Stack spacing={2}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <ContentPasteIcon color="action" />
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                {feeText(dictionary, 'generate_fee_clipboard_title', 'Paste from Excel')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {feeText(dictionary, 'generate_fee_clipboard_hint', 'Copy a data range from Excel or Google Sheets and paste it here.')}
                            </Typography>
                        </Box>
                    </Stack>
                    <TextField
                        value={clipboardText}
                        onChange={event => onClipboardTextChange(event.target.value)}
                        multiline
                        minRows={6}
                        maxRows={10}
                        fullWidth
                        placeholder={feeText(dictionary, 'generate_fee_clipboard_placeholder', 'Paste tab-separated table data here.')}
                    />
                    <Box>
                        <Button
                            variant="outlined"
                            color="secondary"
                            onClick={onClearClipboardText}
                            disabled={!clipboardText}
                        >
                            {feeText(dictionary, 'generate_fee_clipboard_clear_data', 'Clear Pasted Data')}
                        </Button>
                    </Box>
                </Stack>
            </Paper>
        )}
    </Stack>
    )
}

export default GenerateFeeSourcePanel
