import type { SelectChangeEvent } from '@mui/material/Select'
import { useState } from 'react'

import type { Locale } from '@/configs/i18n'

import { userSessionService } from '../services/userSessionService'
import type { UserSessionFilterModel, UserSessionItem, UserSessionSearchResponse } from '../types'

type Params = {
    sessiontoken?: string
    language?: Locale
    initialFilter: UserSessionFilterModel
    initialData: UserSessionSearchResponse
    initialError?: string | null
}

export const useUserSessions = ({
    sessiontoken,
    language,
    initialFilter,
    initialData,
    initialError = null
}: Params) => {
    const [filter, setFilter] = useState(initialFilter)
    const [rows, setRows] = useState<UserSessionItem[]>(initialData.items)
    const [totalCount, setTotalCount] = useState(initialData.total_count)
    const [totalPages, setTotalPages] = useState(initialData.total_pages)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(initialError)

    const loadData = async (nextFilter: UserSessionFilterModel = filter) => {
        setLoading(true)
        setError(null)

        try {
            const response = await userSessionService.searchUserSessions({
                sessiontoken,
                language,
                filter: nextFilter
            })

            setRows(response.items)
            setTotalCount(response.total_count)
            setTotalPages(response.total_pages)
            setFilter({ ...nextFilter, page_index: response.page_index, page_size: response.page_size })

            return response
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'Unable to load session activity.')

            return undefined
        } finally {
            setLoading(false)
        }
    }

    const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
        void loadData({ ...filter, page_size: Number(event.target.value), page_index: 1 })
    }

    const handlePageChange = (_: React.ChangeEvent<unknown>, page_index: number) => {
        void loadData({ ...filter, page_index })
    }

    const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const page_index = Math.min(Math.max(Number(event.target.value) || 1, 1), Math.max(totalPages, 1))

        void loadData({ ...filter, page_index })
    }

    return {
        filter,
        rows,
        totalCount,
        totalPages,
        loading,
        error,
        loadData,
        handlePageSizeChange,
        handlePageChange,
        handleJumpPage
    }
}
