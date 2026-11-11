import { v4 as uuidv4 } from 'uuid'

import type {
  DataField,
  DataFieldType,
  FormDataSchema,
  FormPrintSchema,
  FormUiSchema,
  LocalizedText
} from '../formSchema.types'
import { defaultFormPrintSchema, emptyFormDataSchema, emptyFormUiSchema } from '../formSchema.types'
import { isValidFieldName, parseFormSchema } from '../formTemplateHelpers'
import type { FormSchemaField, FormSchemaFieldOption } from '../types'

export type FormDefinition = {
  data_schema: FormDataSchema
  ui_schema: FormUiSchema
  print_schema: FormPrintSchema
}

const LEGACY_TYPE_MAP: Record<string, DataFieldType> = {
  text: 'text',
  string: 'text',
  textarea: 'textarea',
  number: 'number',
  int: 'number',
  integer: 'number',
  date: 'date',
  time: 'time',
  time_range: 'time_range',
  select: 'select',
  dropdown: 'select',
  radio: 'radio',
  checkbox: 'checkbox',
  apartment: 'apartment',
  resident: 'resident',
  repeater: 'repeater',
  table: 'repeater'
}

const toLocalizedText = (value: unknown): LocalizedText => {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>

    return { vi: String(record.vi ?? ''), en: record.en !== undefined ? String(record.en) : undefined }
  }

  return { vi: value ? String(value) : '' }
}

const toLegacyOptionValue = (option: FormSchemaFieldOption | string, index: number) => {
  if (typeof option === 'string') return { value: option, label: toLocalizedText(option) }

  const value = option.value ?? option.label ?? `option_${index + 1}`

  return { value: String(value), label: toLocalizedText(option.label ?? value) }
}

/** Sinh field name hợp lệ/duy nhất khi field cũ không có name hoặc sai định dạng. */
const resolveFieldName = (rawName: string | undefined, index: number, used: Set<string>) => {
  const normalized = (rawName ?? '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^[^a-z]+/, '')
  let candidate = normalized && isValidFieldName(normalized) ? normalized : `field_${index + 1}`

  while (used.has(candidate)) candidate = `${candidate}_${index + 1}`
  used.add(candidate)

  return candidate
}

const adaptLegacyField = (legacy: FormSchemaField, index: number, used: Set<string>): DataField => {
  const name = resolveFieldName(legacy.name, index, used)
  const type = LEGACY_TYPE_MAP[(legacy.type ?? '').toLowerCase()] ?? 'text'

  return {
    id: `fld_${name}`,
    name,
    type,
    label: toLocalizedText(legacy.label ?? name),
    placeholder: legacy.placeholder ? toLocalizedText(legacy.placeholder) : undefined,
    required: Boolean(legacy.required),
    default_value: legacy.default_value ?? null,
    options: Array.isArray(legacy.options) ? legacy.options.map((option, optionIndex) => toLegacyOptionValue(option, optionIndex)) : undefined
  }
}

/**
 * Chuyển schema_json cũ (mảng field phẳng) sang data_schema/ui_schema mới.
 * Không mất dữ liệu cũ: mỗi field cũ trở thành 1 field component trong 1 Section duy nhất, giữ nguyên thứ tự.
 */
export const adaptLegacySchemaToFormDefinition = (schemaJson: string | null | undefined): FormDefinition => {
  const parsed = parseFormSchema(schemaJson)

  if (parsed.status !== 'ok' || parsed.fields.length === 0) {
    return {
      data_schema: emptyFormDataSchema(),
      ui_schema: emptyFormUiSchema(),
      print_schema: defaultFormPrintSchema()
    }
  }

  const used = new Set<string>()
  const fields = parsed.fields.map((legacy, index) => adaptLegacyField(legacy, index, used))

  const data_schema: FormDataSchema = { schema_version: '1.0', fields }
  const ui_schema: FormUiSchema = {
    schema_version: '1.0',
    components: [
      {
        id: 'sec_legacy',
        type: 'section',
        title: { vi: 'Thông tin biểu mẫu', en: 'Form information' },
        columns: 1,
        show_border: true,
        show_background: false,
        collapsible: false,
        spacing: 'normal',
        children: fields.map(field => ({
          id: `cmp_${field.name}`,
          type: 'field',
          field_id: field.id,
          column_span: 1
        }))
      }
    ]
  }

  return { data_schema, ui_schema, print_schema: defaultFormPrintSchema() }
}

/**
 * Schema mẫu cho FORM_MOVE_IN ("ĐĂNG KÝ CHUYỂN ĐỒ VÀO CHUNG CƯ") — chỉ dùng làm dữ liệu khởi tạo
 * khi template có form_code === 'FORM_MOVE_IN' và chưa có version/schema nào. KHÔNG hardcode vào renderer.
 */
export const FORM_MOVE_IN_DEFAULT_DEFINITION: FormDefinition = {
  data_schema: {
    schema_version: '1.0',
    fields: [
      { id: 'fld_applicant_name', name: 'applicant_name', type: 'text', label: { vi: 'Họ và tên', en: 'Full name' }, placeholder: { vi: 'Nhập họ và tên', en: 'Enter full name' }, required: true, default_binding: 'current_user.full_name' },
      { id: 'fld_phone', name: 'phone', type: 'text', label: { vi: 'Số điện thoại', en: 'Phone number' }, required: true, default_binding: 'current_user.phone' },
      { id: 'fld_apartment_id', name: 'apartment_id', type: 'apartment', label: { vi: 'Căn hộ', en: 'Apartment' }, required: true, default_binding: 'current_apartment.id', data_source: { source_key: 'apartment_lookup' } },
      { id: 'fld_building_id', name: 'building_id', type: 'select', label: { vi: 'Toà nhà', en: 'Building' }, required: true, data_source: { source_key: 'project_buildings' } },
      { id: 'fld_identity_number', name: 'identity_number', type: 'text', label: { vi: 'Số CCCD/CMND', en: 'Identity number' }, required: true, default_binding: 'current_user.identity_number' },
      { id: 'fld_resident_relationship', name: 'resident_relationship', type: 'text', label: { vi: 'Quan hệ với cư dân', en: 'Relationship with resident' } },
      { id: 'fld_move_date', name: 'move_date', type: 'date', label: { vi: 'Ngày chuyển đồ', en: 'Move date' }, required: true },
      { id: 'fld_move_time_range', name: 'move_time_range', type: 'time_range', label: { vi: 'Khung giờ chuyển đồ', en: 'Move time range' }, required: true },
      { id: 'fld_vehicle_type', name: 'vehicle_type', type: 'select', label: { vi: 'Loại phương tiện', en: 'Vehicle type' }, options: [{ value: 'TRUCK', label: { vi: 'Xe tải', en: 'Truck' } }, { value: 'VAN', label: { vi: 'Xe bán tải', en: 'Van' } }] },
      { id: 'fld_vehicle_plate', name: 'vehicle_plate', type: 'text', label: { vi: 'Biển số xe', en: 'Vehicle plate' } },
      { id: 'fld_transport_company', name: 'transport_company', type: 'text', label: { vi: 'Đơn vị vận chuyển', en: 'Transport company' } },
      { id: 'fld_contact_person', name: 'contact_person', type: 'text', label: { vi: 'Người liên hệ', en: 'Contact person' } },
      {
        id: 'fld_moving_items',
        name: 'moving_items',
        type: 'repeater',
        label: { vi: 'Danh sách đồ dùng', en: 'Moving items' },
        required: true,
        min_rows: 1,
        max_rows: 50,
        columns: [
          { id: 'col_item_name', name: 'item_name', type: 'text', label: { vi: 'Tên đồ dùng', en: 'Item name' }, required: true },
          { id: 'col_quantity', name: 'quantity', type: 'number', label: { vi: 'Số lượng', en: 'Quantity' }, required: true },
          { id: 'col_note', name: 'note', type: 'text', label: { vi: 'Ghi chú', en: 'Note' } }
        ]
      },
      { id: 'fld_agreement', name: 'agreement', type: 'checkbox', label: { vi: 'Tôi đã đọc và đồng ý với quy định chuyển đồ của Ban quản lý', en: 'I have read and agree to the moving policy' }, required: true }
    ]
  },
  ui_schema: {
    schema_version: '1.0',
    components: [
      { id: 'head_title', type: 'heading', text: { vi: 'ĐĂNG KÝ CHUYỂN ĐỒ VÀO CHUNG CƯ', en: 'REGISTRATION FOR MOVING INTO THE BUILDING' }, level: 1 },
      {
        id: 'sec_applicant',
        type: 'section',
        title: { vi: 'Thông tin người đăng ký', en: 'Applicant information' },
        columns: 2,
        show_border: true,
        show_background: false,
        collapsible: false,
        spacing: 'normal',
        children: [
          { id: 'cmp_applicant_name', type: 'field', field_id: 'fld_applicant_name', column_span: 1 },
          { id: 'cmp_phone', type: 'field', field_id: 'fld_phone', column_span: 1 },
          { id: 'cmp_apartment_id', type: 'field', field_id: 'fld_apartment_id', column_span: 1 },
          { id: 'cmp_building_id', type: 'field', field_id: 'fld_building_id', column_span: 1 },
          { id: 'cmp_identity_number', type: 'field', field_id: 'fld_identity_number', column_span: 1 },
          { id: 'cmp_resident_relationship', type: 'field', field_id: 'fld_resident_relationship', column_span: 1 }
        ]
      },
      {
        id: 'sec_move_info',
        type: 'section',
        title: { vi: 'Thông tin chuyển đồ', en: 'Move information' },
        columns: 2,
        show_border: true,
        show_background: false,
        collapsible: false,
        spacing: 'normal',
        children: [
          { id: 'cmp_move_date', type: 'field', field_id: 'fld_move_date', column_span: 1 },
          { id: 'cmp_move_time_range', type: 'field', field_id: 'fld_move_time_range', column_span: 1 },
          { id: 'cmp_vehicle_type', type: 'field', field_id: 'fld_vehicle_type', column_span: 1 },
          { id: 'cmp_vehicle_plate', type: 'field', field_id: 'fld_vehicle_plate', column_span: 1 },
          { id: 'cmp_transport_company', type: 'field', field_id: 'fld_transport_company', column_span: 1 },
          { id: 'cmp_contact_person', type: 'field', field_id: 'fld_contact_person', column_span: 1 }
        ]
      },
      { id: 'cmp_moving_items', type: 'repeater', field_id: 'fld_moving_items', column_span: 1 },
      { id: 'static_commitment', type: 'static_text', content: { vi: 'Người đăng ký cam kết thực hiện đúng quy định vận chuyển đồ đạc của Ban quản lý toà nhà.', en: 'The applicant commits to comply with the building management moving regulations.' } },
      { id: 'cmp_agreement', type: 'field', field_id: 'fld_agreement', column_span: 1 },
      {
        id: 'cmp_signature',
        type: 'signature_block',
        signers: [
          { code: 'APPLICANT', label: { vi: 'Người đăng ký', en: 'Applicant' }, allow_e_signature: false },
          { code: 'MANAGEMENT', label: { vi: 'Ban quản lý', en: 'Management' }, allow_e_signature: false },
          { code: 'SECURITY', label: { vi: 'Bảo vệ', en: 'Security' }, allow_e_signature: false }
        ]
      }
    ]
  },
  print_schema: defaultFormPrintSchema()
}

/** Sinh id ổn định (uuid) cho component/field mới tạo trong builder. */
export const generateBuilderId = (prefix: string) => `${prefix}_${uuidv4().slice(0, 8)}`
