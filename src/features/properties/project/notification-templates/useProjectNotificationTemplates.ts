import { useEffect, useRef, useState } from 'react'

import type { Locale } from '@/configs/i18n'

import { buildTemplateResetPayload, buildTemplateSavePayload } from './projectNotificationTemplateHelpers'
import { projectNotificationTemplateService } from './projectNotificationTemplateService'
import type {
  NotificationTemplateParameter,
  ProjectNotificationTemplate,
  ProjectNotificationTemplateForm
} from './projectNotificationTemplateTypes'

type Messages = {
  loadError: string
  parametersError: string
  saveError: string
  resetError: string
}

const errorMessage = (caught: unknown, fallback: string) => (caught instanceof Error && caught.message ? caught.message : fallback)

/**
 * Notification templates of the project of the detail route. The list and the placeholder catalog are loaded once
 * when the tab is first opened (`ensureLoaded`), never twice in parallel; the list is reloaded only after a
 * successful save or reset. Save / reset failures stay on the hook state (shown inside the open dialog) and never
 * reload or close anything.
 */
export function useProjectNotificationTemplates({
  projectId,
  sessiontoken,
  language,
  messages,
  autoLoad = true
}: {
  projectId: number
  sessiontoken?: string
  language: Locale
  messages: Messages
  autoLoad?: boolean
}) {
  const [templates, setTemplates] = useState<ProjectNotificationTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [parameters, setParameters] = useState<NotificationTemplateParameter[]>([])
  const [parametersLoading, setParametersLoading] = useState(false)
  const [parametersError, setParametersError] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  const listInFlight = useRef(false)
  const parametersInFlight = useRef(false)
  const parametersLoaded = useRef(false)
  const submitInFlight = useRef(false)
  const requestedProject = useRef<number | null>(null)

  const loadTemplates = async (): Promise<ProjectNotificationTemplate[] | null> => {
    if (listInFlight.current) return null

    listInFlight.current = true
    setLoading(true)
    setError(null)

    try {
      const items = await projectNotificationTemplateService.list_templates({ sessiontoken, language, project_id: projectId })

      setTemplates(items)
      setLoaded(true)

      return items
    } catch (caught) {
      setError(errorMessage(caught, messages.loadError))

      return null
    } finally {
      listInFlight.current = false
      setLoading(false)
    }
  }

  const loadParameters = async () => {
    if (parametersInFlight.current) return

    parametersInFlight.current = true
    setParametersLoading(true)
    setParametersError(null)

    try {
      setParameters(await projectNotificationTemplateService.list_parameters({ sessiontoken, language }))
      parametersLoaded.current = true
    } catch (caught) {
      setParametersError(errorMessage(caught, messages.parametersError))
    } finally {
      parametersInFlight.current = false
      setParametersLoading(false)
    }
  }

  /** Lazy first load of the tab (idempotent for the same project). */
  const ensureLoaded = async () => {
    if (!projectId || requestedProject.current === projectId) return

    requestedProject.current = projectId
    await Promise.all([loadTemplates(), parametersLoaded.current ? Promise.resolve() : loadParameters()])
  }

  useEffect(() => {
    if (autoLoad) void ensureLoaded()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, projectId])

  const clearSubmitErrors = () => {
    setSaveError(null)
    setResetError(null)
  }

  /** Saves the editor; resolves true only after the backend succeeded and the list was reloaded. */
  const saveTemplate = async (template: ProjectNotificationTemplate, form: ProjectNotificationTemplateForm) => {
    if (!projectId || submitInFlight.current) return false

    submitInFlight.current = true
    setSaving(true)
    setSaveError(null)

    try {
      await projectNotificationTemplateService.save_template({
        sessiontoken,
        language,
        payload: buildTemplateSavePayload(projectId, template, form)
      })
    } catch (caught) {
      setSaveError(errorMessage(caught, messages.saveError))
      submitInFlight.current = false
      setSaving(false)

      return false
    }

    await loadTemplates()
    submitInFlight.current = false
    setSaving(false)

    return true
  }

  /**
   * Restores the system default of a customized template. Resolves `{ ok, stillCustomized }`: after the reload the
   * template must come back as a global template, otherwise `stillCustomized` is true.
   */
  const resetTemplate = async (template: ProjectNotificationTemplate) => {
    if (!projectId || !template.is_customized || submitInFlight.current) return { ok: false, stillCustomized: false }

    submitInFlight.current = true
    setResetting(true)
    setResetError(null)

    try {
      await projectNotificationTemplateService.reset_template({
        sessiontoken,
        language,
        payload: buildTemplateResetPayload(projectId, template)
      })
    } catch (caught) {
      setResetError(errorMessage(caught, messages.resetError))
      submitInFlight.current = false
      setResetting(false)

      return { ok: false, stillCustomized: false }
    }

    const items = await loadTemplates()
    const reloaded = items?.find(item => item.template_code === template.template_code)

    submitInFlight.current = false
    setResetting(false)

    return { ok: true, stillCustomized: reloaded?.is_customized === true }
  }

  return {
    templates,
    loading,
    loaded,
    error,
    reload: loadTemplates,
    ensureLoaded,
    parameters,
    parametersLoading,
    parametersError,
    reloadParameters: loadParameters,
    saving,
    saveError,
    saveTemplate,
    resetting,
    resetError,
    resetTemplate,
    clearSubmitErrors
  }
}
