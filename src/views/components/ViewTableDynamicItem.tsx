'use client'

import { getDictionary } from '@/utils/getDictionary'
import { Add, Delete } from '@mui/icons-material'
import {
    Box, Checkbox, FormControlLabel, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Typography
} from '@mui/material'
import { useEffect } from 'react'
import { Control, Controller, useFieldArray, useWatch } from 'react-hook-form'

type Props = {
    input: any
    control: Control<any>
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    setValue: (name: string, value: any, options?: any) => void
}

const ViewTableDynamicItem = ({ input, control, dictionary, setValue }: Props) => {
    const fieldName = input.default?.code as string

    const { fields, append, replace } = useFieldArray({
        control,
        name: fieldName
    })

    const columns = input.config?.columns ?? [
        { key: 'configKey', label: 'Config Key' },
        { key: 'configValue', label: 'Config Value' },
        { key: 'description', label: 'Description' },
        { key: 'isactive', label: 'Is Active' }
    ]

    // ✅ watch the whole array so UI re-renders when any row changes (including isdeleted)
    const rows = useWatch({
        control,
        name: fieldName
    }) as Array<{ ismainkey?: boolean; isdeleted?: boolean } | undefined> | undefined

    useEffect(() => {
        if (Array.isArray(input.value)) {
            // ensure required flags exist so they’re reactive
            const normalized = input.value.map((r: any) =>
                r && typeof r === 'object'
                    ? { ismainkey: !!r.ismainkey, isdeleted: !!r.isdeleted, ...r }
                    : r
            )
            replace(normalized)
        }
    }, [input.value, replace])

    const handleSoftDelete = (rowIndex: number) => {
        const path = `${fieldName}.${rowIndex}.isdeleted`
        setValue(path, true, { shouldDirty: true, shouldTouch: true, shouldValidate: false })
        // ⤴️ do NOT call remove(); we keep the row but mark it deleted
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1">
                    {input.label || dictionary['navigation'].add}
                </Typography>
                <IconButton onClick={() => append({ ismainkey: false, isdeleted: false })}>
                    <Add />
                </IconButton>
            </Box>

            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            {columns.map((col: any) => (
                                <TableCell key={col.key}>{col.label}</TableCell>
                            ))}
                            <TableCell>{dictionary['navigation'].actions}</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {fields.map((field: any, rowIndex: number) => {
                            const row = rows?.[rowIndex]
                            if (row?.isdeleted) return null // 👈 hide deleted rows

                            const isMainKey = !!row?.ismainkey

                            return (
                                <TableRow key={field.id}>
                                    {columns.map((col: any) => (
                                        <TableCell key={col.key}>
                                            <Controller
                                                control={control}
                                                name={`${fieldName}.${rowIndex}.${col.key}`}
                                                render={({ field }) => {
                                                    if (col.key === 'isactive') {
                                                        return (
                                                            <FormControlLabel
                                                                control={
                                                                    <Checkbox
                                                                        checked={!!field.value}
                                                                        onChange={e => field.onChange(e.target.checked)}
                                                                    />
                                                                }
                                                                label=""
                                                            />
                                                        )
                                                    }

                                                    if (col.key === 'configKey') {
                                                        return (
                                                            <TextField
                                                                {...field}
                                                                variant="outlined"
                                                                size="small"
                                                                fullWidth
                                                                value={field.value ?? ''}
                                                                disabled={isMainKey} // 🔒 disable when ismainkey = true
                                                            />
                                                        )
                                                    }

                                                    return (
                                                        <TextField
                                                            {...field}
                                                            variant="outlined"
                                                            size="small"
                                                            fullWidth
                                                            value={field.value ?? ''}
                                                        />
                                                    )
                                                }}
                                            />
                                        </TableCell>
                                    ))}

                                    <TableCell>
                                        {/* SOFT DELETE */}
                                        <IconButton onClick={() => handleSoftDelete(rowIndex)}>
                                            <Delete />
                                        </IconButton>

                                        {/* If you still need hard remove for new-unsaved rows, you can add another button calling remove(rowIndex) */}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}

export default ViewTableDynamicItem
