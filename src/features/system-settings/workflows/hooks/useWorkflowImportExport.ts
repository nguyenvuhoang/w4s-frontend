import type { ChangeEvent } from 'react'
import { useCallback, useRef, useState } from 'react'

import type { Locale } from '@/configs/i18n'
import SwalAlert from '@/shared/utils/SwalAlert'

import { workflowService } from '../services/workflowService'
import type { WorkflowsDictionary } from '../types'
import { WorkflowApiError } from '../types'
import { commonText, workflowText } from '../components/workflowHelpers'

type Params = {
  dictionary: WorkflowsDictionary
  language: Locale
  onImported: () => void
}

const pad = (value: number) => String(value).padStart(2, '0')

const buildExportFileName = () => {
  const now = new Date()
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`

  return `workflows-export-${stamp}.json`
}

const buildImportSuccessMessage = (
  dictionary: WorkflowsDictionary,
  result: { def_inserted?: number; def_updated?: number; step_inserted?: number; step_updated?: number }
) => {
  const hasCounts = [result.def_inserted, result.def_updated, result.step_inserted, result.step_updated]
    .some(value => typeof value === 'number')

  if (!hasCounts) return workflowText(dictionary, 'import_success', 'Data imported successfully.')

  const parts = [
    `${workflowText(dictionary, 'import_result_def_inserted', 'Definitions inserted')}: ${result.def_inserted ?? 0}`,
    `${workflowText(dictionary, 'import_result_def_updated', 'Definitions updated')}: ${result.def_updated ?? 0}`,
    `${workflowText(dictionary, 'import_result_step_inserted', 'Steps inserted')}: ${result.step_inserted ?? 0}`,
    `${workflowText(dictionary, 'import_result_step_updated', 'Steps updated')}: ${result.step_updated ?? 0}`
  ]

  return `${workflowText(dictionary, 'import_success', 'Data imported successfully.')} ${parts.join(', ')}`
}

export const useWorkflowImportExport = ({ dictionary, language, onImported }: Params) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const handleExport = useCallback(async () => {
    if (isExporting) return

    setIsExporting(true)

    try {
      const result = await workflowService.exportAllWorkflows({ language })

      if (!result.workflows || result.workflows.length === 0) {
        SwalAlert('warning', workflowText(dictionary, 'no_data_to_export', 'No data to export.'), 'center')

        return
      }

      const exportData = { workflows: result.workflows }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = buildExportFileName()
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      SwalAlert('success', workflowText(dictionary, 'export_success', 'Data exported successfully.'), 'center')
    } catch (caught) {
      const message = caught instanceof WorkflowApiError && caught.executionId
        ? `${caught.message} ${commonText(dictionary, 'errorReference', 'Error Reference')}: ${caught.executionId}`
        : caught instanceof Error
          ? caught.message
          : workflowText(dictionary, 'load_failed', 'Unable to load workflows.')

      SwalAlert('error', message, 'center')
    } finally {
      setIsExporting(false)
    }
  }, [dictionary, isExporting, language])

  const handleImportClick = useCallback(() => {
    if (isImporting) return
    fileInputRef.current?.click()
  }, [isImporting])

  const handleFileSelected = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    event.target.value = ''

    if (!file) {
      SwalAlert('error', workflowText(dictionary, 'import_file_required', 'Please select a JSON file before importing.'), 'center')

      return
    }

    if (!file.name.toLowerCase().endsWith('.json')) {
      SwalAlert('error', workflowText(dictionary, 'import_file_type_invalid', 'Only .json files are accepted.'), 'center')

      return
    }

    void (async () => {
      setIsImporting(true)

      try {
        const result = await workflowService.importWorkflows({ language, file })

        SwalAlert('success', buildImportSuccessMessage(dictionary, result), 'center')
        onImported()
      } catch (caught) {
        const message = caught instanceof WorkflowApiError && caught.executionId
          ? `${caught.message} ${commonText(dictionary, 'errorReference', 'Error Reference')}: ${caught.executionId}`
          : caught instanceof Error
            ? caught.message
            : workflowText(dictionary, 'import_failed', 'Data import failed.')

        SwalAlert('error', message, 'center')
      } finally {
        setIsImporting(false)
      }
    })()
  }, [dictionary, language, onImported])

  return {
    fileInputRef,
    isExporting,
    isImporting,
    handleExport,
    handleImportClick,
    handleFileSelected
  }
}
