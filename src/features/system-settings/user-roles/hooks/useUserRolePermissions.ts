'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

import type { Locale } from '@/configs/i18n'
import { buildOperationColumns, fetchRoleMenuTree, fetchRoleOperations, filterVisibleParentMenus, submitRoleRights } from '@/services/roleOperationApi'
import { createWorkflowError, getWorkflowErrorPresentation } from '@/shared/utils/workflowError'
import type { MenuItem, Operation, OperationBody } from '@shared/types/systemTypes'

import type { UserRolePermissionItem, UserRoleWorkflowErrorInfo } from '../types'

type PermissionDraft = {
  commandId: string
  commandIdDetail: string
  channelId: string
  invoke: boolean
  approve: boolean
}

const draftKey = (commandId: string, commandIdDetail = 'A') => `${commandId}:${commandIdDetail}`

const toBoolean = (value: unknown) => value === true || value === 1 || value === '1' || value === 'true' || value === 'T' || value === 'Y'

const toDraft = (item: Pick<OperationBody, 'command_id' | 'command_id_detail' | 'application_code' | 'invoke' | 'approve'>): PermissionDraft => ({
  commandId: item.command_id,
  commandIdDetail: String(item.command_id_detail || 'A'),
  channelId: item.application_code || 'BO',
  invoke: toBoolean(item.invoke),
  approve: false
})

const initialDrafts = (rights: UserRolePermissionItem[]): Record<string, PermissionDraft> => (
  rights.reduce<Record<string, PermissionDraft>>((drafts, item) => {
    const draft: PermissionDraft = {
      commandId: item.command_id,
      commandIdDetail: 'A',
      channelId: 'BO',
      invoke: item.invoke,
      approve: false
    }
    drafts[draftKey(draft.commandId, draft.commandIdDetail)] = draft
    return drafts
  }, {})
)

export const useUserRolePermissions = ({
  roleId,
  rights,
  locale,
  fallbackOperationCaption
}: {
  roleId: number
  rights: UserRolePermissionItem[]
  locale: Locale
  fallbackOperationCaption: string
}) => {
  const { data: session } = useSession()
  const sessiontoken = session?.user?.token as string | undefined
  const [menuParent, setMenuParent] = useState<MenuItem[]>([])
  const [menuLoading, setMenuLoading] = useState(false)
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null)
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null)
  const [operations, setOperations] = useState<Operation | undefined>()
  const [operationLoading, setOperationLoading] = useState(false)
  const [drafts, setDrafts] = useState<Record<string, PermissionDraft>>(() => initialDrafts(rights))
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [workflowError, setWorkflowError] = useState<UserRoleWorkflowErrorInfo | null>(null)
  const operationRequestId = useRef(0)
  const selectedMenuRef = useRef<MenuItem | null>(null)

  useEffect(() => {
    setDrafts(initialDrafts(rights))
    setDirty(false)
  }, [roleId, rights])

  useEffect(() => {
    if (!sessiontoken) return
    let cancelled = false

    const loadMenus = async () => {
      setMenuLoading(true)
      const menus = await fetchRoleMenuTree(sessiontoken, 'BO', locale)
      if (!cancelled) {
        setMenuParent(filterVisibleParentMenus(menus))
        setMenuLoading(false)
      }
    }

    void loadMenus()
    return () => { cancelled = true }
  }, [sessiontoken, locale])

  const toggleMenu = useCallback((commandId: string) => {
    setExpandedMenu(current => current === commandId ? null : commandId)
  }, [])

  const handleMenuClick = useCallback(async (menu: MenuItem) => {
    const requestId = ++operationRequestId.current
    selectedMenuRef.current = menu
    setSelectedMenu(menu)
    if (!sessiontoken) return

    setOperationLoading(true)
    setOperations(undefined)
    const data = await fetchRoleOperations(sessiontoken, menu.command_id, locale)
    if (requestId !== operationRequestId.current) return

    setOperations(data)
    setDrafts(current => {
      const next = { ...current }
      data.operation_body
        ?.filter(item => Number(item.role_id) === roleId)
        .forEach(item => {
          const draft = toDraft(item)
          const key = draftKey(draft.commandId, draft.commandIdDetail)
          if (!next[key]) next[key] = draft
        })
      return next
    })
    setOperationLoading(false)
  }, [locale, roleId, sessiontoken])

  useEffect(() => {
    const menu = selectedMenuRef.current
    if (menu) void handleMenuClick(menu)
  }, [handleMenuClick, locale])

  const roleOperations = useMemo(() => (
    operations?.operation_body?.filter(item => Number(item.role_id) === roleId) ?? []
  ), [operations?.operation_body, roleId])

  const dynamicColumns = useMemo(() => (
    buildOperationColumns(operations?.operation_header, fallbackOperationCaption)
  ), [fallbackOperationCaption, operations?.operation_header])

  const findDraft = useCallback((item: OperationBody): PermissionDraft => {
    const serverDraft = toDraft(item)
    return drafts[draftKey(serverDraft.commandId, serverDraft.commandIdDetail)] ?? serverDraft
  }, [drafts])

  const updatePermission = useCallback((item: OperationBody, checked: boolean) => {
    const fallback = toDraft(item)
    const key = draftKey(fallback.commandId, fallback.commandIdDetail)
    setDrafts(current => ({
      ...current,
      [key]: { ...(current[key] ?? fallback), invoke: checked, approve: false }
    }))
    setDirty(true)
  }, [])

  const visibleOperations = useMemo(() => {
    const rowsByCommand = new Map(roleOperations.map(row => [row.command_id, row]))
    return dynamicColumns.map(column => rowsByCommand.get(column.cmdid)).filter((row): row is OperationBody => Boolean(row))
  }, [dynamicColumns, roleOperations])
  const allCurrentPermissionsSelected = visibleOperations.length > 0 && visibleOperations.every(row => findDraft(row).invoke)
  const someCurrentPermissionsSelected = visibleOperations.some(row => findDraft(row).invoke)

  const setAllCurrentPermissions = useCallback((checked: boolean) => {
    setDrafts(current => {
      const next = { ...current }
      visibleOperations.forEach(row => {
        const fallback = toDraft(row)
        const key = draftKey(fallback.commandId, fallback.commandIdDetail)
        next[key] = { ...(next[key] ?? fallback), invoke: checked, approve: false }
      })
      return next
    })
    if (visibleOperations.length > 0) setDirty(true)
  }, [visibleOperations])

  const save = useCallback(async (fallbackMessage: string) => {
    if (!dirty) return { success: true }
    if (!sessiontoken) return { success: false, error: { message: fallbackMessage } }

    setSaving(true)
    setWorkflowError(null)
    try {
      const response = await submitRoleRights({
        sessiontoken,
        language: locale,
        items: Object.values(drafts).map(item => ({
          RoleId: roleId,
          CommandId: item.commandId,
          CommandIdDetail: item.commandIdDetail,
          Invoke: item.invoke,
          Approve: false,
          ChannelId: item.channelId
        }))
      })
      const dataresponse = (response as any)?.payload?.dataresponse ?? (response as any)?.dataresponse
      const errors = dataresponse?.errors ?? dataresponse?.error ?? (response as any)?.payload?.errors ?? (response as any)?.errors ?? []
      if ((response as any)?.status !== 200 || (Array.isArray(errors) && errors.length > 0)) {
        throw createWorkflowError(response, { fallback: fallbackMessage })
      }
      setDirty(false)
      return { success: true }
    } catch (error) {
      const presentation = getWorkflowErrorPresentation(error, fallbackMessage)
      const nextError = {
        message: presentation.message,
        workflowStep: presentation.workflowStep,
        executionId: presentation.executionId,
        technicalDetails: presentation.technicalDetails
      }
      setWorkflowError(nextError)
      return { success: false, error: nextError }
    } finally {
      setSaving(false)
    }
  }, [dirty, drafts, locale, roleId, sessiontoken])

  return {
    menuParent,
    menuLoading,
    expandedMenu,
    toggleMenu,
    selectedMenu,
    handleMenuClick,
    operationLoading,
    roleOperations,
    dynamicColumns,
    findDraft,
    updatePermission,
    allCurrentPermissionsSelected,
    someCurrentPermissionsSelected,
    setAllCurrentPermissions,
    dirty,
    saving,
    workflowError,
    save
  }
}

export type UseUserRolePermissionsReturn = ReturnType<typeof useUserRolePermissions>
