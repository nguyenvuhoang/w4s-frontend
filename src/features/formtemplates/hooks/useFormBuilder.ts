import { useState } from 'react'

import { arrayMoveImmutable } from 'array-move'
import { produce } from 'immer'

import { generateBuilderId } from '../builder/adapter'
import { collectReferencedFieldIds } from '../builder/treeUtils'
import { emptyLocalizedText } from '../formTemplateHelpers'
import type {
  DataField,
  DataFieldType,
  FormDataSchema,
  FormUiSchema,
  UiComponent,
  UiComponentType
} from '../formSchema.types'

type Params = {
  dataSchema: FormDataSchema
  uiSchema: FormUiSchema
  setDataSchema: (updater: (current: FormDataSchema) => FormDataSchema) => void
  setUiSchema: (updater: (current: FormUiSchema) => FormUiSchema) => void
  readOnly: boolean
}

const FIELD_COMPONENT_TYPES: UiComponentType[] = ['field', 'repeater']

const findComponent = (id: string, list: UiComponent[]): UiComponent | null => {
  for (const component of list) {
    if (component.id === id) return component
    if (component.type === 'section') {
      const found = findComponent(id, component.children)

      if (found) return found
    }
  }

  return null
}

const findParentList = (id: string, root: UiComponent[]): UiComponent[] | null => {
  if (root.some(component => component.id === id)) return root

  for (const component of root) {
    if (component.type === 'section') {
      const found = findParentList(id, component.children)

      if (found) return found
    }
  }

  return null
}

const removeFromTree = (id: string, list: UiComponent[]): UiComponent[] => (
  list
    .filter(component => component.id !== id)
    .map(component => (
      component.type === 'section'
        ? { ...component, children: removeFromTree(id, component.children) }
        : component
    ))
)

const cloneComponentWithNewIds = (component: UiComponent, dataSchema: FormDataSchema): { component: UiComponent; newFields: DataField[] } => {
  const newFields: DataField[] = []

  const cloneField = (fieldId: string): string => {
    const source = dataSchema.fields.find(field => field.id === fieldId)

    if (!source) return fieldId

    const clonedId = generateBuilderId('fld')
    const cloned: DataField = { ...source, id: clonedId, name: `${source.name}_copy` }

    newFields.push(cloned)

    return clonedId
  }

  const cloneNode = (node: UiComponent): UiComponent => {
    const id = generateBuilderId('cmp')

    if (node.type === 'section') {
      return { ...node, id, children: node.children.map(cloneNode) }
    }

    if (node.type === 'field' || node.type === 'repeater') {
      return { ...node, id, field_id: cloneField(node.field_id) }
    }

    if (node.type === 'signature_block') {
      return { ...node, id, signers: node.signers.map(signer => ({ ...signer })) }
    }

    return { ...node, id }
  }

  return { component: cloneNode(component), newFields }
}

const createDefaultField = (fieldType: DataFieldType, id: string, name: string): DataField => {
  const base: DataField = {
    id,
    name,
    type: fieldType,
    label: emptyLocalizedText(),
    required: false
  }

  if (fieldType === 'select' || fieldType === 'radio') return { ...base, options: [] }
  if (fieldType === 'repeater') return { ...base, min_rows: 0, max_rows: 50, columns: [] }

  return base
}

const createDefaultComponent = (type: UiComponentType, fieldId?: string): UiComponent => {
  const id = generateBuilderId('cmp')

  switch (type) {
    case 'section':
      return { id, type, title: emptyLocalizedText('Section mới'), columns: 1, show_border: true, show_background: false, collapsible: false, spacing: 'normal', children: [] }
    case 'heading':
      return { id, type, text: emptyLocalizedText('Tiêu đề'), level: 2 }
    case 'static_text':
      return { id, type, content: emptyLocalizedText('Nội dung') }
    case 'static_html':
      return { id, type, content: emptyLocalizedText('<p>Nội dung</p>') }
    case 'divider':
      return { id, type }
    case 'spacer':
      return { id, type, height: 16 }
    case 'page_break':
      return { id, type }
    case 'field':
      return { id, type, field_id: fieldId ?? '', column_span: 1 }
    case 'repeater':
      return { id, type, field_id: fieldId ?? '', column_span: 1 }
    case 'signature_block':
      return {
        id,
        type,
        signers: [
          { code: 'APPLICANT', label: { vi: 'Người đăng ký', en: 'Applicant' }, allow_e_signature: false },
          { code: 'MANAGEMENT', label: { vi: 'Ban quản lý', en: 'Management' }, allow_e_signature: false },
          { code: 'SECURITY', label: { vi: 'Bảo vệ', en: 'Security' }, allow_e_signature: false }
        ]
      }
    default:
      return { id, type: 'divider' }
  }
}

export const useFormBuilder = ({ dataSchema, uiSchema, setDataSchema, setUiSchema, readOnly }: Params) => {
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)

  const selectedComponent = selectedComponentId ? findComponent(selectedComponentId, uiSchema.components) : null
  const selectedField = selectedComponent && FIELD_COMPONENT_TYPES.includes(selectedComponent.type) && 'field_id' in selectedComponent
    ? dataSchema.fields.find(field => field.id === (selectedComponent as { field_id: string }).field_id) ?? null
    : null

  const addComponent = (type: UiComponentType, options?: { parentSectionId?: string; fieldType?: DataFieldType }) => {
    if (readOnly) return

    const needsField = type === 'field' || type === 'repeater'
    let newFieldId: string | undefined

    if (needsField) {
      newFieldId = generateBuilderId('fld')
      const fieldType = options?.fieldType ?? (type === 'repeater' ? 'repeater' : 'text')
      const newField = createDefaultField(fieldType, newFieldId, `field_${newFieldId.split('_')[1]}`)

      setDataSchema(current => produce(current, draft => {
        draft.fields.push(newField as never)
      }))
    }

    const newComponent = createDefaultComponent(type, newFieldId)

    setUiSchema(current => produce(current, draft => {
      if (options?.parentSectionId) {
        const parent = findComponent(options.parentSectionId, draft.components as unknown as UiComponent[])

        if (parent && parent.type === 'section') {
          parent.children.push(newComponent as never)

          return
        }
      }

      draft.components.push(newComponent as never)
    }))

    setSelectedComponentId(newComponent.id)
  }

  const selectComponent = (id: string | null) => setSelectedComponentId(id)

  const updateComponent = (id: string, patch: Record<string, unknown>) => {
    if (readOnly) return

    setUiSchema(current => produce(current, draft => {
      const target = findComponent(id, draft.components as unknown as UiComponent[])

      if (target) Object.assign(target, patch)
    }))
  }

  const updateField = (fieldId: string, patch: Partial<DataField>) => {
    if (readOnly) return

    setDataSchema(current => produce(current, draft => {
      const target = draft.fields.find(field => field.id === fieldId)

      if (target) Object.assign(target, patch)
    }))
  }

  const duplicateComponent = (id: string) => {
    if (readOnly) return

    const parentList = findParentList(id, uiSchema.components)
    const original = parentList?.find(component => component.id === id)

    if (!original) return

    const { component: cloned, newFields } = cloneComponentWithNewIds(original, dataSchema)

    if (newFields.length > 0) {
      setDataSchema(current => produce(current, draft => {
        draft.fields.push(...(newFields as never[]))
      }))
    }

    setUiSchema(current => produce(current, draft => {
      const draftParentList = parentList === uiSchema.components
        ? draft.components
        : (findParentList(id, draft.components as unknown as UiComponent[]) ?? draft.components)
      const index = draftParentList.findIndex(component => component.id === id)

      draftParentList.splice(index + 1, 0, cloned as never)
    }))

    setSelectedComponentId(cloned.id)
  }

  /** Xoá component; nếu tham chiếu field và field đó không còn được component nào khác dùng, xoá luôn field. */
  const removeComponent = (id: string) => {
    if (readOnly) return

    const target = findComponent(id, uiSchema.components)

    setUiSchema(current => ({ ...current, components: removeFromTree(id, current.components) }))

    if (target && (target.type === 'field' || target.type === 'repeater')) {
      const remainingFieldIds = collectReferencedFieldIds(removeFromTree(id, uiSchema.components))

      if (!remainingFieldIds.has(target.field_id)) {
        setDataSchema(current => produce(current, draft => {
          draft.fields = draft.fields.filter(field => field.id !== target.field_id)
        }))
      }
    }

    if (selectedComponentId === id) setSelectedComponentId(null)
  }

  /** Xoá field trực tiếp từ data_schema (từ Properties panel) — đồng thời xoá mọi component đang tham chiếu field đó. */
  const removeFieldAndReferences = (fieldId: string) => {
    if (readOnly) return

    setDataSchema(current => produce(current, draft => {
      draft.fields = draft.fields.filter(field => field.id !== fieldId)
    }))

    setUiSchema(current => produce(current, draft => {
      const dropReferencing = (list: UiComponent[]): UiComponent[] => (
        list
          .filter(component => !(('field_id' in component) && component.field_id === fieldId))
          .map(component => (
            component.type === 'section'
              ? { ...component, children: dropReferencing(component.children) }
              : component
          ))
      )

      draft.components = dropReferencing(draft.components as unknown as UiComponent[]) as never
    }))

    if (selectedField?.id === fieldId) setSelectedComponentId(null)
  }

  const moveComponent = (id: string, direction: 'up' | 'down') => {
    if (readOnly) return

    setUiSchema(current => produce(current, draft => {
      const list = findParentList(id, draft.components as unknown as UiComponent[])

      if (!list) return

      const index = list.findIndex(component => component.id === id)
      const targetIndex = direction === 'up' ? index - 1 : index + 1

      if (index < 0 || targetIndex < 0 || targetIndex >= list.length) return

      const moved = arrayMoveImmutable(list, index, targetIndex)

      list.splice(0, list.length, ...moved)
    }))
  }

  return {
    selectedComponentId,
    selectedComponent,
    selectedField,
    selectComponent,
    addComponent,
    updateComponent,
    updateField,
    duplicateComponent,
    removeComponent,
    removeFieldAndReferences,
    moveComponent
  }
}
