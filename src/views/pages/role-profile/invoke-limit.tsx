'use client';

import { PageDefaultResponse } from '@/types/bankType';
import { PageData, Role } from '@/types/systemTypes';
import ChecklistIcon from '@mui/icons-material/Checklist';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import {
    Box, Checkbox, CircularProgress,
    InputAdornment, List, ListItemButton, ListItemIcon, ListItemText,
    Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
    Typography
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

export type InvokeLimitItem = {
    id: string | number;
    group: string;
    caption: string;
    currency: string;
    value?: number | null;
};

type Props = {
    roles: PageData<Role>;
    /** Tải limits theo roleId (server). Nếu không truyền, dùng demoData */
    loadLimits?: (roleId: Role['id']) => Promise<InvokeLimitItem[]>;
    /** Lưu 1 item (khi autosave bật) */
    saveLimit?: (roleId: Role['id'], item: InvokeLimitItem) => Promise<void>;
};

export default function InvokeLimit({ roles, loadLimits, saveLimit }: Props) {
    const [selectedRoleId, setSelectedRoleId] = useState<Role['id']>(roles?.items[0]?.id);
    const [autoSave, setAutoSave] = useState(true);
    const [rows, setRows] = useState<InvokeLimitItem[]>([]);
    const [qGroup, setQGroup] = useState('');
    const [qCaption, setQCaption] = useState('');
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState<string | number | null>(null);
    const [editValue, setEditValue] = useState<number | null>(null);

    // Demo data if API chưa gắn
    const demoData: InvokeLimitItem[] = useMemo(() => ([
        { id: 1, group: 'Mobile', caption: 'Internal transfer', currency: 'LAK', value: null },
        { id: 2, group: 'Mobile', caption: 'Loan repayment', currency: 'LAK', value: null },
        { id: 3, group: 'Mobile', caption: 'Cash out', currency: 'LAK', value: null },
        { id: 4, group: 'Mobile', caption: 'Cash in', currency: 'LAK', value: null },
    ]), []);

    const fetchLimits = async (roleId: Role['id']) => {
        setLoading(true);
        try {
            const data = loadLimits ? await loadLimits(roleId) : demoData;
            setRows(data);
        } finally {
            setLoading(false);
        }
    };

    // Load lần đầu theo role đầu tiên
    useEffect(() => {
        if (selectedRoleId != null) fetchLimits(selectedRoleId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSelectRole = (roleId: Role['id']) => {
        setSelectedRoleId(roleId);     // sáng lên ngay
        fetchLimits(roleId);           // gọi API ngay khi click
    };

    const filtered = rows.filter(r =>
        r.group.toLowerCase().includes(qGroup.toLowerCase()) &&
        r.caption.toLowerCase().includes(qCaption.toLowerCase())
    );

    const handleEdit = async (item: InvokeLimitItem) => {
        const updated: InvokeLimitItem = { ...item, value: (item.value ?? 0) + 1_000_000 };
        setRows(prev => prev.map(x => x.id === item.id ? updated : x));
        if (autoSave && saveLimit) await saveLimit(selectedRoleId, updated);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                height: 'calc(100vh - 200px)',
                border: '1px solid #048C48',
                borderRadius: '6px',
                overflow: 'hidden',
            }}
        >
            {/* LEFT: role list */}
            <Box
                sx={{
                    width: 280,
                    flexShrink: 0,
                    borderRight: '1px solid #048C48',
                    overflowY: 'auto',
                    backgroundColor: '#f8f9fa',
                }}
            >
                <List dense disablePadding>
                    {roles.items.map(r => (
                        <ListItemButton
                            key={r.id}
                            selected={r.id === selectedRoleId}
                            onClick={() => handleSelectRole(r.id)}
                            sx={{
                                py: 1.2,
                                borderLeft: r.id === selectedRoleId ? '3px solid #225087' : '3px solid transparent',

                                '& .MuiTypography-root': { color: '#222', fontSize: 14 },
                                '& .MuiListItemIcon-root': { color: '#225087' },

                                '&.Mui-selected, &.Mui-selected:hover': {
                                    bgcolor: '#225087',
                                    '& .MuiTypography-root': {
                                        color: '#fff',
                                        fontWeight: 600,
                                    },
                                    '& .MuiListItemIcon-root': {
                                        color: '#fff',
                                    },
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                                <ChecklistIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                                primary={r.rolename ?? String(r.id)}
                                slotProps={{
                                    primary: {
                                        noWrap: true, color: 'inherit', fontSize: 14,
                                    }
                                }}
                            />
                        </ListItemButton>

                    ))}
                </List>
            </Box>

            {/* RIGHT: grid + autosave */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    p: 2,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1,
                    }}
                >
                    <Checkbox
                        checked={autoSave}
                        onChange={(_, c) => setAutoSave(c)}
                        sx={{ p: 0, color: '#048C48' }}
                    />
                    <Typography
                        variant="subtitle1"
                        sx={{ color: '#048C48', fontWeight: 600 }}
                    >
                        Auto Save
                    </Typography>
                </Box>

                <TableContainer
                    component={Paper}
                    sx={{
                        flex: 1,
                        overflow: 'auto',
                        border: '1px solid #048C48',
                        borderRadius: '4px',
                    }}
                >
                    {loading && (
                        <Box sx={{
                            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: 'rgba(255,255,255,0.5)', zIndex: 1
                        }}>
                            <CircularProgress size={28} />
                        </Box>
                    )}
                    <Table stickyHeader size="small"
                        sx={{
                            borderCollapse: 'collapse',
                            '& th, & td': {
                                border: '1px solid #C8E6C9',
                            },
                            '& th': {
                                fontWeight: 700,
                                fontSize: '15px',
                            },
                            '& td': {
                                fontSize: '14px',
                            }
                        }}
                    >
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ width: 200 }}>Group</TableCell>
                                <TableCell>Caption</TableCell>
                                <TableCell sx={{ width: 200, textAlign: 'center' }}>LAK</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>
                                    <TextField
                                        value={qGroup}
                                        onChange={e => setQGroup(e.target.value)}
                                        placeholder="Search group"
                                        size="small"
                                        fullWidth
                                        slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <SearchIcon fontSize="small" sx={{ color: '#048C48' }} />
                                                    </InputAdornment>
                                                )
                                            }
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        value={qCaption}
                                        onChange={e => setQCaption(e.target.value)}
                                        placeholder="Search caption"
                                        size="small"
                                        fullWidth

                                        slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <SearchIcon fontSize="small" sx={{ color: '#048C48' }} />
                                                    </InputAdornment>
                                                )
                                            }
                                        }}
                                    />
                                </TableCell>
                                <TableCell />
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {loading ? (
                                [...Array(6)].map((_, i) => (
                                    <TableRow key={`sk-${i}`}>
                                        <TableCell colSpan={4}>
                                            <Typography variant="body2" sx={{ opacity: 0.6 }}>Loading…</Typography>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (

                                filtered.map(row => {
                                    const isEditing = editId === row.id;

                                    return (
                                        <TableRow key={row.id} hover>
                                            <TableCell>{row.group}</TableCell>
                                            <TableCell>{row.caption}</TableCell>
                                            <TableCell align="right" sx={{ position: 'relative', cursor: 'pointer' }}>
                                                {isEditing ? (
                                                    <TextField
                                                        autoFocus
                                                        size="small"
                                                        type="number"
                                                        value={editValue ?? ''}
                                                        onChange={e => setEditValue(Number(e.target.value))}
                                                        onBlur={async () => {
                                                            const updated = { ...row, value: editValue };
                                                            setRows(prev => prev.map(x => (x.id === row.id ? updated : x)));
                                                            setEditId(null);
                                                            if (autoSave && saveLimit) await saveLimit(selectedRoleId, updated);
                                                        }}
                                                        onKeyDown={async e => {
                                                            if (e.key === 'Enter') {
                                                                const updated = { ...row, value: editValue };
                                                                setRows(prev => prev.map(x => (x.id === row.id ? updated : x)));
                                                                setEditId(null);
                                                                if (autoSave && saveLimit) await saveLimit(selectedRoleId, updated);
                                                            } else if (e.key === 'Escape') {
                                                                setEditId(null);
                                                            }
                                                        }}
                                                        sx={{
                                                            width: '100%',
                                                            '& input': { textAlign: 'right', paddingRight: '36px' },
                                                        }}
                                                    />
                                                ) : (
                                                    <Box
                                                        onClick={() => { setEditId(row.id); setEditValue(row.value ?? 0); }}
                                                        sx={{
                                                            position: 'relative',
                                                            minHeight: 30,
                                                            pr: '28px',
                                                            '&:hover .lak-edit-icon': { opacity: 1 },
                                                        }}
                                                    >
                                                        <Typography component="span" sx={{ userSelect: 'none' }}>
                                                            {typeof row.value === 'number' ? row.value.toLocaleString() : ''}
                                                        </Typography>

                                                        <EditIcon
                                                            className="lak-edit-icon"
                                                            fontSize="small"
                                                            sx={{
                                                                position: 'absolute',
                                                                right: 6,
                                                                top: '50%',
                                                                transform: 'translateY(-50%)',
                                                                color: '#048C48',
                                                                opacity: 0,
                                                                transition: 'opacity 0.15s',
                                                                pointerEvents: 'none',
                                                            }}
                                                        />
                                                    </Box>
                                                )}
                                            </TableCell>


                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );

}
