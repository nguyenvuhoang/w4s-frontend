'use client';

import { PropsWithChildren, useState } from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

type AdvancedSearchPanelProps = {
    title?: string;
    defaultOpen?: boolean;
    onSubmit?: React.FormEventHandler<HTMLFormElement>;
    searchLabel?: string;
};

export default function AdvancedSearchPanel({
    title = 'Advanced Search',
    defaultOpen = true,
    onSubmit,
    searchLabel = 'Search',
    children
}: PropsWithChildren<AdvancedSearchPanelProps>) {
    const [open, setOpen] = useState(defaultOpen);

    if (!open) {
        return (
            <Box
                onClick={() => setOpen(true)}
                sx={{
                    userSelect: 'none',
                    color: 'primary.main',
                    cursor: 'pointer',
                    my: 5,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    fontWeight: 700
                }}
            >
                <Typography component="span" sx={{ fontSize: 14, fontWeight: 700 }}>
                    [+] {title}
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            component="form"
            onSubmit={onSubmit}
            sx={{
                position: 'relative',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1.5,
                p: 5,
                my: 5
            }}
        >
            {/* legend */}
            <Box
                onClick={() => setOpen(false)}
                sx={{
                    position: 'absolute',
                    top: -10,
                    left: 16,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1,
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    color: 'success.main',
                    fontWeight: 700,
                    cursor: 'pointer',
                    userSelect: 'none'
                }}
            >
                <Typography component="span" sx={{ fontSize: 14, fontWeight: 700 }}>
                    [-] {title}
                </Typography>
            </Box>

            <Grid container spacing={5} alignItems="center">
                {children}

                <Grid size={{ xs: 12 }}>
                    <Button type="submit" variant="contained" startIcon={<SearchIcon />}>
                        {searchLabel}
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
}
