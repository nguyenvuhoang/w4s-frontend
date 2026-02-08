'use client';

import {
    ArrowBack as BackIcon,
    DeleteOutline as DeleteIcon,
    MoreVert as MoreIcon,
    Print as PrintIcon,
    StarBorder as StarIcon,
    Reply as ReplyIcon,
    Forward as ForwardIcon
} from '@mui/icons-material';
import {
    Avatar,
    Box,
    Button,
    Divider,
    IconButton,
    Paper,
    Stack,
    Tooltip,
    Typography
} from '@mui/material';

interface EmailDetailViewProps {
    email: any;
    onBack: () => void;
    onDelete?: () => void;
}

export default function EmailDetailView({ email, onBack, onDelete }: EmailDetailViewProps) {
    if (!email) return null;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>
            {/* Toolbar */}
            <Box sx={{
                px: 2,
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Stack direction="row" spacing={1}>
                    <Tooltip title="Back to list">
                        <IconButton size="small" onClick={onBack} sx={{ color: 'text.secondary' }}>
                            <BackIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1 }} />
                    <Tooltip title="Delete">
                        <IconButton size="small" onClick={onDelete} sx={{ color: 'text.secondary' }}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <IconButton size="small" sx={{ color: 'text.secondary' }}><MoreIcon fontSize="small" /></IconButton>
                </Stack>

                <Stack direction="row" spacing={1}>
                    <IconButton size="small" sx={{ color: 'text.secondary' }}><PrintIcon fontSize="small" /></IconButton>
                </Stack>
            </Box>

            {/* Email Content Scrolling Area */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 4, py: 3 }}>
                {/* Subject */}
                <Typography variant="h5" sx={{ mb: 4, fontWeight: 500 }}>
                    {email.subject}
                </Typography>

                {/* Header Information */}
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: '1rem' }}>
                        {(email.sender || email.receiver || '?')[0].toUpperCase()}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                {email.sender || email.receiver || 'Unknown'}
                                <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary', fontWeight: 400 }}>
                                    &lt;{email.sender_email || email.receiver_email || ''}&gt;
                                </Typography>
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {email.date || ''}
                                </Typography>
                                <IconButton size="small" sx={{ color: 'text.disabled' }}><StarIcon fontSize="small" /></IconButton>
                                <IconButton size="small" sx={{ color: 'text.disabled' }}><ReplyIcon fontSize="small" /></IconButton>
                                <IconButton size="small" sx={{ color: 'text.disabled' }}><MoreIcon fontSize="small" /></IconButton>
                            </Stack>
                        </Stack>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            to {email.receiver || 'me'}
                        </Typography>
                    </Box>
                </Stack>

                {/* Body Content */}
                <Box
                    sx={{
                        color: 'text.primary',
                        lineHeight: 1.6,
                        '& img': { maxWidth: '100% ' },
                        '& a': { color: 'primary.main' }
                    }}
                    dangerouslySetInnerHTML={{ __html: email.body || email.content || '' }}
                />

                {/* Reply/Forward Buttons */}
                <Stack direction="row" spacing={2} sx={{ mt: 6 }}>
                    <Button
                        variant="outlined"
                        startIcon={<ReplyIcon />}
                        sx={{ borderRadius: 20, px: 3, textTransform: 'none', borderColor: 'divider', color: 'text.primary' }}
                    >
                        Reply
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<ForwardIcon />}
                        sx={{ borderRadius: 20, px: 3, textTransform: 'none', borderColor: 'divider', color: 'text.primary' }}
                    >
                        Forward
                    </Button>
                </Stack>
            </Box>
        </Box>
    );
}
