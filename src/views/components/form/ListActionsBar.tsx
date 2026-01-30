// components/ListActionsBar.tsx
'use client';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { actionButtonColors, actionButtonSx } from '@components/forms/button-color/actionButtonSx';

export function ListActionsBar({
    onAdd, onView, onModify, onDelete, onSearch,
    loading, canView, canModify, canDelete, searchLabel, addLabel, viewLabel, modifyLabel, deleteLabel
}: {
    onAdd: () => void; onView: () => void; onModify: () => void; onDelete: () => void; onSearch: () => void;
    loading?: boolean; canView?: boolean; canModify?: boolean; canDelete?: boolean;
    searchLabel: string; addLabel: string; viewLabel: string; modifyLabel: string; deleteLabel: string;
}) {
    return (
        <Box display="flex" justifyContent="space-between" sx={{ mt: 3 }}>
            <Box display="flex" gap={2}>
                <Button variant="outlined" color="inherit" startIcon={<AddIcon sx={{ color: '#225087' }} />}
                    disabled={!!loading} sx={{ ...actionButtonSx, ...actionButtonColors.primary }} onClick={onAdd}>
                    {addLabel}
                </Button>
                <Button variant="outlined" color="inherit" startIcon={<VisibilityIcon sx={{ color: '#1876d1' }} />}
                    disabled={!!loading || !canView} sx={{ ...actionButtonSx, ...actionButtonColors.info }} onClick={onView}>
                    {viewLabel}
                </Button>
                <Button variant="outlined" color="inherit" startIcon={<EditIcon sx={{ color: '#f0a000' }} />}
                    disabled={!!loading || !canModify} sx={{ ...actionButtonSx, ...actionButtonColors.warning }} onClick={onModify}>
                    {modifyLabel}
                </Button>
                <Button variant="outlined" color="inherit" startIcon={<DeleteIcon sx={{ color: '#d33' }} />}
                    disabled={!!loading || !canDelete} sx={{ ...actionButtonSx, ...actionButtonColors.error }} onClick={onDelete}>
                    {deleteLabel}
                </Button>
            </Box>

            <Button variant="contained" color="primary" startIcon={<SearchIcon />} disabled={!!loading} onClick={onSearch}>
                {searchLabel}
            </Button>
        </Box>
    );
}

