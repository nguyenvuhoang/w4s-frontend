'use client'

import { Locale } from '@/configs/i18n'
import { RoleChannel } from '@/types/systemTypes'
import Cookies from 'js-cookie'
import * as React from 'react'
import { useState } from 'react'

export default function useSelectApp() {
    const [loading, setLoading] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)

    const handleSelect = React.useCallback((ch: RoleChannel) => {
        try {
            if (typeof window !== 'undefined') {
                setSelectedId(ch?.channel_id || null)
                setLoading(true)
                if (ch && ch.channel_id) {
                    Cookies.set('app', ch.channel_id, { sameSite: 'strict', secure: true })
                }
                setTimeout(() => {
                    window.location.reload()
                }, 1000)
            }
        } catch (err) {
            setLoading(false)
            setSelectedId(null)
            console.error(err)
        }
    }, [])

    return { handleSelect, loading, selectedId }
}
