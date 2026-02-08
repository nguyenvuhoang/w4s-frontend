'use client';

import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    TextField,
    Button,
    Stack,
    Divider,
    Fade,
    CircularProgress,
    Tooltip
} from '@mui/material';
import {
    Close as CloseIcon,
    Remove as RemoveIcon,
    OpenInFull as OpenInFullIcon,
    FullscreenExit as FullscreenExitIcon,
    DeleteOutline as DeleteIcon,
    Send as SendIcon,
    AttachFile as AttachFileIcon,
    FormatColorText as FormatIcon,
    InsertEmoticon as EmojiIcon,
    InsertPhoto as PhotoIcon,
    MoreVert as MoreIcon
} from '@mui/icons-material';
import { useComposeEmailHandler } from '@/features/email/hooks/useComposeEmailHandler';

interface ComposeEmailModalProps {
    open: boolean;
    onClose: () => void;
    dictionary: any;
}

import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

export default function ComposeEmailModal({ open, onClose, dictionary }: ComposeEmailModalProps) {
    const {
        recipient,
        setRecipient,
        subject,
        setSubject,
        content,
        setContent,
        sending,
        handleSend,
    } = useComposeEmailHandler(onClose);

    const [minimized, setMinimized] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    if (!open) return null;

    return (
        <Fade in={open}>
            <Paper
                elevation={6}
                sx={{
                    position: 'fixed',
                    bottom: isFullScreen ? 0 : (minimized ? 0 : 24),
                    right: isFullScreen ? 0 : 24,
                    width: isFullScreen ? '100vw' : (minimized ? 250 : 500),
                    height: isFullScreen ? '100vh' : (minimized ? 40 : 600),
                    maxHeight: isFullScreen ? '100vh' : '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    borderTopLeftRadius: isFullScreen ? 0 : 8,
                    borderTopRightRadius: isFullScreen ? 0 : 8,
                    overflow: 'hidden',
                    zIndex: 1300,
                    transition: 'all 0.2s ease-in-out',
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        px: 2,
                        py: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                    }}
                    onClick={() => minimized && setMinimized(false)}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'white' }}>
                        {sending ? dictionary.email.sending : dictionary.email.new_message}
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                        <Tooltip title={dictionary?.email?.minimize || dictionary?.common?.minimize || "Minimize"}>
                            <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => {
                                e.stopPropagation();
                                setMinimized(prev => !prev);
                                if (isFullScreen) setIsFullScreen(false);
                            }}>
                                <RemoveIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={isFullScreen ? (dictionary?.email?.exit_full_screen || dictionary?.common?.exit_full_screen || "Exit Full Screen") : (dictionary?.email?.full_screen || dictionary?.common?.full_screen || "Full Screen")}>
                            <IconButton
                                size="small"
                                sx={{ color: 'white' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsFullScreen(prev => !prev);
                                    if (minimized) setMinimized(false);
                                }}
                            >
                                {isFullScreen ? <FullscreenExitIcon /> : <OpenInFullIcon />}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={dictionary?.email?.close || dictionary?.common?.close || "Close"}>
                            <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}>
                                <CloseIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Box>

                {!minimized && (
                    <>
                        {/* Body */}
                        <Box sx={{
                            flexGrow: 1,
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            overflowY: 'auto',
                            bgcolor: 'background.paper',
                            color: 'text.primary'
                        }}>
                            <TextField
                                fullWidth
                                placeholder={dictionary.email.recipients}
                                variant="standard"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                sx={{ mb: 1 }}
                                disabled={sending}
                            />
                            <Divider />
                            <TextField
                                fullWidth
                                placeholder={dictionary.email.subject}
                                variant="standard"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                sx={{ mb: 1, mt: 1 }}
                                disabled={sending}
                            />
                            <Divider />

                            <Box sx={{
                                mt: 2,
                                flexGrow: 1,
                                '& .ck-editor__main': {
                                    height: isFullScreen ? 'calc(100vh - 250px)' : '350px',
                                    '& .ck-content': {
                                        minHeight: isFullScreen ? 'calc(100vh - 250px)' : '350px',
                                        color: '#333' // Editor content text color should be dark for readability
                                    }
                                }
                            }}>
                                <CKEditor
                                    editor={ClassicEditor}
                                    data={content}
                                    onChange={(event, editor) => {
                                        const data = editor.getData();
                                        setContent(data);
                                    }}
                                    disabled={sending}
                                />
                            </Box>
                        </Box>

                        {/* Footer */}
                        <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderTop: '1px solid', borderColor: 'divider' }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        disabled={sending}
                                        endIcon={sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                        sx={{
                                            borderRadius: 20,
                                            px: 3,
                                            bgcolor: 'primary.main',
                                            '&:hover': { bgcolor: 'primary.dark' }
                                        }}
                                        onClick={handleSend}
                                    >
                                        {dictionary.email.send}
                                    </Button>
                                </Stack>
                                <Stack direction="row" spacing={1}>
                                    <IconButton size="small" disabled={sending} sx={{ color: 'text.secondary' }}><MoreIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" disabled={sending} sx={{ color: 'text.secondary' }} onClick={onClose}><DeleteIcon fontSize="small" /></IconButton>
                                </Stack>
                            </Stack>
                        </Box>
                    </>
                )}
            </Paper>
        </Fade>
    );
}
