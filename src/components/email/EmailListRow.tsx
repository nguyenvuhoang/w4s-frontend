'use client';

import {
    DragIndicator as DragIcon,
    LabelImportantOutlined as ImportantIcon,
    LabelImportant as ImportantFilledIcon,
    StarBorderOutlined as StarIcon,
    Star as StarFilledIcon,
} from '@mui/icons-material';
import {
    Box,
    Checkbox,
    IconButton,
    Stack,
    Typography,
} from '@mui/material';

interface EmailListRowProps {
    email: {
        id?: string | number;
        sender?: string;
        receiver?: string; // New
        subject: string;
        snippet?: string;
        body?: string; // New
        date?: string;
        isRead?: boolean;
        is_important?: boolean;
        is_star?: boolean;
    };
    selected?: boolean;
    onToggleSelect?: () => void;
    onClick?: () => void;
    onToggleStar?: () => void;
    onToggleImportant?: () => void;
}

const stripHtml = (html: string) => {
    if (typeof window === 'undefined') return html; // Fallback for SSR if any
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
};

export default function EmailListRow({ email, selected, onToggleSelect, onClick, onToggleStar, onToggleImportant }: EmailListRowProps) {
    const displaySnippet = email.snippet || (email.body ? stripHtml(email.body) : '');

    return (
        <Box
            onClick={onClick}
            sx={{
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 0.75,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: email.isRead ? 'transparent' : 'action.selected',
                cursor: 'pointer',
                transition: 'background-color 0.1s',
                '&:hover': {
                    bgcolor: 'action.hover',
                    boxShadow: 'inset 1px 0 0 palette.divider, inset -1px 0 0 palette.divider, 0 1px 2px 0 rgba(0,0,0,0.1)',
                    '& .drag-icon': { visibility: 'visible' }
                },
            }}
        >
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 160 }}>
                <IconButton size="small" className="drag-icon" sx={{ visibility: 'hidden', p: 0.5, mr: -1, color: 'grey.600' }}>
                    <DragIcon fontSize="small" />
                </IconButton>
                <Checkbox
                    size="small"
                    checked={!!selected}
                    onChange={(e) => {
                        e.stopPropagation();
                        onToggleSelect?.();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    sx={{ p: 0.5, color: 'text.disabled' }}
                />
                <IconButton
                    size="small"
                    sx={{ p: 0.5, color: email.is_star ? '#f4b400' : 'text.disabled' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar?.();
                    }}
                >
                    {email.is_star ? <StarFilledIcon fontSize="small" /> : <StarIcon fontSize="small" />}
                </IconButton>
                <IconButton
                    size="small"
                    sx={{ p: 0.5, color: email.is_important ? '#f4b400' : 'text.disabled' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleImportant?.();
                    }}
                >
                    {email.is_important ? <ImportantFilledIcon fontSize="small" /> : <ImportantIcon fontSize="small" />}
                </IconButton>
                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: email.isRead ? 400 : 700,
                        color: 'text.primary',
                        ml: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        width: 150
                    }}
                >
                    {email.sender || email.receiver || 'Unknown'}
                </Typography>
            </Stack>

            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', minWidth: 0, ml: 2 }}>
                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: email.isRead ? 400 : 700,
                        color: 'text.primary',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {email.subject}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        color: 'text.secondary',
                        ml: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    - {displaySnippet}
                </Typography>
            </Box>

            <Typography
                variant="caption"
                sx={{
                    fontWeight: email.isRead ? 400 : 700,
                    color: 'text.primary',
                    minWidth: 80,
                    textAlign: 'right',
                    ml: 2
                }}
            >
                {email.date || ''}
            </Typography>
        </Box>
    );
}
