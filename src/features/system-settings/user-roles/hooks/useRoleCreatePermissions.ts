'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

import type { Locale } from '@/configs/i18n'
import { buildOperationColumns, fetchRoleMenuTree, fetchRoleOperations, filterVisibleParentMenus, submitRoleRights as submitRoleRightsApi } from '@/services/roleOperationApi'
import { getWorkflowErrorPresentation } from '@/shared/utils/workflowError'
import type { MenuItem, Operation } from '@shared/types/systemTypes'

import type { UserRoleRightItem, UserRoleWorkflowErrorInfo } from '../types'

type CommandMeta = {
  command_id: string
  command_id_detail: string
  application_code: string
}

type MenuMeta = {
  selfInvoke: CommandMeta | null
  commands: Record<string, CommandMeta>
}

type MenuSelectionState = {
  selfInvoke: boolean
  commands: Record<string, boolean>
}

const EMPTY_SELECTION: MenuSelectionState = { selfInvoke: false, commands: {} }

// Man tao moi Role chua co role_id nen khong the goi WF_BO_UPDATE_RIGHT ngay khi tick checkbox
// nhu tab Invoke-Approve o roles-profile. Hook nay tai dung 3 workflow WF_BO_LOAD_MENU /
// WF_BO_LOAD_OPERATION / WF_BO_UPDATE_RIGHT qua @/services/roleOperationApi (shared voi
// src/services/useInvokeApprove.ts), nhung chi luu lua chon o local state (draft) roi gop lai
// thanh payload khi role duoc tao xong.
//
// `enabled` dieu khien thoi diem WF_BO_LOAD_MENU duoc goi lan dau: parent component chi truyen
// true khi user da mo tab "Phan quyen thuc hien & phe duyet" it nhat 1 lan (khong load ngay khi
// vua vao man Create, va khong goi lai moi lan chuyen tab qua lai vi da co menuLoaded cache).
export const useRoleCreatePermissions = ({
  locale,
  enabled,
  fallbackOperationCaption
}: {
  locale: Locale
  enabled: boolean
  fallbackOperationCaption: string
}) => {
  const { data: session } = useSession()
  const sessiontoken = session?.user?.token as string | undefined

  const [menuParent, setMenuParent] = useState<MenuItem[]>([])
  const [menuLoaded, setMenuLoaded] = useState(false)
  const [menuLoading, setMenuLoading] = useState(false)

  const [expandedMenu, setExpandedMenu] = useState<string | null>(null)
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null)
  const [operations, setOperations] = useState<Operation | undefined>(undefined)
  const [operationLoading, setOperationLoading] = useState(false)
  const operationRequestId = useRef(0)
  const selectedMenuRef = useRef<MenuItem | null>(null)

  const [selections, setSelections] = useState<Record<string, MenuSelectionState>>({})
  const [menuMeta, setMenuMeta] = useState<Record<string, MenuMeta>>({})

  useEffect(() => {
    if (!enabled || !sessiontoken || menuLoaded) return

    let cancelled = false

    const loadMenu = async () => {
      setMenuLoading(true)
      const items = await fetchRoleMenuTree(sessiontoken, 'BO', locale)

      // TAM THOI DEBUG - xoa sau khi xac dinh xong nguyen nhan menu rong.
      // eslint-disable-next-line no-console

      if (cancelled) return

      const parents = filterVisibleParentMenus(items)

      if (items.length > 0 && parents.length === 0) {
      }

      // eslint-disable-next-line no-console

      setMenuParent(parents)
      setMenuLoaded(true)
      setMenuLoading(false)
    }

    void loadMenu()

    return () => { cancelled = true }
  }, [enabled, sessiontoken, menuLoaded, locale])

  const toggleMenu = useCallback((commandId: string) => {
    setExpandedMenu(prev => (prev === commandId ? null : commandId))
  }, [])

  const handleMenuClick = useCallback(async (menu: MenuItem) => {
    const requestId = ++operationRequestId.current
    selectedMenuRef.current = menu
    setSelectedMenu(menu)
    setSelections(prev => (prev[menu.command_id] ? prev : { ...prev, [menu.command_id]: EMPTY_SELECTION }))

    if (!sessiontoken) return

    setOperationLoading(true)
    setOperations(undefined)
    const data = await fetchRoleOperations(sessiontoken, menu.command_id, locale)
    if (requestId !== operationRequestId.current) return

    setOperations(data)

    setMenuMeta(prev => {
      if (prev[menu.command_id]) return prev

      let selfInvoke: CommandMeta | null = null
      const commands: Record<string, CommandMeta> = {}

      data.operation_body?.forEach(row => {
        if (row.command_type === 'M' && !selfInvoke) {
          selfInvoke = {
            command_id: row.command_id,
            command_id_detail: String(row.command_id_detail || 'A'),
            application_code: row.application_code
          }
        }
        if (row.command_type === 'C' && !commands[row.command_id]) {
          commands[row.command_id] = {
            command_id: row.command_id,
            command_id_detail: String(row.command_id_detail || 'A'),
            application_code: row.application_code
          }
        }
      })

      if (!selfInvoke) {
        selfInvoke = { command_id: menu.command_id, command_id_detail: 'A', application_code: menu.application_code }
      }

      data.operation_header?.forEach(header => {
        if (!commands[header.cmdid]) {
          commands[header.cmdid] = { command_id: header.cmdid, command_id_detail: 'A', application_code: menu.application_code }
        }
      })

      return { ...prev, [menu.command_id]: { selfInvoke, commands } }
    })

    setOperationLoading(false)
  }, [locale, sessiontoken])

  useEffect(() => {
    const menu = selectedMenuRef.current
    if (menu) void handleMenuClick(menu)
  }, [handleMenuClick, locale])

  const dynamicColumns = useMemo(() => (
    buildOperationColumns(operations?.operation_header, fallbackOperationCaption)
  ), [fallbackOperationCaption, operations?.operation_header])

  const currentMenuId = selectedMenu?.command_id ?? ''
  const currentSelection = selections[currentMenuId] ?? EMPTY_SELECTION

  const handleSelfInvokeChange = useCallback((checked: boolean) => {
    if (!currentMenuId) return
    setSelections(prev => ({
      ...prev,
      [currentMenuId]: { selfInvoke: checked, commands: prev[currentMenuId]?.commands ?? {} }
    }))
  }, [currentMenuId])

  const handleCommandChange = useCallback((cmdid: string, checked: boolean) => {
    if (!currentMenuId) return
    setSelections(prev => ({
      ...prev,
      [currentMenuId]: {
        selfInvoke: prev[currentMenuId]?.selfInvoke ?? false,
        commands: { ...(prev[currentMenuId]?.commands ?? {}), [cmdid]: checked }
      }
    }))
  }, [currentMenuId])

  const visibleCommandIds = useMemo(() => dynamicColumns.map(column => column.cmdid), [dynamicColumns])
  const allCurrentCommandsSelected = visibleCommandIds.length > 0 && currentSelection.selfInvoke && visibleCommandIds.every(cmdid => currentSelection.commands[cmdid] ?? false)
  const someCurrentCommandsSelected = currentSelection.selfInvoke || visibleCommandIds.some(cmdid => currentSelection.commands[cmdid] ?? false)

  const handleAllCurrentCommandsChange = useCallback((checked: boolean) => {
    if (!currentMenuId) return
    setSelections(prev => ({
      ...prev,
      [currentMenuId]: {
        selfInvoke: checked,
        commands: {
          ...(prev[currentMenuId]?.commands ?? {}),
          ...Object.fromEntries(visibleCommandIds.map(cmdid => [cmdid, checked]))
        }
      }
    }))
  }, [currentMenuId, visibleCommandIds])

  const selectedCount = useMemo(() => (
    Object.values(selections).reduce(
      (count, sel) => count + (sel.selfInvoke ? 1 : 0) + Object.values(sel.commands).filter(Boolean).length,
      0
    )
  ), [selections])

  const hasSelection = selectedCount > 0

  const buildRightsPayload = useCallback((roleId: number): UserRoleRightItem[] => {
    const items: UserRoleRightItem[] = []

    Object.entries(selections).forEach(([menuId, sel]) => {
      const meta = menuMeta[menuId]
      if (!meta) return

      if (sel.selfInvoke && meta.selfInvoke) {
        items.push({
          RoleId: roleId,
          CommandId: meta.selfInvoke.command_id,
          CommandIdDetail: meta.selfInvoke.command_id_detail,
          Invoke: true,
          Approve: false,
          ChannelId: meta.selfInvoke.application_code
        })
      }

      Object.entries(sel.commands).forEach(([cmdid, checked]) => {
        if (!checked) return
        const commandMeta = meta.commands[cmdid]
        if (!commandMeta) return

        items.push({
          RoleId: roleId,
          CommandId: commandMeta.command_id,
          CommandIdDetail: commandMeta.command_id_detail,
          Invoke: true,
          Approve: false,
          ChannelId: commandMeta.application_code
        })
      })
    })

    return items
  }, [selections, menuMeta])

  const submitRights = useCallback(async (
    roleId: number,
    messages: { assignFailed: string }
  ): Promise<{ success: boolean; error?: UserRoleWorkflowErrorInfo }> => {
    const items = buildRightsPayload(roleId)

    if (items.length === 0) return { success: true }
    if (!sessiontoken) {
      return { success: false, error: { message: messages.assignFailed } }
    }

    try {
      const response = await submitRoleRightsApi({ sessiontoken, language: locale, items })
      const dataresponse = (response as any)?.payload?.dataresponse ?? (response as any)?.dataresponse
      const errors = dataresponse?.errors ?? dataresponse?.error ?? (response as any)?.payload?.errors ?? (response as any)?.errors ?? []

      if ((response as any)?.status !== 200 || (Array.isArray(errors) && errors.length > 0)) {
        const presentation = getWorkflowErrorPresentation(response, messages.assignFailed)

        return {
          success: false,
          error: {
            message: presentation.message,
            workflowStep: presentation.workflowStep,
            executionId: presentation.executionId,
            technicalDetails: presentation.technicalDetails
          }
        }
      }

      return { success: true }
    } catch (error) {
      const presentation = getWorkflowErrorPresentation(error, messages.assignFailed)

      return {
        success: false,
        error: {
          message: presentation.message,
          workflowStep: presentation.workflowStep,
          executionId: presentation.executionId,
          technicalDetails: presentation.technicalDetails
        }
      }
    }
  }, [buildRightsPayload, sessiontoken, locale])

  return {
    menuParent,
    menuLoading,
    expandedMenu,
    toggleMenu,
    selectedMenu,
    handleMenuClick,
    operations,
    operationLoading,
    dynamicColumns,
    currentSelfInvoke: currentSelection.selfInvoke,
    currentCommands: currentSelection.commands,
    handleSelfInvokeChange,
    handleCommandChange,
    handleAllCurrentCommandsChange,
    allCurrentCommandsSelected,
    someCurrentCommandsSelected,
    hasSelection,
    selectedCount,
    submitRights
  }
}

export type UseRoleCreatePermissionsReturn = ReturnType<typeof useRoleCreatePermissions>
