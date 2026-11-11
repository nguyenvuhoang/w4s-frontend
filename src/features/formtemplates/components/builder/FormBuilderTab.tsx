'use client'

import { Alert, Box, Grid, Paper, Stack, Typography } from '@mui/material'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import { getLocalizedText } from '@/shared/utils/getLocalizedText'
import SwalAlert from '@/shared/utils/SwalAlert'

import BuilderCanvas from '../../builder/BuilderCanvas'
import ComponentPalette from '../../builder/ComponentPalette'
import PropertiesPanel from '../../builder/PropertiesPanel'
import { getUnplacedFields } from '../../builder/treeUtils'
import { useFormBuilder } from '../../hooks/useFormBuilder'
import type { FormDataSchema, FormUiSchema } from '../../formSchema.types'
import { formTemplateText } from '../../formTemplateHelpers'
import type { FormTemplateDictionary } from '../../types'

type Props = {
  dictionary: FormTemplateDictionary
  locale: string
  dataSchema: FormDataSchema
  uiSchema: FormUiSchema
  setDataSchema: (updater: (current: FormDataSchema) => FormDataSchema) => void
  setUiSchema: (updater: (current: FormUiSchema) => FormUiSchema) => void
  readOnly: boolean
}

const ft = (dictionary: FormTemplateDictionary, key: string, fallback: string) => formTemplateText(dictionary, key, fallback)

const FormBuilderTab = ({ dictionary, locale, dataSchema, uiSchema, setDataSchema, setUiSchema, readOnly }: Props) => {
  const builder = useFormBuilder({ dataSchema, uiSchema, setDataSchema, setUiSchema, readOnly })

  const confirmRemoveComponent = (id: string) => {
    SwalAlert(
      'warning',
      ft(dictionary, 'confirmDeleteComponent', 'Xoá component này? Nếu component đang tham chiếu field và không còn nơi nào khác dùng, field đó cũng sẽ bị xoá.'),
      'center',
      false,
      true,
      true,
      () => builder.removeComponent(id),
      ft(dictionary, 'deleteButton', 'Xoá')
    )
  }

  const confirmRemoveField = (fieldId: string) => {
    SwalAlert(
      'warning',
      ft(dictionary, 'confirmDeleteField', 'Xoá field này khỏi biểu mẫu? Mọi component đang tham chiếu field sẽ bị xoá theo.'),
      'center',
      false,
      true,
      true,
      () => builder.removeFieldAndReferences(fieldId),
      ft(dictionary, 'deleteButton', 'Xoá')
    )
  }

  const propertyLabels = {
    noSelection: ft(dictionary, 'noSelection', 'Chọn một component trên canvas để chỉnh sửa thuộc tính.'),
    sectionProperties: ft(dictionary, 'sectionProperties', 'Thuộc tính Section'),
    titleVi: ft(dictionary, 'titleVi', 'Tiêu đề (VI)'),
    titleEn: ft(dictionary, 'titleEn', 'Tiêu đề (EN)'),
    columns: ft(dictionary, 'columns', 'Số cột'),
    spacing: ft(dictionary, 'spacing', 'Khoảng cách'),
    spacingCompact: ft(dictionary, 'spacingCompact', 'Gọn'),
    spacingNormal: ft(dictionary, 'spacingNormal', 'Vừa'),
    spacingRelaxed: ft(dictionary, 'spacingRelaxed', 'Rộng'),
    showBorder: ft(dictionary, 'showBorder', 'Hiển thị border'),
    showBackground: ft(dictionary, 'showBackground', 'Hiển thị nền'),
    collapsible: ft(dictionary, 'collapsible', 'Cho phép thu gọn'),
    headingProperties: ft(dictionary, 'headingProperties', 'Thuộc tính tiêu đề'),
    contentVi: ft(dictionary, 'contentVi', 'Nội dung (VI)'),
    contentEn: ft(dictionary, 'contentEn', 'Nội dung (EN)'),
    headingLevel: ft(dictionary, 'headingLevel', 'Cấp độ'),
    staticTextProperties: ft(dictionary, 'staticTextProperties', 'Thuộc tính nội dung tĩnh'),
    staticTextPlainOnly: ft(dictionary, 'staticTextPlainOnly', 'Chỉ hỗ trợ văn bản thuần, không cho phép HTML/script.'),
    staticHtmlProperties: ft(dictionary, 'staticHtmlProperties', 'Thuộc tính nội dung HTML'),
    staticHtmlPlainOnly: ft(dictionary, 'staticHtmlPlainOnly', 'Hỗ trợ định dạng cơ bản (đậm/nghiêng/danh sách/bảng/liên kết); nội dung sẽ được tự động lọc bỏ script/thẻ không an toàn trước khi hiển thị.'),
    spacerHeight: ft(dictionary, 'spacerHeight', 'Chiều cao (px)'),
    signatureProperties: ft(dictionary, 'signatureProperties', 'Thuộc tính khối chữ ký'),
    labelVi: ft(dictionary, 'labelVi', 'Nhãn (VI)'),
    allowESignature: ft(dictionary, 'allowESignature', 'Cho phép ký điện tử'),
    fieldMissing: ft(dictionary, 'fieldMissing', 'Field liên kết không tồn tại.'),
    fieldProperties: ft(dictionary, 'fieldProperties', 'Thuộc tính field'),
    fieldName: ft(dictionary, 'fieldName', 'Field name'),
    fieldNameInvalid: ft(dictionary, 'fieldNameInvalid', 'Tên field phải viết thường, dạng snake_case.'),
    placeholderVi: ft(dictionary, 'placeholderVi', 'Placeholder (VI)'),
    placeholderEn: ft(dictionary, 'placeholderEn', 'Placeholder (EN)'),
    helpTextVi: ft(dictionary, 'helpTextVi', 'Help text (VI)'),
    helpTextEn: ft(dictionary, 'helpTextEn', 'Help text (EN)'),
    required: ft(dictionary, 'schemaFieldRequired', 'Bắt buộc'),
    readOnly: ft(dictionary, 'readOnlyField', 'Chỉ đọc'),
    hidden: ft(dictionary, 'hidden', 'Ẩn'),
    defaultBinding: ft(dictionary, 'defaultBinding', 'Default binding'),
    none: ft(dictionary, 'none', '(Không)'),
    columnSpan: ft(dictionary, 'columnSpan', 'Column span'),
    options: ft(dictionary, 'schemaFieldOptions', 'Options'),
    addOption: ft(dictionary, 'addOption', 'Thêm option'),
    dataSource: ft(dictionary, 'dataSource', 'Data source'),
    minLength: ft(dictionary, 'minLength', 'Min length'),
    maxLength: ft(dictionary, 'maxLength', 'Max length'),
    min: ft(dictionary, 'min', 'Min'),
    max: ft(dictionary, 'max', 'Max'),
    minRows: ft(dictionary, 'minRows', 'Min rows'),
    maxRows: ft(dictionary, 'maxRows', 'Max rows'),
    repeaterColumns: ft(dictionary, 'repeaterColumns', 'Cột'),
    type: ft(dictionary, 'type', 'Loại'),
    addColumn: ft(dictionary, 'addColumn', 'Thêm cột'),
    deleteField: ft(dictionary, 'deleteField', 'Xoá field khỏi biểu mẫu'),
    noEditableProperties: ft(dictionary, 'noEditableProperties', 'Component này không có thuộc tính chỉnh sửa.')
  }

  const unplacedFields = getUnplacedFields(dataSchema, uiSchema.components)

  return (
    <Stack spacing={2}>
      {readOnly && (
        <Alert severity="info">
          {ft(dictionary, 'builderReadOnlyNotice', 'Phiên bản này đang ở chế độ chỉ xem. Tạo phiên bản nháp mới để chỉnh sửa.')}
        </Alert>
      )}

      {unplacedFields.length > 0 && (
        <Alert severity="warning">
          {ft(dictionary, 'unplacedFieldsNotice', 'Có {count} field trong data_schema chưa được đưa vào bố cục (ui_schema), nên chưa hiển thị ở Xem trước/Bản in:').replace('{count}', String(unplacedFields.length))}{' '}
          {unplacedFields.map(field => getLocalizedText(field.label, locale) || field.name).join(', ')}
        </Alert>
      )}

      <DndProvider backend={HTML5Backend}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Paper variant="outlined" sx={{ p: 1.5, maxHeight: 720, overflowY: 'auto' }}>
              <ComponentPalette
                locale={locale}
                disabled={readOnly}
                onAddComponent={(componentType, fieldType) => builder.addComponent(componentType, { fieldType })}
                labels={{
                  layoutGroup: ft(dictionary, 'paletteLayoutGroup', 'Bố cục'),
                  fieldGroup: ft(dictionary, 'paletteFieldGroup', 'Trường nhập liệu'),
                  dragOrClickHint: ft(dictionary, 'paletteHint', 'Kéo vào canvas hoặc bấm để thêm nhanh vào cuối biểu mẫu.')
                }}
              />
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ maxHeight: 720, overflowY: 'auto', pr: 0.5 }}>
              <BuilderCanvas
                components={uiSchema.components}
                dataSchema={dataSchema}
                selectedId={builder.selectedComponentId}
                locale={locale}
                readOnly={readOnly}
                emptyStateLabel={ft(dictionary, 'canvasEmptyState', 'Chưa có component nào. Kéo hoặc bấm chọn từ danh sách bên trái để bắt đầu.')}
                onSelect={builder.selectComponent}
                onAddComponent={(componentType, fieldType, parentSectionId) => builder.addComponent(componentType, { fieldType, parentSectionId })}
                onDuplicate={builder.duplicateComponent}
                onRemove={confirmRemoveComponent}
                onMoveUp={id => builder.moveComponent(id, 'up')}
                onMoveDown={id => builder.moveComponent(id, 'down')}
              />
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Paper variant="outlined" sx={{ p: 1.5, maxHeight: 720, overflowY: 'auto' }}>
              <PropertiesPanel
                selectedComponent={builder.selectedComponent}
                selectedField={builder.selectedField}
                locale={locale}
                readOnly={readOnly}
                onUpdateComponent={builder.updateComponent}
                onUpdateField={builder.updateField}
                onRemoveField={confirmRemoveField}
                labels={propertyLabels}
              />
            </Paper>
          </Grid>
        </Grid>
      </DndProvider>

      <Typography variant="caption" color="text.secondary">
        {dataSchema.fields.length} {ft(dictionary, 'fieldsCountLabel', 'field')} · {uiSchema.components.length} {ft(dictionary, 'componentsCountLabel', 'component gốc')}
      </Typography>
    </Stack>
  )
}

export default FormBuilderTab
