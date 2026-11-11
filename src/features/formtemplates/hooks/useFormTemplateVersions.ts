import { useCallback, useEffect, useMemo, useState } from 'react'

import type { Locale } from '@/configs/i18n'
import SwalAlert from '@/shared/utils/SwalAlert'
import { WorkflowError } from '@/shared/utils/workflowError'

import { adaptLegacySchemaToFormDefinition } from '../builder/adapter'
import { autoPlaceUnplacedFields } from '../builder/autoLayout'
import { mergeLegacyFieldsIntoDataSchema } from '../builder/schemaSync'
import { validateFormDefinition } from '../builder/validation'
import {
  defaultFormPrintSchema,
  emptyFormDataSchema,
  emptyFormUiSchema,
  type FormDataSchema,
  type FormPrintSchema,
  type FormUiSchema
} from '../formSchema.types'
import { formTemplateText } from '../formTemplateHelpers'
import { formTemplateService } from '../formTemplateService'
import type {
  FormTemplateDetailModel,
  FormTemplateDictionary,
  FormTemplateVersionDetail,
  FormTemplateVersionSummary
} from '../types'

type Params = {
  dictionary: FormTemplateDictionary
  sessiontoken?: string
  language: Locale
  template: FormTemplateDetailModel
}

export type WorkflowErrorInfo = {
  message: string
  executionId?: string
  technicalDetails?: string
}

/** Format lỗi workflow theo convention SwalAlert (regex tìm "ExecutionId:" để hiển thị đẹp trong toast/confirm). */
const formatWorkflowErrorForSwal = (err: unknown, fallback: string) => {
  if (err instanceof WorkflowError && err.execution_id) {
    return `ExecutionId: ${err.execution_id}: ${err.message}`
  }

  return err instanceof Error ? err.message : fallback
}

/** Tách riêng message và execution_id (không nối vào text) — dùng cho WorkflowErrorAlert hiển thị inline trên trang. */
const getWorkflowErrorInfo = (err: unknown, fallback: string): WorkflowErrorInfo => {
  if (err instanceof WorkflowError) {
    return {
      message: err.message || fallback,
      executionId: err.execution_id || undefined,
      technicalDetails: Array.isArray(err.errors) && err.errors.length > 0 ? JSON.stringify(err.errors, null, 2) : undefined
    }
  }

  return { message: err instanceof Error ? err.message : fallback }
}

const pickHighestVersionNo = (list: FormTemplateVersionSummary[]) => (
  list.reduce<FormTemplateVersionSummary | null>((best, current) => (
    !best || current.version_no > best.version_no ? current : best
  ), null)
)

const pickInitialVersion = (list: FormTemplateVersionSummary[]): FormTemplateVersionSummary | null => {
  const draft = pickHighestVersionNo(list.filter(item => item.status === 'DRAFT'))
  if (draft) return draft

  const published = pickHighestVersionNo(list.filter(item => item.status === 'PUBLISHED'))
  if (published) return published

  return pickHighestVersionNo(list)
}

export const useFormTemplateVersions = ({ dictionary, sessiontoken, language, template }: Params) => {
  const [versions, setVersions] = useState<FormTemplateVersionSummary[]>([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [versionsError, setVersionsError] = useState<WorkflowErrorInfo | null>(null)

  const [selectedVersionNo, setSelectedVersionNo] = useState<number | null>(null)
  const [versionDetail, setVersionDetail] = useState<FormTemplateVersionDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<WorkflowErrorInfo | null>(null)
  const [isLegacyMode, setIsLegacyMode] = useState(false)

  const [dataSchema, setDataSchemaState] = useState<FormDataSchema>(emptyFormDataSchema())
  const [uiSchema, setUiSchemaState] = useState<FormUiSchema>(emptyFormUiSchema())
  const [printSchema, setPrintSchemaState] = useState<FormPrintSchema>(defaultFormPrintSchema())
  const [dirty, setDirty] = useState(false)

  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [creatingVersion, setCreatingVersion] = useState(false)

  const applyLegacyFallback = useCallback(() => {
    const legacy = adaptLegacySchemaToFormDefinition(template.schema_json)

    setDataSchemaState(legacy.data_schema)
    setUiSchemaState(legacy.ui_schema)
    setPrintSchemaState(legacy.print_schema)
    setIsLegacyMode(true)
    setVersionDetail(null)
    setSelectedVersionNo(null)
    setDirty(false)
  }, [template.schema_json])

  /**
   * Chỉ đọc dữ liệu (GET) — KHÔNG được gọi bất kỳ workflow ghi nào ở đây.
   * Field có trong data_schema của version nhưng ui_schema chưa wire vào layout sẽ được tự động xếp vào
   * section hợp lý NHƯNG chỉ ở local state (đánh dấu dirty) — người dùng phải tự bấm "Lưu bản nháp" để lưu thật.
   */
  const loadVersionDetail = useCallback(async (versionNo: number) => {
    setDetailLoading(true)
    setDetailError(null)

    try {
      const detail = await formTemplateService.getFormTemplateVersion({
        sessiontoken,
        language,
        template_id: template.id,
        version_no: versionNo
      })

      if (!detail) {
        setDetailError({ message: formTemplateText(dictionary, 'versionDetailNotFound', 'Không tìm thấy chi tiết phiên bản.') })

        return
      }

      const legacyDefinition = adaptLegacySchemaToFormDefinition(template.schema_json)

      // eslint-disable-next-line no-console

      const autoResult = autoPlaceUnplacedFields(detail.data_schema, detail.ui_schema)

      setVersionDetail(detail)
      setDataSchemaState(detail.data_schema)
      setUiSchemaState(autoResult.uiSchema)
      setPrintSchemaState(detail.print_schema)
      setIsLegacyMode(false)
      setSelectedVersionNo(detail.version_no)
      setDirty(autoResult.placedCount > 0)

      if (autoResult.placedCount > 0) {
        SwalAlert(
          'warning',
          formTemplateText(dictionary, 'autoPlacedFieldsNotice', 'Đã bổ sung {count} trường chưa có trong bố cục. Vui lòng kiểm tra và bấm Lưu bản nháp.').replace('{count}', String(autoResult.placedCount)),
          'center'
        )
      }
    } catch (caught) {
      setDetailError(getWorkflowErrorInfo(caught, formTemplateText(dictionary, 'versionDetailLoadError', 'Không thể tải chi tiết phiên bản.')))
    } finally {
      setDetailLoading(false)
    }
  }, [dictionary, language, sessiontoken, template.id, template.schema_json])

  /** Chỉ gọi các workflow GET khi mount/khi đổi template — không có bất kỳ workflow ghi nào trong luồng load. */
  const loadVersions = useCallback(async () => {
    if (!sessiontoken) return

    setVersionsLoading(true)
    setVersionsError(null)

    try {
      const list = await formTemplateService.getFormTemplateVersions({ sessiontoken, language, template_id: template.id })

      setVersions(list)

      if (list.length === 0) {
        applyLegacyFallback()

        return
      }

      const initial = pickInitialVersion(list)

      if (initial) {
        await loadVersionDetail(initial.version_no)
      } else {
        applyLegacyFallback()
      }
    } catch (caught) {
      setVersionsError(getWorkflowErrorInfo(caught, formTemplateText(dictionary, 'versionsLoadError', 'Không thể tải lịch sử phiên bản.')))
      applyLegacyFallback()
    } finally {
      setVersionsLoading(false)
    }
  }, [sessiontoken, language, template.id, applyLegacyFallback, loadVersionDetail, dictionary])

  useEffect(() => {
    void loadVersions()
  }, [loadVersions])

  const selectVersion = (versionNo: number) => {
    if (versionNo === selectedVersionNo && !isLegacyMode) return
    void loadVersionDetail(versionNo)
  }

  const isReadOnly = isLegacyMode || !versionDetail || versionDetail.status !== 'DRAFT'

  const legacyFieldCount = useMemo(
    () => adaptLegacySchemaToFormDefinition(template.schema_json).data_schema.fields.length,
    [template.schema_json]
  )

  /** true khi template.schema_json có nhiều field hơn data_schema đang hiển thị — gợi ý người dùng tự đồng bộ (không tự động). */
  const schemaOutOfSync = legacyFieldCount > dataSchema.fields.length

  const setDataSchema = (updater: (current: FormDataSchema) => FormDataSchema) => {
    if (isReadOnly) return
    setDataSchemaState(updater)
    setDirty(true)
  }

  const setUiSchema = (updater: (current: FormUiSchema) => FormUiSchema) => {
    if (isReadOnly) return
    setUiSchemaState(updater)
    setDirty(true)
  }

  const setPrintSchema = (updater: (current: FormPrintSchema) => FormPrintSchema) => {
    if (isReadOnly) return
    setPrintSchemaState(updater)
    setDirty(true)
  }

  /**
   * Đưa field mới từ template.schema_json vào data_schema/ui_schema đang chỉnh sửa — CHỈ ở local state.
   * Không gọi workflow ghi nào. Người dùng phải tự bấm "Lưu bản nháp" để lưu thật vào backend.
   */
  const syncFieldsFromSchemaJson = () => {
    if (isReadOnly || !versionDetail) {
      SwalAlert('error', formTemplateText(dictionary, 'noEditableVersion', 'Chưa có phiên bản nào có thể chỉnh sửa.'), 'center')

      return
    }

    const legacyDefinition = adaptLegacySchemaToFormDefinition(template.schema_json)
    const merge = mergeLegacyFieldsIntoDataSchema(dataSchema, legacyDefinition.data_schema)

    if (merge.addedFields.length === 0) {
      SwalAlert('success', formTemplateText(dictionary, 'schemaSyncNothingToDo', 'Không có field mới cần đồng bộ.'), 'top-end')

      return
    }

    const autoResult = autoPlaceUnplacedFields(merge.dataSchema, uiSchema)

    setDataSchema(() => merge.dataSchema)
    setUiSchema(() => autoResult.uiSchema)

    SwalAlert(
      'success',
      formTemplateText(dictionary, 'schemaSyncSuccess', 'Đã đồng bộ {count} field mới từ schema_json vào phiên bản.').replace('{count}', String(merge.addedFields.length)),
      'top-end'
    )
  }

  const runValidation = (): boolean => {
    const issues = validateFormDefinition(dataSchema, uiSchema, printSchema)

    if (issues.length > 0) {
      const lines = issues.slice(0, 8).map(issue => `- ${issue.code}: ${issue.targetLabel ?? issue.targetId ?? ''}`)

      SwalAlert(
        'warning',
        `${formTemplateText(dictionary, 'validationFailedTitle', 'Biểu mẫu chưa hợp lệ:')}\n${lines.join('\n')}`,
        'center'
      )

      return false
    }

    return true
  }

  const saveDraft = async (changeNote = '') => {
    if (isLegacyMode || !versionDetail) {
      SwalAlert('error', formTemplateText(dictionary, 'noEditableVersion', 'Chưa có phiên bản nào có thể chỉnh sửa.'), 'center')

      return
    }

    if (!runValidation()) return

    setSaving(true)

    try {
      const saved = await formTemplateService.saveFormTemplateDraft({
        sessiontoken,
        language,
        data: {
          template_id: template.id,
          version_id: versionDetail.id,
          data_schema: dataSchema,
          ui_schema: uiSchema,
          print_schema: printSchema,
          change_note: changeNote
        }
      })

      if (saved) {
        setVersionDetail(saved)
      }

      setDirty(false)
      SwalAlert('success', formTemplateText(dictionary, 'saveDraftSuccess', 'Đã lưu bản nháp.'), 'top-end')
      void loadVersions()
    } catch (caught) {
      SwalAlert('error', formatWorkflowErrorForSwal(caught, formTemplateText(dictionary, 'saveDraftError', 'Không thể lưu bản nháp.')), 'center')
    } finally {
      setSaving(false)
    }
  }

  const publish = async () => {
    if (isLegacyMode || !versionDetail || versionDetail.status !== 'DRAFT') return

    if (!runValidation()) return

    const confirmMessage = formTemplateText(dictionary, 'publishConfirmMessage', 'Xuất bản phiên bản này? Sau khi xuất bản sẽ không thể chỉnh sửa trực tiếp.')

    SwalAlert(
      'warning',
      confirmMessage,
      'center',
      false,
      true,
      true,
      () => void doPublish(),
      formTemplateText(dictionary, 'publishButton', 'Xuất bản')
    )
  }

  const doPublish = async () => {
    if (!versionDetail) return

    setPublishing(true)

    try {
      await formTemplateService.publishFormTemplate({
        sessiontoken,
        language,
        data: { template_id: template.id, version_id: versionDetail.id }
      })

      SwalAlert('success', formTemplateText(dictionary, 'publishSuccess', 'Đã xuất bản biểu mẫu.'), 'top-end')
      await loadVersions()
    } catch (caught) {
      SwalAlert('error', formatWorkflowErrorForSwal(caught, formTemplateText(dictionary, 'publishError', 'Không thể xuất bản biểu mẫu.')), 'center')
    } finally {
      setPublishing(false)
    }
  }

  /**
   * Tạo version mới — CHỈ được gọi từ hành động bấm nút của người dùng (không bao giờ tự động khi load).
   * - Nếu đang có version đang xem (DRAFT/PUBLISHED/ARCHIVED) → clone từ đúng version.id đó (source_version_id).
   * - Nếu chưa có version nào (legacy) → tạo version đầu tiên, KHÔNG gửi source_version_id (để null/omit,
   *   không hardcode 1, không dùng template_id).
   *   Nếu backend trả về version rỗng (chưa tự khởi tạo từ schema_json), FE khởi tạo ngay trong cùng thao tác
   *   này (vẫn là 1 hành động do người dùng bấm) bằng adaptLegacySchemaToFormDefinition + lưu thật.
   */
  const createNewVersionFromCurrent = async (changeNote = '') => {
    setCreatingVersion(true)

    try {
      const sourceVersionId = versionDetail?.id ?? undefined

      const created = await formTemplateService.createFormTemplateVersion({
        sessiontoken,
        language,
        data: { template_id: template.id, source_version_id: sourceVersionId, change_note: changeNote }
      })

      if (!created) throw new Error(formTemplateText(dictionary, 'createVersionError', 'Không thể tạo phiên bản mới.'))

      let finalVersionNo = created.version_no

      if (!sourceVersionId && created.data_schema.fields.length === 0) {
        const legacyDefinition = adaptLegacySchemaToFormDefinition(template.schema_json)

        if (legacyDefinition.data_schema.fields.length > 0) {
          await formTemplateService.saveFormTemplateDraft({
            sessiontoken,
            language,
            data: {
              template_id: template.id,
              version_id: created.id,
              data_schema: legacyDefinition.data_schema,
              ui_schema: legacyDefinition.ui_schema,
              print_schema: legacyDefinition.print_schema,
              change_note: 'Auto: khoi tao data_schema/ui_schema tu schema_json'
            }
          })

          finalVersionNo = created.version_no
        }
      }

      SwalAlert('success', formTemplateText(dictionary, 'createVersionSuccess', 'Đã tạo phiên bản nháp mới.'), 'top-end')

      const list = await formTemplateService.getFormTemplateVersions({ sessiontoken, language, template_id: template.id })

      setVersions(list)

      await loadVersionDetail(finalVersionNo)
    } catch (caught) {
      SwalAlert('error', formatWorkflowErrorForSwal(caught, formTemplateText(dictionary, 'createVersionError', 'Không thể tạo phiên bản mới.')), 'center')
    } finally {
      setCreatingVersion(false)
    }
  }

  return {
    versions,
    versionsLoading,
    versionsError,
    selectedVersionNo,
    versionDetail,
    detailLoading,
    detailError,
    isLegacyMode,
    isReadOnly,
    schemaOutOfSync,
    dataSchema,
    uiSchema,
    printSchema,
    setDataSchema,
    setUiSchema,
    setPrintSchema,
    syncFieldsFromSchemaJson,
    dirty,
    saving,
    publishing,
    creatingVersion,
    selectVersion,
    saveDraft,
    publish,
    createNewVersionFromCurrent,
    reloadVersions: loadVersions
  }
}
