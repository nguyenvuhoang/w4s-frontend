import type { DataField, FormDataSchema } from '../formSchema.types'

/**
 * Merge field từ legacy schema_json vào data_schema của version hiện tại.
 * - Field đã có trong version (match theo `name`) được GIỮ NGUYÊN (không ghi đè thuộc tính đã chỉnh sửa).
 * - Field chỉ có trong legacy schema_json được THÊM MỚI vào cuối danh sách.
 */
export const mergeLegacyFieldsIntoDataSchema = (
  versionDataSchema: FormDataSchema,
  legacyDataSchema: FormDataSchema
): { dataSchema: FormDataSchema; addedFields: DataField[] } => {
  const existingNames = new Set(versionDataSchema.fields.map(field => field.name))
  const addedFields = legacyDataSchema.fields.filter(field => !existingNames.has(field.name))

  if (addedFields.length === 0) {
    return { dataSchema: versionDataSchema, addedFields: [] }
  }

  return {
    dataSchema: { ...versionDataSchema, fields: [...versionDataSchema.fields, ...addedFields] },
    addedFields
  }
}
