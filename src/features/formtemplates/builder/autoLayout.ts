import { generateBuilderId } from './adapter'
import { collectReferencedFieldIds } from './treeUtils'
import type { DataField, FormDataSchema, FormUiSchema, LocalizedText, SectionComponent, UiComponent } from '../formSchema.types'

type SectionBucketKey = 'general' | 'carrier' | 'vehicle' | 'schedule' | 'assets' | 'confirmation' | 'approval'

const BUCKET_ORDER: SectionBucketKey[] = ['general', 'carrier', 'vehicle', 'schedule', 'assets', 'confirmation', 'approval']

const SECTION_TITLES: Record<SectionBucketKey, LocalizedText> = {
  general: { vi: 'Thông tin chung', en: 'General information' },
  carrier: { vi: 'Đơn vị vận chuyển', en: 'Carrier' },
  vehicle: { vi: 'Phương tiện', en: 'Vehicle' },
  schedule: { vi: 'Lịch vận chuyển', en: 'Schedule' },
  assets: { vi: 'Danh sách tài sản', en: 'Assets' },
  confirmation: { vi: 'Xác nhận', en: 'Confirmation' },
  approval: { vi: 'Phê duyệt', en: 'Approval' }
}

/** ID ổn định cho section tự sinh — để lần chạy sau nhận diện lại section cũ thay vì tạo trùng. */
const AUTO_SECTION_ID: Record<SectionBucketKey, string> = {
  general: 'sec_auto_general',
  carrier: 'sec_auto_carrier',
  vehicle: 'sec_auto_vehicle',
  schedule: 'sec_auto_schedule',
  assets: 'sec_auto_assets',
  confirmation: 'sec_auto_confirmation',
  approval: 'sec_auto_approval'
}

/**
 * Phân loại field vào section hợp lý dựa trên tên field (heuristic theo tiền tố/từ khoá) và field type.
 * Không hardcode riêng cho 1 biểu mẫu cụ thể — áp dụng chung cho mọi field chưa được đặt vào layout.
 */
export const classifyFieldSection = (field: DataField): SectionBucketKey => {
  const name = field.name.toLowerCase()

  if (/approv/.test(name)) return 'approval'
  if (/^confirmed/.test(name)) return 'confirmation'
  if (field.type === 'repeater' || /\basset|movement_notes|\bnote/.test(name)) return 'assets'
  if (/vehicle/.test(name)) return 'vehicle'
  if (/carrier|contact_/.test(name)) return 'carrier'
  if (/^move_(from|to)_date|move_date|move_time|schedule/.test(name)) return 'schedule'

  return 'general'
}

const buildFieldComponent = (field: DataField): UiComponent => (
  field.type === 'repeater'
    ? { id: generateBuilderId('cmp'), type: 'repeater', field_id: field.id, column_span: 2 }
    : { id: generateBuilderId('cmp'), type: 'field', field_id: field.id, column_span: 1 }
)

const findAutoSection = (components: UiComponent[], sectionId: string): SectionComponent | null => {
  for (const component of components) {
    if (component.type === 'section' && component.id === sectionId) return component
  }

  return null
}

/**
 * Tự động đưa toàn bộ field trong data_schema nhưng chưa có trong ui_schema vào các section hợp lý
 * (Thông tin chung/Đơn vị vận chuyển/Phương tiện/Lịch vận chuyển/Danh sách tài sản/Xác nhận/Phê duyệt).
 * Idempotent: nếu section tự sinh đã tồn tại (theo id ổn định) thì chỉ append field còn thiếu, không tạo trùng section.
 * Không xoá/động vào component đã có sẵn của người thiết kế.
 */
export const autoPlaceUnplacedFields = (dataSchema: FormDataSchema, uiSchema: FormUiSchema): { uiSchema: FormUiSchema; placedCount: number } => {
  const referenced = collectReferencedFieldIds(uiSchema.components)
  const unplaced = dataSchema.fields.filter(field => !referenced.has(field.id))

  if (unplaced.length === 0) return { uiSchema, placedCount: 0 }

  const grouped = new Map<SectionBucketKey, DataField[]>()

  unplaced.forEach(field => {
    const bucket = classifyFieldSection(field)
    const list = grouped.get(bucket) ?? []

    list.push(field)
    grouped.set(bucket, list)
  })

  const nextComponents = uiSchema.components.map(component => (component.type === 'section' ? { ...component, children: [...component.children] } : component))
  const appendedSections: UiComponent[] = []

  BUCKET_ORDER.forEach(bucket => {
    const fields = grouped.get(bucket)

    if (!fields || fields.length === 0) return

    const sectionId = AUTO_SECTION_ID[bucket]
    const existing = findAutoSection(nextComponents, sectionId) ?? findAutoSection(appendedSections, sectionId)
    const newFieldComponents = fields.map(buildFieldComponent)

    if (existing) {
      existing.children.push(...newFieldComponents)
    } else {
      appendedSections.push({
        id: sectionId,
        type: 'section',
        title: SECTION_TITLES[bucket],
        columns: 2,
        show_border: true,
        show_background: false,
        collapsible: false,
        spacing: 'normal',
        children: newFieldComponents
      })
    }
  })

  // Chèn các section mới trước signature_block (nếu có) để chữ ký luôn ở cuối form.
  const signatureIndex = nextComponents.findIndex(component => component.type === 'signature_block')
  const finalComponents = signatureIndex === -1
    ? [...nextComponents, ...appendedSections]
    : [...nextComponents.slice(0, signatureIndex), ...appendedSections, ...nextComponents.slice(signatureIndex)]

  return {
    uiSchema: { ...uiSchema, components: finalComponents },
    placedCount: unplaced.length
  }
}
