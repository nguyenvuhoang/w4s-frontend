'use client';

import {
    Edit as EditIcon,
    LabelImportantOutline as ImportantIcon,
    SendOutlined as SendIcon,
    StarOutline as StarIcon
} from '@mui/icons-material';
import {
    Box,
    Button,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography
} from '@mui/material';
import React from 'react';

interface SidebarItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    count?: string;
    active?: boolean;
}

interface EmailSidebarProps {
    onCompose: () => void;
    totalCount?: number;
    dictionary: any;
    locale: string;
}

export default function EmailSidebar({
    onCompose,
    totalCount = 0,
    dictionary,
    locale
}: EmailSidebarProps) {
    const SIDEBAR_ITEMS: SidebarItem[] = [
        {
            id: 'sent',
            label: dictionary.email.sent,
            icon: <SendIcon fontSize="small" />,
            count: totalCount.toLocaleString(locale === 'vi' ? 'vi-VN' : locale === 'la' ? 'lo-LA' : 'en-US'),
            active: true
        },
        { id: 'starred', label: dictionary.email.starred, icon: <StarIcon fontSize="small" /> },
        { id: 'important', label: dictionary.email.important, icon: <ImportantIcon fontSize="small" /> },
    ];

    return (
        <Box sx={{ width: 256, flexShrink: 0, p: 2, bgcolor: 'inherit' }}>
            {/* Compose Button */}
            <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={onCompose}
                sx={{
                    bgcolor: 'background.paper',
                    color: 'primary.main',
                    borderRadius: '16px',
                    px: 3,
                    py: 1.5,
                    mb: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                    '&:hover': {
                        bgcolor: 'action.hover',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.16)',
                    }
                }}
            >
                {dictionary.email.compose}
            </Button>

            {/* Main Navigation */}
            <List sx={{ px: 0 }}>
                {SIDEBAR_ITEMS.map((item) => (
                    <ListItem
                        key={item.id}
                        sx={{
                            borderRadius: '0 20px 20px 0',
                            mb: 0.5,
                            mr: 2,
                            paddingLeft: 3,
                            bgcolor: item.active ? 'action.selected' : 'transparent',
                            color: item.active ? 'primary.main' : 'text.primary',
                            '&:hover': {
                                bgcolor: 'action.hover',
                            },
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText
                            primary={item.label}
                            slotProps={{
                                primary: {
                                    variant: 'body2',
                                    fontWeight: item.active ? 600 : 400
                                }
                            }}
                        />
                        {item.count && (
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                {item.count}
                            </Typography>
                        )}
                    </ListItem>
                ))}
            </List>
        </Box>
    );
}
