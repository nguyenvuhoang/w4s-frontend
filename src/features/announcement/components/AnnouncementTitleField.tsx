'use client'

import { memo, useEffect, useState } from 'react'
import { TextField } from '@mui/material'

type Props = {
    value: string
    label: string
    error?: string
    disabled?: boolean
    debounceMs?: number
    onDraftChange: (value: string) => void
    onCommit: (value: string) => void
}

const AnnouncementTitleField = memo(function AnnouncementTitleField({
    value,
    label,
    error,
    disabled,
    debounceMs = 300,
    onDraftChange,
    onCommit
}: Props) {
    const [localValue, setLocalValue] = useState(value)

    useEffect(() => {
        setLocalValue(value)
    }, [value])

    useEffect(() => {
        const timeoutId = window.setTimeout(() => onCommit(localValue), debounceMs)

        return () => window.clearTimeout(timeoutId)
    }, [debounceMs, localValue, onCommit])

    return (
        <TextField
            fullWidth
            required
            label={label}
            value={localValue}
            error={Boolean(error)}
            helperText={error}
            disabled={disabled}
            onChange={event => {
                const nextValue = event.target.value

                setLocalValue(nextValue)
                onDraftChange(nextValue)
            }}
        />
    )
})

export default AnnouncementTitleField
