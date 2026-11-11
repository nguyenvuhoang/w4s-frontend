import type { SelectChangeEvent } from '@mui/material/Select'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import { contactInfoText, emptyContactInfoFilter } from '../components/contactInfoHelpers'
import { contactInfoService } from '../service'
import type {
  ContactInfoDictionary,
  ContactInfoFilterModel,
  ContactInfoItem,
  ContactInfoSearchResponse,
  CreateContactInfoFormValues
} from '../types'

type Params = {
  dictionary: ContactInfoDictionary
  sessiontoken?: string
  language?: any
  initialFilter: ContactInfoFilterModel
  initialData: ContactInfoSearchResponse
}

export function useContactInfoSearch({
  dictionary,
  sessiontoken,
  language,
  initialFilter,
  initialData
}: Params) {
  const workingProject = useWorkingProject()
  const [filter, setFilter] = useState(initialFilter)
  const [draftFilter, setDraftFilter] = useState(initialFilter)
  const [rows, setRows] = useState<ContactInfoItem[]>(initialData.items)
  const [totalCount, setTotalCount] = useState(initialData.total_count)
  const [totalPages, setTotalPages] = useState(initialData.total_pages)
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [formLoading, setFormLoading] = useState(false)
  const [editingContact, setEditingContact] = useState<ContactInfoItem | null>(null)
  const editRequestSeq = useRef(0)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ContactInfoItem | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const selectedProject = workingProject

  const loadData = useCallback(async (nextFilter: ContactInfoFilterModel = filter) => {
    if (!nextFilter.project_id) {
      setRows([])
      setTotalCount(0)
      setTotalPages(0)
      setFilter(nextFilter)
      setDraftFilter(nextFilter)
      setError(null)

      return undefined
    }

    setLoadingContacts(true)
    setError(null)

    try {
      const response = await contactInfoService.simpleSearchProjectContacts({
        sessiontoken,
        language,
        filter: nextFilter
      })

      const resolvedFilter = {
        ...nextFilter,
        page_index: response.page_index,
        page_size: response.page_size
      }

      setRows(response.items)
      setTotalCount(response.total_count)
      setTotalPages(response.total_pages)
      setFilter(resolvedFilter)
      setDraftFilter(resolvedFilter)

      return response
    } catch (err) {
      setRows([])
      setTotalCount(0)
      setTotalPages(0)
      setError(err instanceof Error ? err.message : contactInfoText(dictionary, 'load_contacts_failed', 'Unable to load project contacts.'))

      return undefined
    } finally {
      setLoadingContacts(false)
    }
  }, [dictionary, filter, language, sessiontoken])

  useEffect(() => {
    if (!workingProject) return
    if (filter.project_id === workingProject.id) return

    void loadData({ ...emptyContactInfoFilter, project_id: workingProject.id, page_index: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workingProject?.id])

  const updateDraftFilter = <K extends keyof ContactInfoFilterModel>(key: K, value: ContactInfoFilterModel[K]) => {
    setDraftFilter(current => ({ ...current, [key]: value }))
  }

  const handleSearch = () => {
    void loadData({ ...draftFilter, page_index: 1 })
  }

  const handleReset = () => {
    void loadData({ ...emptyContactInfoFilter, project_id: draftFilter.project_id })
  }

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    const page_size = Number(event.target.value)

    void loadData({ ...filter, page_size, page_index: 1 })
  }

  const handlePageChange = (_: React.ChangeEvent<unknown>, page_index: number) => {
    void loadData({ ...filter, page_index })
  }

  const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const page_index = Math.min(Math.max(Number(event.target.value) || 1, 1), Math.max(totalPages, 1))

    void loadData({ ...filter, page_index })
  }

  const openCreate = () => {
    if (!selectedProject) {
      setError(contactInfoText(dictionary, 'select_project_before_create', 'Please select a project before creating a contact.'))

      return
    }

    setCreateError(null)
    setFormMode('create')
    setEditingContact(null)
    setCreateOpen(true)
  }

  const closeCreate = () => {
    if (createLoading) return

    editRequestSeq.current += 1
    setCreateOpen(false)
    setCreateError(null)
    setEditingContact(null)
    setFormLoading(false)
  }

  const openEdit = async (row: ContactInfoItem) => {
    if (!row.id) return

    const requestSeq = editRequestSeq.current + 1

    editRequestSeq.current = requestSeq
    setFormMode('edit')
    setCreateOpen(true)
    setCreateError(null)
    setEditingContact(null)
    setFormLoading(true)

    try {
      const response = await contactInfoService.getProjectContactById({
        sessiontoken,
        language,
        id: row.id
      })

      if (editRequestSeq.current !== requestSeq) return

      setEditingContact(response ?? row)
    } catch (err) {
      if (editRequestSeq.current !== requestSeq) return

      setCreateError(err instanceof Error ? err.message : contactInfoText(dictionary, 'load_detail_failed', 'Unable to load project contact detail.'))
      setEditingContact(row)
    } finally {
      if (editRequestSeq.current === requestSeq) setFormLoading(false)
    }
  }

  const createContact = async (values: CreateContactInfoFormValues) => {
    if (!selectedProject) {
      setCreateError(contactInfoText(dictionary, 'select_project_before_create', 'Please select a project before creating a contact.'))

      return
    }

    setCreateLoading(true)
    setCreateError(null)

    try {
      await contactInfoService.createProjectContact({
        sessiontoken,
        language,
        fields: {
          project_id: selectedProject.id,
          contact_type: values.contact_type,
          name: values.name.trim(),
          phone: values.phone.trim(),
          email: values.email.trim() || null,
          address: values.address.trim() || null,
          working_hours: values.working_hours.trim() || null,
          note: values.note.trim() || null,
          display_order: values.display_order === '' ? null : Number(values.display_order)
        }
      })

      setCreateOpen(false)
      setSuccessMessage(contactInfoText(dictionary, 'create_success', 'Project contact has been created.'))
      await loadData({ ...filter, project_id: selectedProject.id, page_index: 1 })
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : contactInfoText(dictionary, 'create_failed', 'Unable to create project contact.'))
    } finally {
      setCreateLoading(false)
    }
  }

  const updateContact = async (values: CreateContactInfoFormValues) => {
    if (!editingContact?.id) return

    setCreateLoading(true)
    setCreateError(null)

    try {
      await contactInfoService.updateProjectContact({
        sessiontoken,
        language,
        fields: {
          id: editingContact.id,
          contact_type: values.contact_type,
          name: values.name.trim(),
          phone: values.phone.trim(),
          email: values.email.trim() || null,
          address: values.address.trim() || null,
          working_hours: values.working_hours.trim() || null,
          note: values.note.trim() || null,
          display_order: values.display_order === '' ? null : Number(values.display_order),
          status: values.status || editingContact.status || 'A'
        }
      })

      setCreateOpen(false)
      setEditingContact(null)
      setSuccessMessage(contactInfoText(dictionary, 'update_success', 'Project contact has been updated.'))
      await loadData(filter)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : contactInfoText(dictionary, 'update_failed', 'Unable to update project contact.'))
    } finally {
      setCreateLoading(false)
    }
  }

  const closeSuccessMessage = () => {
    setSuccessMessage(null)
  }

  const openDeleteConfirm = (row: ContactInfoItem) => {
    if (!row.id) return

    setDeleteTarget(row)
    setDeleteError(null)
  }

  const closeDeleteConfirm = () => {
    if (deleteLoading) return

    setDeleteTarget(null)
    setDeleteError(null)
  }

  const deleteContact = async () => {
    if (!deleteTarget?.id) return

    setDeleteLoading(true)
    setDeleteError(null)

    try {
      await contactInfoService.deleteProjectContact({
        sessiontoken,
        language,
        id: deleteTarget.id
      })

      setDeleteTarget(null)
      setSuccessMessage(contactInfoText(dictionary, 'delete_success', 'Project contact has been deleted.'))
      await loadData(filter)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : contactInfoText(dictionary, 'delete_failed', 'Unable to delete project contact.'))
    } finally {
      setDeleteLoading(false)
    }
  }

  return {
    filter,
    draftFilter,
    rows,
    totalCount,
    loadingContacts,
    error,
    selectedProject,
    createOpen,
    createLoading,
    createError,
    formMode,
    formLoading,
    editingContact,
    successMessage,
    deleteTarget,
    deleteLoading,
    deleteError,
    loadData,
    updateDraftFilter,
    handleSearch,
    handleReset,
    handlePageSizeChange,
    handlePageChange,
    handleJumpPage,
    openCreate,
    closeCreate,
    createContact,
    updateContact,
    openEdit,
    closeSuccessMessage,
    openDeleteConfirm,
    closeDeleteConfirm,
    deleteContact
  }
}
