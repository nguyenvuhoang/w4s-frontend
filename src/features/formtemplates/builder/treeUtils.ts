import type { FormDataSchema, UiComponent } from '../formSchema.types'

/** Duyệt toàn bộ cây ui_schema (kể cả trong Section) và trả về tập field_id đang được component nào đó tham chiếu. */
export const collectReferencedFieldIds = (components: UiComponent[]): Set<string> => {
  const ids = new Set<string>()

  const visit = (list: UiComponent[]) => {
    list.forEach(component => {
      const fieldId = 'field_id' in component ? component.field_id : undefined

      if (typeof fieldId === 'string' && fieldId.trim()) {
        ids.add(fieldId.trim())
      }

      if ('children' in component && Array.isArray(component.children)) {
        visit(component.children)
      }
    })
  }

  visit(components)

  return ids
}

/**
 * Field có trong data_schema nhưng chưa được component nào trong ui_schema tham chiếu.
 * Dùng để cảnh báo trong Builder/Preview khi data_schema có nhiều field hơn số field thực sự hiển thị trên layout —
 * tránh gây hiểu nhầm là hệ thống "hardcode"/thiếu field khi thực ra chỉ là chưa được kéo vào canvas.
 */
export const getUnplacedFields = (dataSchema: FormDataSchema, components: UiComponent[]) => {
  const referenced = collectReferencedFieldIds(components)

  return dataSchema.fields.filter(field => !referenced.has(field.id))
}
