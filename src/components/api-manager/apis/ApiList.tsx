'use client';

import React, { useState, useMemo } from 'react';
import { Box, Paper, TextField, InputAdornment, Button, MenuItem, IconButton, Menu, Chip } from '@mui/material';
import { Search as SearchIcon, Add as AddIcon, MoreVert as MoreVertIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { Api } from '@/types/api-manager';
import DataTable, { Column } from '@/components/api-manager/shared/DataTable';
import Link from 'next/link';
import RequirePermission from '@/components/api-manager/shared/RequirePermission';

interface ApiListProps {
    initialData: Api[];
}

export default function ApiList({ initialData }: ApiListProps) {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Local filtering for mock demo
    const filteredData = useMemo(() => {
        return initialData.filter(api => {
            const matchSearch = api.name.toLowerCase().includes(search.toLowerCase()) ||
                api.id.toLowerCase().includes(search.toLowerCase());
            const matchType = filterType === 'all' || api.type === filterType;
            return matchSearch && matchType;
        });
    }, [initialData, search, filterType]);

    const displayedRows = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const columns: Column<Api>[] = [
        { id: 'name', label: 'Name', minWidth: 200 },
        { id: 'version', label: 'Version', minWidth: 100 },
        { id: 'type', label: 'Type', format: (val) => <Chip label={val} size="small" variant="outlined" /> },
        {
            id: 'status', label: 'Status', format: (val) => (
                <Chip
                    label={val}
                    size="small"
                    color={val === 'published' ? 'success' : val === 'deprecated' ? 'warning' : 'default'}
                />
            )
        },
        { id: 'updatedAt', label: 'Last Updated', format: (val) => new Date(val).toLocaleDateString() },
    ];

    // Action Menu Mock
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedApi, setSelectedApi] = useState<Api | null>(null);

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, api: Api) => {
        setAnchorEl(event.currentTarget);
        setSelectedApi(api);
    };
    const handleCloseMenu = () => {
        setAnchorEl(null);
        setSelectedApi(null);
    };

    const handleRowClick = (api: Api) => {
        router.push(`/api-manager/apis/${api.id}`);
    };

    return (
        <Paper sx={{ p: 2 }}>
            {/* Toolbar */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <TextField
                    size="small"
                    placeholder="Search APIs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                    }}
                    sx={{ flexGrow: 1 }}
                />
                <TextField
                    select
                    size="small"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    sx={{ width: 150 }}
                    label="Type"
                >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="rest">REST</MenuItem>
                    <MenuItem value="graphql">GraphQL</MenuItem>
                </TextField>

                <RequirePermission permission="api.write">
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        component={Link}
                        href="/api-manager/apis/new"
                    >
                        Create API
                    </Button>
                </RequirePermission>
            </Box>

            <DataTable
                columns={columns}
                rows={displayedRows}
                count={filteredData.length}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={setPage}
                onRowsPerPageChange={setRowsPerPage}
                onRowClick={handleRowClick}
                actions={(row) => (
                    <IconButton onClick={(e) => { e.stopPropagation(); handleOpenMenu(e, row); }}>
                        <MoreVertIcon />
                    </IconButton>
                )}
            />

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
                onClick={(e) => e.stopPropagation()}
            >
                <MenuItem onClick={() => { router.push(`/api-manager/apis/${selectedApi?.id}`); handleCloseMenu(); }}>View Details</MenuItem>
                <RequirePermission permission="api.write">
                    <MenuItem onClick={handleCloseMenu}>Edit API</MenuItem>
                </RequirePermission>
                <RequirePermission permission="api.deploy">
                    <MenuItem onClick={handleCloseMenu}>Deploy</MenuItem>
                </RequirePermission>
                <RequirePermission permission="api.write">
                    <MenuItem onClick={handleCloseMenu} sx={{ color: 'error.main' }}>Delete</MenuItem>
                </RequirePermission>
            </Menu>
        </Paper>
    );
}
