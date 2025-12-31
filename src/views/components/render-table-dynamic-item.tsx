'use client'

import { getDictionary } from '@/utils/getDictionary'
import { Add, Delete } from '@mui/icons-material'
import {
  Box, Checkbox, FormControlLabel, Grid, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography
} from '@mui/material'
import { useEffect, useRef } from 'react'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'

type Props = {
  input: any
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  formMethods: ReturnType<typeof useForm>;
  gridProps: Record<string, number>;
}

const RenderTableDynamicItem = ({ input, dictionary, formMethods, gridProps }: Props) => {
  const fieldName = input.default?.code as string
  const { fields, append, replace } = useFieldArray({
    control: formMethods.control,
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
    control: formMethods.control,
    name: fieldName
  }) as Array<{ configKey?: string; ismainkey?: boolean; isdeleted?: boolean } | undefined> | undefined

  // ---- NEW: inject default keys once ----
  const injectedRef = useRef(false)

  useEffect(() => {
    // normalize incoming value (first load / external changes)
    if (Array.isArray(input.value)) {
      const normalized = input.value.map((r: any) =>
        r && typeof r === 'object'
          ? { ismainkey: !!r.ismainkey, isdeleted: !!r.isdeleted, ...r }
          : r
      )
      replace(normalized)
    }
  }, [input.value, replace])

  useEffect(() => {
    if (injectedRef.current) return

    // parse default keys: "A;B;C"
    const defaultKeys: string[] =
      (input?.config?.defaultkey ?? '')
        .split(';')
        .map((s: string) => s.trim())
        .filter(Boolean)

    // nothing to inject
    if (defaultKeys.length === 0) {
      injectedRef.current = true
      return
    }

    // get current form state for this field array
    const current = (formMethods.getValues(fieldName) ?? []) as any[]

    // build a set of existing configKeys (case-insensitive)
    const existing = new Set(
      current
        .filter(r => r && typeof r === 'object' && !!r.configKey)
        .map(r => String(r.configKey).toLowerCase())
    )

    // rows for missing default keys
    const missingDefaults = defaultKeys
      .filter(k => !existing.has(k.toLowerCase()))
      .map(k => ({
        configKey: k,
        ismainkey: true,
        isdeleted: false
      }))

    // also ensure any existing default rows are marked correctly
    const normalizedExisting = current.map(r => {
      if (!r || typeof r !== 'object') return r
      const isDefault =
        r.configKey && defaultKeys.some(k => k.toLowerCase() === String(r.configKey).toLowerCase())
      if (isDefault) {
        return {
          ...r,
          ismainkey: true,
          isdeleted: !!r.isdeleted && r.isdeleted === true ? true : false // keep deletion if you want, or force false
        }
      }
      return r
    })

    // final merged list: defaults first (optional), then others
    const merged = [...missingDefaults, ...normalizedExisting]

    replace(merged)
    injectedRef.current = true
  }, [formMethods, fieldName, input?.config?.defaultkey, replace])

  const handleSoftDelete = (rowIndex: number) => {
    const row = rows?.[rowIndex]
    // don't allow deleting main keys
    if (row?.ismainkey) return
    const path = `${fieldName}.${rowIndex}.isdeleted`
    formMethods.setValue(path, true, { shouldDirty: true, shouldTouch: true, shouldValidate: false })
  }

  return (
    <Grid size={gridProps} sx={{ marginBottom: '16px' }}>
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
                if (row?.isdeleted) return null

                const isMainKey = !!row?.ismainkey

                return (
                  <TableRow key={field.id}>
                    {columns.map((col: any) => (
                      <TableCell key={col.key}>
                        <Controller
                          control={formMethods.control}
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
                                  disabled={isMainKey} // 🔒 lock default keys
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
                      {/* SOFT DELETE (disabled for main keys) */}
                      <IconButton
                        onClick={() => handleSoftDelete(rowIndex)}
                        disabled={isMainKey}
                        sx={{ opacity: isMainKey ? 0.5 : 1 }}
                        title={isMainKey ? 'Required row' : 'Delete'}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Grid>
  )
}

export default RenderTableDynamicItem
