import { Locale } from '@/configs/i18n'
import { MenuItem, PageData } from '@/types/systemTypes'
import SwalAlert from '@/utils/SwalAlert'
import { SelectChangeEvent } from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'

export type ViewMode = 'table' | 'tree'

type MenuManagementOptions = {
    sessionToken?: string
    locale?: Locale
    onDataUpdate?: (data: MenuItem[]) => void
    initialPagination?: {
        total_count?: number
        total_pages?: number
        has_previous_page?: boolean
        has_next_page?: boolean
    }
}

export const useMenuManagement = (initialData: MenuItem[], options?: MenuManagementOptions) => {
    const [loading, setLoading] = useState(false)
    const [selected, setSelected] = useState<string[]>([])
    const [page, setPage] = useState(1) // UI uses 1-based, convert to 0-based for API
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [jumpPage, setJumpPage] = useState<number>(1)
    const [filteredData, setFilteredData] = useState<MenuItem[]>(initialData)
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
    const [viewMode, setViewMode] = useState<ViewMode>('table')
    
    // Server pagination info
    const [totalCount, setTotalCount] = useState<number>(options?.initialPagination?.total_count || 0)
    const [totalPages, setTotalPages] = useState<number>(options?.initialPagination?.total_pages || 0)
    const [hasPreviousPage, setHasPreviousPage] = useState<boolean>(options?.initialPagination?.has_previous_page || false)
    const [hasNextPage, setHasNextPage] = useState<boolean>(options?.initialPagination?.has_next_page || false)
    
    // Update pagination when initialPagination changes
    useEffect(() => {
        if (options?.initialPagination) {
            setTotalCount(options.initialPagination.total_count || 0)
            setTotalPages(options.initialPagination.total_pages || 0)
            setHasPreviousPage(options.initialPagination.has_previous_page || false)
            setHasNextPage(options.initialPagination.has_next_page || false)
        }
    }, [options?.initialPagination])
    
    // Add Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [modalLoading, setModalLoading] = useState(false)
    const [modalError, setModalError] = useState<string | null>(null)
    const [modalSuccess, setModalSuccess] = useState(false)
    const [modalSubmittedData, setModalSubmittedData] = useState<any>(null)
    
    // View Modal states
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)
    const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null)
    
    // Edit Modal states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editMenuItem, setEditMenuItem] = useState<MenuItem | null>(null)
    const [editLoading, setEditLoading] = useState(false)
    const [editError, setEditError] = useState<string | null>(null)
    const [editSuccess, setEditSuccess] = useState(false)
    const [editSubmittedData, setEditSubmittedData] = useState<any>(null)
    
    // Delete Modal states
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    
    // Store last search params in state (not ref) to avoid closure issues
    const [lastSearchParams, setLastSearchParams] = useState<any>(null)

    // Selection handlers
    const hasSelection = selected.length > 0
    const selectedId = selected[0] ?? null

    const toggleAll = (allIds: string[]) => {
        const isAllSelected = allIds.length > 0 && selected.length === allIds.length
        if (isAllSelected) {
            setSelected([])
        } else {
            setSelected(allIds)
        }
    }

    const toggleOne = (id: string) => {
        if (selected.includes(id)) {
            setSelected([])
        } else {
            setSelected([id])
        }
    }

    // Expand/collapse handlers
    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedRows)
        if (newExpanded.has(id)) {
            newExpanded.delete(id)
        } else {
            newExpanded.add(id)
        }
        setExpandedRows(newExpanded)
    }

    const expandAll = (parentIds: string[]) => {
        setExpandedRows(new Set(parentIds))
    }

    const collapseAll = () => {
        setExpandedRows(new Set())
    }

    // Pagination handlers
    const handlePageChange = async (_: any, newPage: number) => {
        setPage(newPage)
        setSelected([])
        
        // Reload data with new page if we have search params
        if (!lastSearchParams) {
            return
        }
        
        setLoading(true)
        
        try {
            const [{ systemServiceApi }, { isValidResponse: validate }] = await Promise.all([
                import('@/servers/system-service'),
                import('@/utils/isValidResponse')
            ])
            
            const response = await systemServiceApi.loadMenu({
                ...lastSearchParams,
                pageindex: newPage - 1, // Convert to 0-based
                pagesize: rowsPerPage
            })
            
            if (
                !validate(response) ||
                (response.payload.dataresponse.errors && response.payload.dataresponse.errors.length > 0)
            ) {
                const execute_id = response.payload.dataresponse.errors[0]?.execute_id
                const errorinfo = response.payload.dataresponse.errors[0]?.info
                console.error('ExecutionID:', execute_id + ' - ' + errorinfo)
                return
            }

            const responseData = response.payload.dataresponse.data as unknown as PageData<MenuItem>
            const result = responseData?.items || []

            // Update pagination info from server
            setTotalCount(responseData.total_count || 0)
            setTotalPages(responseData.total_pages || 0)
            setHasPreviousPage(responseData.has_previous_page || false)
            setHasNextPage(responseData.has_next_page || false)

            options?.onDataUpdate?.(result)
            setFilteredData(result)
        } catch (error: any) {
            console.error('Error loading menu data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handlePageSizeChange = async (event: SelectChangeEvent<number>) => {
        const newPageSize = event.target.value as number
        setRowsPerPage(newPageSize)
        setPage(1)
        setSelected([])
        
        // Reload with new page size
        if (lastSearchParams) {
            await handlePageChange(null, 1)
        }
    }

    const handleJumpPage: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = (event) => {
        const targetPage = parseInt(event.target.value)
        if (targetPage >= 1 && targetPage <= totalPages) {
            setPage(targetPage)
            setSelected([])
        }
        setJumpPage(1)
    }

    // Search/filter handler
    const applyFilters = (result: MenuItem[]) => {
        setFilteredData(result)
        setPage(1)
        setSelected([])
        setExpandedRows(new Set())
    }

    // Search handler
    const handleSearch = async (formData: any, menuData: MenuItem[], resetPage: boolean = false) => {
        if (resetPage) {
            setPage(1)
        }
        
        setLoading(true)

        try {
            const { systemServiceApi } = await import('@/servers/system-service')
            const { isValidResponse } = await import('@/utils/isValidResponse')

            // Build search text from form data
            const searchParts: string[] = []
            if (formData.command_id) searchParts.push(formData.command_id)
            if (formData.command_name) searchParts.push(formData.command_name)
            const searchtext = searchParts.join(' ')

            const response = await systemServiceApi.loadMenu({
                sessiontoken: options?.sessionToken as string,
                pageindex: resetPage ? 0 : (page - 1), // Convert 1-based to 0-based for server
                pagesize: rowsPerPage,
                searchtext: searchtext,
                language: options?.locale || 'en',
            })

            if (
                !isValidResponse(response) ||
                (response.payload.dataresponse.errors && response.payload.dataresponse.errors.length > 0)
            ) {
                const execute_id = response.payload.dataresponse.errors[0]?.execute_id
                const errorinfo = response.payload.dataresponse.errors[0]?.info
                console.error('ExecutionID:', execute_id + ' - ' + errorinfo)
                setLoading(false)
                return
            }

            const responseData = response.payload.dataresponse.data as unknown as PageData<MenuItem>
            let result = responseData?.items || []

            // Apply additional filters
            if (formData.application_code !== 'ALL') {
                result = result.filter((item: MenuItem) => item.application_code === formData.application_code)
            }
            if (formData.command_type !== 'ALL') {
                result = result.filter((item: MenuItem) => item.command_type === formData.command_type)
            }
            if (formData.is_visible !== 'ALL') {
                const visibleValue = formData.is_visible === 'true'
                result = result.filter((item: MenuItem) => item.is_visible === visibleValue)
            }

            // Update pagination info from server
            setTotalCount(responseData.total_count || 0)
            setTotalPages(responseData.total_pages || 0)
            setHasPreviousPage(responseData.has_previous_page || false)
            setHasNextPage(responseData.has_next_page || false)

            options?.onDataUpdate?.(result)
            setFilteredData(result)
            setSelected([])
            
            // Store search params for pagination
            setLastSearchParams({
                sessiontoken: options?.sessionToken as string,
                searchtext: searchtext,
                language: options?.locale || 'en'
            })
            
            setLoading(false)
        } catch (error: any) {
            console.error('Error loading menu data:', error)
            setLoading(false)
        }
    }
    
    // Remove auto-reload useEffect - it causes infinite loop

    // Add Menu handler
    const handleAddMenu = async (formData: any) => {
        setModalLoading(true)
        setModalError(null)

        try {
            // Build command_name_language JSON string
            const commandNameLanguage = JSON.stringify({
                en: formData.command_name_en || formData.command_name,
                vi: formData.command_name_vi || formData.command_name
            })

            const payload = {
                application_code: formData.application_code,
                command_id: formData.command_id,
                parent_id: formData.parent_id,
                command_name: formData.command_name,
                command_name_language: commandNameLanguage,
                command_type: formData.command_type,
                command_uri: formData.command_uri || '',
                enabled: formData.enabled,
                is_visible: formData.is_visible,
                display_order: Number(formData.display_order),
                group_menu_icon: formData.group_menu_icon || '',
                group_menu_visible: formData.group_menu_visible || '1',
                group_menu_list_authorize_form: formData.group_menu_list_authorize_form || ''
            }

            const { systemServiceApi } = await import('@/servers/system-service')
            const { isValidResponse } = await import('@/utils/isValidResponse')

            const submitApi = await systemServiceApi.createMenu({
                sessiontoken: options?.sessionToken as string,
                language: options?.locale || 'en',
                fields: payload
            })

            if (
                !isValidResponse(submitApi) ||
                (submitApi.payload.dataresponse.errors && submitApi.payload.dataresponse.errors.length > 0)
            ) {
                const execute_id = submitApi.payload.dataresponse.errors[0]?.execute_id
                const errorinfo = submitApi.payload.dataresponse.errors[0]?.info
                const errorMessage = `Error ${execute_id}: ${errorinfo || 'Failed to create menu'}`
                setModalError(errorMessage)
                setModalLoading(false)
                return
            }

            // Success
            setModalSubmittedData(formData)
            setModalSuccess(true)
            setModalLoading(false)
            
            // Auto reload data after successful add
            if (lastSearchParams) {
                // Reload with last search params
                const reloadResponse = await systemServiceApi.loadMenu({
                    ...lastSearchParams,
                    pageindex: page - 1,
                    pagesize: rowsPerPage
                })
                
                if (isValidResponse(reloadResponse) && 
                    (!reloadResponse.payload.dataresponse.errors || reloadResponse.payload.dataresponse.errors.length === 0)) {
                    const reloadData = reloadResponse.payload.dataresponse.data as unknown as PageData<MenuItem>
                    const reloadResult = reloadData?.items || []
                    
                    setTotalCount(reloadData.total_count || 0)
                    setTotalPages(reloadData.total_pages || 0)
                    setHasPreviousPage(reloadData.has_previous_page || false)
                    setHasNextPage(reloadData.has_next_page || false)
                    
                    options?.onDataUpdate?.(reloadResult)
                    setFilteredData(reloadResult)
                    setSelected([])
                }
            } else {
                // If no search params, do a fresh load
                const reloadResponse = await systemServiceApi.loadMenu({
                    sessiontoken: options?.sessionToken as string,
                    pageindex: 0,
                    pagesize: rowsPerPage,
                    searchtext: '',
                    language: options?.locale || 'en'
                })
                
                if (isValidResponse(reloadResponse) && 
                    (!reloadResponse.payload.dataresponse.errors || reloadResponse.payload.dataresponse.errors.length === 0)) {
                    const reloadData = reloadResponse.payload.dataresponse.data as unknown as PageData<MenuItem>
                    const reloadResult = reloadData?.items || []
                    
                    setTotalCount(reloadData.total_count || 0)
                    setTotalPages(reloadData.total_pages || 0)
                    setHasPreviousPage(reloadData.has_previous_page || false)
                    setHasNextPage(reloadData.has_next_page || false)
                    
                    options?.onDataUpdate?.(reloadResult)
                    setFilteredData(reloadResult)
                    setSelected([])
                    setPage(1)
                }
            }
        } catch (error: any) {
            console.error('Error creating menu:', error)
            setModalError(error?.message || 'An unexpected error occurred. Please try again.')
            setModalLoading(false)
        }
    }

    const openAddModal = () => setIsAddModalOpen(true)
    const closeAddModal = () => {
        setIsAddModalOpen(false)
        setModalError(null)
        setModalSuccess(false)
        setModalSubmittedData(null)
    }

    // View Menu handler
    const handleViewMenu = (menuData: MenuItem[]) => {
        if (selected.length === 1) {
            const selectedId = selected[0]
            const menuItem = menuData.find((item: MenuItem) => item.command_id === selectedId)
            if (menuItem) {
                setSelectedMenuItem(menuItem)
                setIsViewModalOpen(true)
            }
        }
    }

    const closeViewModal = () => {
        setIsViewModalOpen(false)
        setSelectedMenuItem(null)
    }

    // Edit Menu handler
    const openEditModal = (menuData: MenuItem[]) => {
        if (selected.length === 1) {
            const selectedId = selected[0]
            const menuItem = menuData.find((item: MenuItem) => item.command_id === selectedId)
            if (menuItem) {
                setEditMenuItem(menuItem)
                setIsEditModalOpen(true)
            }
        }
    }

    const handleEditMenu = async (formData: any) => {
        setEditLoading(true)
        setEditError(null)

        try {
            // Build command_name_language JSON string
            const commandNameLanguage = JSON.stringify({
                en: formData.command_name_en || formData.command_name,
                vi: formData.command_name_vi || formData.command_name
            })

            const payload = {
                application_code: formData.application_code,
                command_id: formData.command_id,
                parent_id: formData.parent_id,
                command_name: formData.command_name,
                command_name_language: commandNameLanguage,
                command_type: formData.command_type,
                command_uri: formData.command_uri || '',
                enabled: formData.enabled,
                is_visible: formData.is_visible,
                display_order: Number(formData.display_order),
                group_menu_icon: formData.group_menu_icon || '',
                group_menu_visible: formData.group_menu_visible || '1',
                group_menu_list_authorize_form: formData.group_menu_list_authorize_form || ''
            }

            const { systemServiceApi } = await import('@/servers/system-service')
            const { isValidResponse } = await import('@/utils/isValidResponse')

            const submitApi = await systemServiceApi.updateMenu({
                sessiontoken: options?.sessionToken as string,
                language: options?.locale || 'en',
                fields: payload
            })

            if (
                !isValidResponse(submitApi) ||
                (submitApi.payload.dataresponse.errors && submitApi.payload.dataresponse.errors.length > 0)
            ) {
                const execute_id = submitApi.payload.dataresponse.errors[0]?.execute_id
                const errorinfo = submitApi.payload.dataresponse.errors[0]?.info
                const errorMessage = `Error ${execute_id}: ${errorinfo || 'Failed to update menu'}`
                setEditError(errorMessage)
                setEditLoading(false)
                return
            }

            // Success
            setEditSubmittedData(formData)
            setEditSuccess(true)
            setEditLoading(false)
        } catch (error: any) {
            console.error('Error updating menu:', error)
            setEditError(error?.message || 'An unexpected error occurred. Please try again.')
            setEditLoading(false)
        }
    }

    const closeEditModal = () => {
        setIsEditModalOpen(false)
        setEditMenuItem(null)
        setEditError(null)
        setEditSuccess(false)
        setEditSubmittedData(null)
    }

    // Delete handler
    const handleDeleteMenu = async (menuData: MenuItem[]) => {
        if (selected.length !== 1 || !options?.sessionToken || !options?.locale) return

        setDeleteLoading(true)
        setShowDeleteConfirm(false)

        try {
            const selectedId = selected[0]
            const menuItem = menuData.find(item => item.command_id === selectedId)

            if (!menuItem) {
                setDeleteLoading(false)
                return
            }

            const { systemServiceApi } = await import('@/servers/system-service')
            const { isValidResponse } = await import('@/utils/isValidResponse')

            const submitApi = await systemServiceApi.deleteMenu({
                sessiontoken: options.sessionToken,
                language: options?.locale || 'en',
                fields: {
                    command_id: menuItem.command_id,
                    application_code: menuItem.application_code
                }
            })

            if (
                !isValidResponse(submitApi) ||
                (submitApi.payload.dataresponse.errors && submitApi.payload.dataresponse.errors.length > 0)
            ) {
                const execute_id = submitApi.payload.dataresponse.execution_id || submitApi.payload.dataresponse.errors[0]?.execute_id
                const errorinfo = submitApi.payload.dataresponse.errors[0]?.info
                SwalAlert("error", `ExecutionId: ${execute_id}: ${errorinfo || 'Failed to delete menu'}`, 'center')
                setDeleteLoading(false)
                return
            }

            // Success - update data
            const updatedData = menuData.filter(item => item.command_id !== selectedId)
            applyFilters(updatedData)
            options?.onDataUpdate?.(updatedData)
            setDeleteLoading(false)
        } catch (error: any) {
            console.error('Error deleting menu:', error)
            setDeleteLoading(false)
        }
    }

    const openDeleteConfirm = () => setShowDeleteConfirm(true)
    const closeDeleteConfirm = () => setShowDeleteConfirm(false)

    return {
        // State
        loading,
        setLoading,
        selected,
        page,
        rowsPerPage,
        jumpPage,
        filteredData,
        expandedRows,
        viewMode,
        setViewMode,
        
        // Server pagination info
        totalCount,
        totalPages,
        hasPreviousPage,
        hasNextPage,
        
        // Add Modal State
        isAddModalOpen,
        modalLoading,
        modalError,
        modalSuccess,
        modalSubmittedData,
        
        // View Modal State
        isViewModalOpen,
        selectedMenuItem,
        
        // Edit Modal State
        isEditModalOpen,
        editMenuItem,
        editLoading,
        editError,
        editSuccess,
        editSubmittedData,
        
        // Delete Modal State
        deleteLoading,
        showDeleteConfirm,
        
        // Derived state
        hasSelection,
        selectedId,
        
        // Handlers
        toggleAll,
        toggleOne,
        toggleExpand,
        expandAll,
        collapseAll,
        handlePageChange,
        handlePageSizeChange,
        handleJumpPage,
        applyFilters,
        
        // CRUD Handlers
        handleSearch,
        handleAddMenu,
        openAddModal,
        closeAddModal,
        handleViewMenu,
        closeViewModal,
        openEditModal,
        handleEditMenu,
        closeEditModal,
        handleDeleteMenu,
        openDeleteConfirm,
        closeDeleteConfirm,
        
        // Helper functions
        clearModalError: () => setModalError(null),
        clearEditError: () => setEditError(null)
    }
}
