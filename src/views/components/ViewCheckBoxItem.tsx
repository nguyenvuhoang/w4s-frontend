'use client'

import { getDataConfig } from '@/@core/components/jSelect/supFunc'
import { Locale } from '@/configs/i18n'
import { parseClassToGrid } from '@utils/parseClassToGrid'
import DoneIcon from '@mui/icons-material/Done'
import EditIcon from '@mui/icons-material/Edit'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import { Box, Checkbox, FormControlLabel, Grid, Typography } from '@mui/material'
import { Session } from 'next-auth'
import { useEffect, useRef, useState } from 'react'
import { Control, Controller, UseFormGetValues, UseFormSetValue } from 'react-hook-form'

type OptionItem = {
    value: string
    label: string
}

type Props = {
    input: any
    session: Session | null
    control: Control<any>
    getValues: UseFormGetValues<any>
    setValue: UseFormSetValue<any>
    onChangeValue?: (code: string, value: string) => void
    locale: Locale
}

const ViewCheckBoxItem = ({
    input,
    session,
    control,
    getValues,
    setValue,
    onChangeValue,
    locale
}: Props) => {
    const [options, setOptions] = useState<OptionItem[]>([])
    const hasFetchedRef = useRef(false)
    const [editing, setEditing] = useState(false)

    useEffect(() => {
        const fetchOptions = async () => {
            if (hasFetchedRef.current) return
            let selectData = input.options || []

            if ((!selectData || selectData.length === 0) && input.config) {
                try {
                    selectData = await getDataConfig(input.config, session, locale)
                } catch (error) {
                    console.error('Failed to fetch config data for checkbox:', error)
                }
            }
            const keySelected = input.config?.key_selected
            const keyDisplay = input.config?.key_display

            const mappedOptions = selectData.map((item: any) => {
                const value =
                    keySelected
                        ? item[keySelected] || item.c_cdlist?.cdid || item?.codeid || ''
                        : item.c_cdlist?.cdid || item?.codeid || ''

                const label =
                    keySelected && keyDisplay
                        ? item[keySelected]
                            ? item[keySelected] + '-' + (item[keyDisplay] || '')
                            : item.c_cdlist?.caption || item?.caption || ''
                        : item.c_cdlist?.caption || item?.caption || ''

                return { value, label }
            })

            setOptions(mappedOptions)
            hasFetchedRef.current = true
        }

        fetchOptions()
    }, [input.options, input.config, session, locale])

    const selectedKey = input.config?.key_selected

    const getInitialSelectedValues = (): string[] => {
        const selectedKey = input.config?.key_selected
        const raw = input.value ?? input.default?.[input.default?.code]

        if (Array.isArray(raw)) {
            return raw.map((item: any) => item[selectedKey]).filter(Boolean)
        }

        if (typeof raw === 'object' && raw !== null) {
            return [raw[selectedKey]].filter(Boolean)
        }

        return input.config?.data_default ?? []
    }


    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FactCheckIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                    <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 500, fontSize: '1rem' }}>
                        {input.default?.name || input.label}
                    </Typography>
                </Box>

                {input.ismodify === true && (
                    <Box
                        onClick={() => setEditing(prev => !prev)}
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', color: 'primary.main' }}
                    >
                        {editing ? <DoneIcon fontSize="small" /> : <EditIcon fontSize="small" />}
                    </Box>
                )}
            </Box>


            <Box
                sx={{
                    display: 'flex',
                    flexDirection: input.config?.layout === 'vertical' ? 'column' : 'row',
                    flexWrap: input.config?.layout === 'horizontal' ? 'wrap' : 'nowrap',
                    gap: 2,
                    alignItems: 'flex-start'
                }}
            >
                <Grid
                    container
                    spacing={2}
                    sx={{
                        flexDirection: input.config?.layout === 'vertical' ? 'column' : 'row',
                        flexWrap: input.config?.layout === 'horizontal' ? 'wrap' : 'nowrap'
                    }}
                    size={12}
                >
                    <Controller
                        name={input.default?.code}
                        control={control}
                        defaultValue={getInitialSelectedValues()}
                        render={({ field }) => (
                            <>
                                {options.map((opt, index) => {
                                    const checked = field.value?.includes(opt.value)
                                    const gridProps = parseClassToGrid(input.default?.class || '');
                                    const defaultGridSize = { xs: 12, sm: 6, md: 4 };
                                    const finalGridProps = Object.keys(gridProps).length > 0 ? gridProps : defaultGridSize;
                                    return (

                                        <Grid
                                            key={index}
                                            size={finalGridProps}
                                        >
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={checked}
                                                        disabled={!editing}
                                                        onChange={(e) => {
                                                            const updated = e.target.checked
                                                                ? [...(field.value || []), opt.value]
                                                                : (field.value || []).filter((v: string) => v !== opt.value)

                                                            field.onChange(updated)
                                                            setValue(input.default?.code, updated, { shouldDirty: true })
                                                            onChangeValue?.(input.default?.code, updated.join(','))
                                                        }}
                                                    />
                                                }
                                                label={<Typography sx={{ color: 'text.primary' }}>{opt.label}</Typography>}
                                            />
                                        </Grid>
                                    )
                                })}
                            </>
                        )}
                    />
                </Grid>
            </Box>
        </Box>

    )
}

export default ViewCheckBoxItem

