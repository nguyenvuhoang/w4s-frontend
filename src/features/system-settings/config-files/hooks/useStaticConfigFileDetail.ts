'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import SwalAlert from '@/shared/utils/SwalAlert'

import { ConfigFileApiError, configFileService } from '../services/configFileService'
import type { ConfigFilesDictionary } from '../types'
import { configFileText, formatJsonText, validateJsonText } from '../components/configFileHelpers'

type Notice = {
  severity: 'success' | 'error' | 'warning' | 'info'
  message: string
} | null

const toEditorText = (value: unknown) => JSON.stringify(value ?? {}, null, 2)

const getResponseMessage = (value: unknown, fallback: string) => {
  if (!value || typeof value !== 'object') return fallback

  const record = value as Record<string, unknown>
  const message = record.error_message ?? record.description ?? record.message ?? record.detail ?? record.title

  return typeof message === 'string' && message.trim() ? message : fallback
}

const toErrorMessage = (error: unknown, dictionary: ConfigFilesDictionary, fallback: string) => {
  const message = error instanceof Error ? error.message : fallback

  if (error instanceof ConfigFileApiError && error.executionId) {
    return `${message} ${configFileText(dictionary, 'config_files_error_reference_label', 'Error Reference')}: ${error.executionId}`
  }

  return message
}

const parseStaticFilePayload = (payload: any, dictionary: ConfigFilesDictionary, fallbackRelativePath: string) => {
  // The CMS get endpoint returns the file object directly. Keep support for the older
  // { data: file } envelope too, but never require a `data` level for the current API.
  const filePayload = payload?.data && typeof payload.data === 'object' ? payload.data : payload
  const content = filePayload?.content

  if (typeof content !== 'string') {
    throw new Error(configFileText(dictionary, 'config_files_content_missing', 'Config file content is missing.'))
  }

  const isEmptyContent = !content.trim()
  let parsedContent: unknown = {}

  if (!isEmptyContent) {
    try {
      parsedContent = JSON.parse(content)
    } catch {
      throw new Error(configFileText(dictionary, 'config_files_content_invalid', 'Config file contains invalid JSON.'))
    }
  }

  return {
    editorText: toEditorText(parsedContent),
    isEmptyContent,
    relativePath: filePayload?.relative_path || fallbackRelativePath,
    lastModifiedUtc: filePayload?.last_modified_utc || ''
  }
}

const getFileName = (value: string) => value.split('/').pop() || value

export const useStaticConfigFileDetail = (serviceCode: string, dictionary: ConfigFilesDictionary, initialRelativePath: string) => {
  const [editorValue, setEditorValue] = useState('')
  const [savedValue, setSavedValue] = useState('')
  const [relativePath, setRelativePath] = useState(initialRelativePath)
  const [lastModifiedUtc, setLastModifiedUtc] = useState('')
  const [isEmptyContent, setIsEmptyContent] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)

  const validation = useMemo(() => {
    if (loading || loadError) {
      return {
        valid: false as const,
        parsed: null,
        error: null
      }
    }

    if (!editorValue.trim()) {
      return {
        valid: false as const,
        parsed: null,
        error: configFileText(dictionary, 'config_files_json_empty_error', 'JSON content is required.')
      }
    }

    return validateJsonText(editorValue, dictionary)
  }, [dictionary, editorValue, loadError, loading])

  const hasUnsavedChanges = editorValue !== savedValue
  const canSave = hasUnsavedChanges && validation.valid && !loading && !saving && Boolean(relativePath)

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return

      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handler)

    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsavedChanges])

  const performLoadConfig = useCallback(async () => {
    if (!initialRelativePath) {
      setLoading(false)
      setLoadError(true)
      setNotice({
        severity: 'error',
        message: configFileText(dictionary, 'config_files_relative_path_required', 'relative_path is required.')
      })

      return
    }

    setLoading(true)
    setLoadError(false)
    setNotice(null)

    try {
      const payload = await configFileService.getStaticConfigFile(serviceCode, initialRelativePath)
      const parsed = parseStaticFilePayload(payload, dictionary, initialRelativePath)

      setEditorValue(parsed.editorText)
      setSavedValue(parsed.editorText)
      setRelativePath(parsed.relativePath)
      setLastModifiedUtc(parsed.lastModifiedUtc)
      setIsEmptyContent(parsed.isEmptyContent)
      setLoadError(false)
    } catch (error) {
      setLoadError(true)
      setNotice({
        severity: 'error',
        message: toErrorMessage(
          error,
          dictionary,
          configFileText(dictionary, 'config_files_detail_load_failed', 'Unable to load config file.')
        )
      })
    } finally {
      setLoading(false)
    }
  }, [dictionary, initialRelativePath, serviceCode])

  const loadConfig = useCallback(() => {
    if (hasUnsavedChanges) {
      SwalAlert(
        'warning',
        configFileText(dictionary, 'config_files_refresh_confirm', 'You have unsaved changes. Refresh will discard them. Continue?'),
        'center',
        true,
        true,
        true,
        () => {
          void performLoadConfig()
        },
        configFileText(dictionary, 'config_files_refresh_confirm_button', 'Refresh'),
        {
          title: configFileText(dictionary, 'config_files_refresh_confirm_dialog_title', 'Refresh configuration?'),
          cancelButtonText: configFileText(dictionary, 'config_files_save_cancel_button', 'Cancel')
        }
      )

      return
    }

    void performLoadConfig()
  }, [dictionary, hasUnsavedChanges, performLoadConfig])

  useEffect(() => {
    void performLoadConfig()
    // Initial load must not ask about the empty editor draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatEditorJson = () => {
    try {
      setEditorValue(formatJsonText(editorValue))
      setNotice({
        severity: 'success',
        message: configFileText(dictionary, 'config_files_format_success', 'JSON has been formatted.')
      })
    } catch {
      setNotice({
        severity: 'error',
        message: validation.error ?? configFileText(dictionary, 'config_files_json_invalid', 'Invalid JSON.')
      })
    }
  }

  const persistConfig = async (parsedContent: unknown) => {
    setSaving(true)
    setNotice(null)

    try {
      const formattedContent = toEditorText(parsedContent)
      const updateResponse = await configFileService.updateStaticConfigFile(serviceCode, relativePath, formattedContent)
      const parsed = parseStaticFilePayload(updateResponse, dictionary, relativePath)
      const successMessage = getResponseMessage(
        updateResponse,
        configFileText(dictionary, 'config_files_detail_save_success', 'Config file has been updated.')
      )

      setEditorValue(parsed.editorText)
      setSavedValue(parsed.editorText)
      setRelativePath(parsed.relativePath)
      setLastModifiedUtc(parsed.lastModifiedUtc)
      setIsEmptyContent(parsed.isEmptyContent)
      setNotice({
        severity: 'success',
        message: successMessage
      })
      SwalAlert('success', successMessage, 'center')
    } catch (error) {
      const errorMessage = toErrorMessage(
        error,
        dictionary,
        configFileText(dictionary, 'config_files_detail_save_failed', 'Unable to update config file.')
      )

      setNotice({
        severity: 'error',
        message: errorMessage
      })
      SwalAlert('error', errorMessage, 'center')
    } finally {
      setSaving(false)
    }
  }

  const saveConfig = () => {
    if (!canSave || !validation.valid) return

    const fileName = getFileName(relativePath)

    SwalAlert(
      'warning',
      `${configFileText(dictionary, 'config_files_detail_save_confirm_title', 'Are you sure you want to update {fileName}?').replace('{fileName}', fileName)}\n${configFileText(dictionary, 'config_files_detail_save_confirm_description', 'This change may affect running services.')}`,
      'center',
      true,
      true,
      true,
      () => {
        void persistConfig(validation.parsed)
      },
      configFileText(dictionary, 'config_files_save_confirm_button', 'Update'),
      {
        title: configFileText(dictionary, 'config_files_save_confirm_dialog_title', 'Confirm Configuration Update'),
        cancelButtonText: configFileText(dictionary, 'config_files_save_cancel_button', 'Cancel')
      }
    )
  }

  const updateEditorValue = (value: string) => {
    setEditorValue(value)
    setLoadError(false)
  }

  return {
    canSave,
    editorValue,
    formatEditorJson,
    hasUnsavedChanges,
    isEmptyContent,
    lastModifiedUtc,
    loadConfig,
    loading,
    notice,
    relativePath,
    saveConfig,
    saving,
    setNotice,
    setEditorValue: updateEditorValue,
    validation
  }
}
