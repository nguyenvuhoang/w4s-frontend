'use client'

import { useCallback, useReducer, useRef } from 'react'

import { showServiceSettingsSuccessToast } from '../components/serviceSettingsToast'
import { ServiceSettingsApiError, type ServiceSettingsService, serviceSettingsService } from '../services/serviceSettingsService'
import { executeInlineSave, INITIAL_INLINE_EDIT_STATE, inlineEditReducer, type InlineEditAction } from '../serviceSettingsInlineEdit'
import type { ServiceSettingItem, ServiceSettingsDictionary } from '../types'

const getText = (dictionary: ServiceSettingsDictionary, key: string, fallback: string) => dictionary.system_settings_modules?.[key] ?? fallback

type Options = {
  dictionary: ServiceSettingsDictionary
  /** Service currently selected in the "Dịch vụ" dropdown; decides the update endpoint. */
  service: ServiceSettingsService
  onSaved: (item: ServiceSettingItem, value: string) => void
}

export const useServiceSettingInlineEdit = ({ dictionary, service, onSaved }: Options) => {
  const [state, rawDispatch] = useReducer(inlineEditReducer, INITIAL_INLINE_EDIT_STATE)
  // Mirror of the reducer state so Enter/Check never read a stale closure and a second
  // submit while saving is ignored synchronously.
  const stateRef = useRef(state)

  const dispatch = useCallback((action: InlineEditAction) => {
    stateRef.current = inlineEditReducer(stateRef.current, action)
    rawDispatch(action)
  }, [])

  const formatError = useCallback((error: unknown) => {
    const message = error instanceof Error && error.message ? error.message : getText(dictionary, 'service_settings_update_failed', 'Unable to update service setting.')
    const reference = error instanceof ServiceSettingsApiError ? error.executionId : undefined

    return reference ? `${message} ${getText(dictionary, 'service_settings_error_reference_label', 'Error Reference')}: ${reference}` : message
  }, [dictionary])

  const save = useCallback(() => executeInlineSave(stateRef.current, dispatch, {
    update: payload => serviceSettingsService.updateServiceSetting(service, payload),
    formatError,
    invalidMessage: getText(dictionary, 'service_settings_update_missing_id', 'This setting has no id and cannot be updated.'),
    onSuccess: (item, value) => {
      showServiceSettingsSuccessToast(
        getText(dictionary, 'service_settings_update_success', 'Service setting updated successfully.'),
        getText(dictionary, 'service_settings_close_toast', 'Close')
      )
      onSaved(item, value)
    }
  }), [dictionary, dispatch, formatError, onSaved, service])

  return {
    ...state,
    start: (rowKey: string, item: ServiceSettingItem) => dispatch({ type: 'start', rowKey, item }),
    change: (draft: string) => dispatch({ type: 'change', draft }),
    cancel: () => dispatch({ type: 'cancel' }),
    save
  }
}
