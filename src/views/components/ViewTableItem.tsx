'use client'

import { getDictionary } from '@/utils/getDictionary'
import { Add, Save, Edit, Delete, Restore, Close } from '@mui/icons-material'
import {
    Box,
    Button,
    Grid,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Tooltip
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Control, useFieldArray, useWatch } from 'react-hook-form'

type Props = {
    input: any
    control: Control<any>
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    setValue: (name: string, value: any, options?: any) => void
}

type AnyRow = Record<string, any> & {
    ismainkey?: boolean
    isdeleted?: boolean
}

type ColumnCfg = {
    key: string
    label: string
    inputtype?: string
    grid?: { xs?: number; md?: number }
}

const s = (v: any) => (typeof v === 'string' ? v : '')

const ViewTableItem = ({ input, control, dictionary, setValue }: Props) => {
    const fieldName: string =
        input?.config?.field ??
        input?.value ??
        (input?.default?.code as string) ??
        'rows'

    const columns: ColumnCfg[] = useMemo(() => {
        const rawCols = input?.config?.list_column ?? input?.list_column ?? []
        const mapped = (Array.isArray(rawCols) ? rawCols : [])
            .filter((c: any) => c && (c.code || c.field || c.name || c.title || c.caption))
            .map((c: any) => {
                const key = c.code ?? c.field ?? c.name
                const label = c.title ?? c.caption ?? c.name ?? c.code ?? key
                const gridCfg = c?.config?.grid ?? undefined
                return { key, label, inputtype: c?.inputtype, grid: gridCfg }
            })

        return mapped.length
            ? mapped
            : [
                { key: 'sysaccountname', label: 'Sys Account Name' },
                { key: 'coaaccount', label: 'COA Account' },
                { key: 'accountalias', label: 'Account Alias' }
            ]
    }, [input])

    // RHF array
    const { append, replace, update } = useFieldArray({
        control,
        name: fieldName
    })

    const rows = useWatch({ control, name: fieldName }) as AnyRow[] | undefined

    // init from input.value
    useEffect(() => {
        if (Array.isArray(input?.value)) {
            const normalized = input.value.map((r: any) =>
                r && typeof r === 'object'
                    ? { ismainkey: !!r.ismainkey, isdeleted: !!r.isdeleted, ...r }
                    : r
            )
            replace(normalized)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [input?.value])

    // header form state
    const emptyNewItem = useMemo(() => {
        const obj: Record<string, string> = {}
        for (const col of columns) obj[col.key] = ''
        return obj
    }, [columns])

    const [newItem, setNewItem] = useState<Record<string, string>>(emptyNewItem)
    useEffect(() => {
        setNewItem(emptyNewItem)
    }, [emptyNewItem])

    const [addedCount, setAddedCount] = useState(0)

    const visibleRows = useMemo(() => (rows ?? []).filter(r => !r?.isdeleted), [rows])

    const hasSoftDelete = useMemo(() => (rows ?? []).some(r => r?.isdeleted), [rows])
    const hasPendingChanges = addedCount > 0 || hasSoftDelete

    // ====== EDIT MODE ======
    const [editIndex, setEditIndex] = useState<number | null>(null)

    const enterEdit = (idx: number) => {
        const row = (rows ?? [])[idx] ?? {}
        // fill header inputs with selected row values
        const filled: Record<string, string> = {}
        for (const col of columns) filled[col.key] = s(row[col.key] ?? '')
        setNewItem(filled)
        setEditIndex(idx)
    }

    const cancelEdit = () => {
        setEditIndex(null)
        setNewItem(emptyNewItem)
    }

    const canAdd = useMemo(
        () => Object.values(newItem).some(v => s(v).trim() !== ''),
        [newItem]
    )

    const handleAdd = () => {
        if (!canAdd || editIndex !== null) return
        const payload: AnyRow = { ismainkey: false, isdeleted: false }
        for (const col of columns) {
            const val = s(newItem[col.key]).trim()
            if (val !== '') payload[col.key] = val
        }
        append(payload)
        setAddedCount(c => c + 1)
        setNewItem(emptyNewItem)
    }

    // Update current editing row
    const handleUpdate = () => {
        if (editIndex === null || !rows) return
        const current = rows[editIndex] ?? {}
        const merged: AnyRow = { ...current }
        for (const col of columns) merged[col.key] = s(newItem[col.key]).trim()
        merged.isdeleted = false
        update(editIndex, merged)
        setValue(fieldName, rows, { shouldDirty: true, shouldTouch: true })
        setEditIndex(null)
        setNewItem(emptyNewItem)
    }

    const handleApply = () => {
        setValue(fieldName, rows ?? [], { shouldDirty: true, shouldTouch: true })
    }

    const toggleDelete = (idx: number) => {
        if (!rows) return
        const r = rows[idx]
        update(idx, { ...r, isdeleted: !r?.isdeleted })
    }

    const getGridSize = (idx: number): { xs: number; md: number } => {
        const col = columns[idx]
        const xs = col.grid?.xs ?? 12
        let md = col.grid?.md ?? 6
        if (columns.length % 2 === 1 && idx === columns.length - 1 && !col.grid?.md) md = 12
        return { xs, md }
    }

    const showHeader: boolean = input?.config?.show_header ?? true

    return (
        <Box>
            {/* Header inputs (used for Add and Edit) */}
            <Grid container spacing={5} sx={{ mb: 2 }}>
                {columns.map((col, idx) => {
                    const sizes = getGridSize(idx)
                    return (
                        <Grid key={col.key} size={sizes}>
                            <TextField
                                label={
                                    editIndex !== null
                                        ? `${col.label} (editing #${editIndex + 1})`
                                        : col.label
                                }
                                value={newItem[col.key] ?? ''}
                                onChange={e =>
                                    setNewItem(prev => ({ ...prev, [col.key]: e.target.value }))
                                }
                                fullWidth
                                size="small"
                            />
                        </Grid>
                    )
                })}
            </Grid>

            {/* Buttons */}
            <Box sx={{ display: 'flex', gap: 5, my: 5 }}>
                {editIndex === null ? (
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleAdd}
                        disabled={!canAdd}
                    >
                        {dictionary?.navigation?.add ?? 'Add'}
                    </Button>
                ) : (
                    <>
                        <Button
                            variant="contained"
                            startIcon={<Save />}
                            onClick={handleUpdate}
                        >
                            {dictionary?.navigation?.update ?? 'Update'}
                        </Button>
                        <Button
                            color="inherit"
                            variant="outlined"
                            startIcon={<Close />}
                            onClick={cancelEdit}
                        >
                            {dictionary?.navigation?.cancel ?? 'Cancel'}
                        </Button>
                    </>
                )}

                <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleApply}
                    disabled={!hasPendingChanges && editIndex === null}
                >
                    {dictionary?.navigation?.apply ?? 'Apply'}
                </Button>
            </Box>

            {/* Table */}
            <TableContainer>
                <Table
                    size={input?.config?.dense ? 'small' : 'medium'}
                    sx={{
                        border: 1,
                        borderColor: 'divider',
                        '& th, & td': { border: 1, borderColor: 'divider' },
                        '& thead th': {
                            backgroundColor: 'primary.main',
                            color: 'primary.contrastText',
                            fontWeight: 600
                        }
                    }}
                >
                    {showHeader && (
                        <TableHead>
                            <TableRow>
                                {columns.map(col => (
                                    <TableCell key={col.key}>{col.label}</TableCell>
                                ))}
                                <TableCell width={140} align="center">
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                    )}

                    <TableBody>
                        {(rows ?? []).length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + 1} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        {dictionary?.common?.noData ?? 'No data'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            (rows ?? []).map((row, idx) => {
                                const deleted = !!row?.isdeleted
                                return (
                                    <TableRow
                                        key={`row-${idx}`}
                                        sx={{
                                            ...(deleted && { opacity: 0.5 }),
                                            ...(editIndex === idx && {
                                                outline: '2px solid',
                                                outlineColor: 'primary.light'
                                            })
                                        }}
                                    >
                                        {columns.map(col => (
                                            <TableCell key={`${idx}-${col.key}`}>
                                                {row?.[col.key] ?? ''}
                                            </TableCell>
                                        ))}

                                        <TableCell align="center">
                                            <Tooltip title="Modify">
                                                <span>
                                                    <IconButton
                                                        color="primary"
                                                        onClick={() => enterEdit(idx)}
                                                        disabled={editIndex !== null && editIndex !== idx}
                                                        size="small"
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>

                                            {deleted ? (
                                                <Tooltip title="Restore">
                                                    <IconButton
                                                        color="success"
                                                        onClick={() => toggleDelete(idx)}
                                                        size="small"
                                                    >
                                                        <Restore fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : (
                                                <Tooltip title="Delete">
                                                    <IconButton
                                                        color="error"
                                                        onClick={() => toggleDelete(idx)}
                                                        size="small"
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
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
    )
}

export default ViewTableItem
