'use client'

import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material'

import { generateBuilderId } from './adapter'
import { DATA_SOURCE_OPTIONS, DEFAULT_BINDING_OPTIONS } from './bindings'
import type {
  DataField,
  DataFieldType,
  DefaultBindingKey,
  FormFieldOption,
  LocalizedText,
  SectionComponent,
  SectionSpacing,
  SignerCode,
  UiComponent
} from '../formSchema.types'
import { isValidFieldName } from '../formTemplateHelpers'

type Labels = Record<string, string>

type Props = {
  selectedComponent: UiComponent | null
  selectedField: DataField | null
  locale: string
  readOnly?: boolean
  onUpdateComponent: (id: string, patch: Record<string, unknown>) => void
  onUpdateField: (fieldId: string, patch: Partial<DataField>) => void
  onRemoveField: (fieldId: string) => void
  labels: Labels
}

const t = (labels: Labels, key: string, fallback: string) => labels[key] ?? fallback

const LocalizedTextEditor = ({
  value,
  onChange,
  viLabel,
  enLabel,
  disabled,
  multiline
}: {
  value: LocalizedText
  onChange: (next: LocalizedText) => void
  viLabel: string
  enLabel: string
  disabled?: boolean
  multiline?: boolean
}) => (
  <Stack spacing={1}>
    <TextField
      fullWidth
      size="small"
      label={viLabel}
      value={value?.vi ?? ''}
      disabled={disabled}
      multiline={multiline}
      minRows={multiline ? 3 : undefined}
      onChange={event => onChange({ ...value, vi: event.target.value })}
    />
    <TextField
      fullWidth
      size="small"
      label={enLabel}
      value={value?.en ?? ''}
      disabled={disabled}
      multiline={multiline}
      minRows={multiline ? 3 : undefined}
      onChange={event => onChange({ ...value, en: event.target.value })}
    />
  </Stack>
)

const SIMPLE_COLUMN_TYPES: DataFieldType[] = ['text', 'number', 'date', 'select', 'checkbox']

const ALIGN_OPTIONS = [
  { value: 'left', label: 'Căn trái' },
  { value: 'center', label: 'Căn giữa' },
  { value: 'right', label: 'Căn phải' },
  { value: 'justify', label: 'Căn đều hai bên' }
] as const

const renderAlignSelect = (value: string | undefined, onChange: (next: string) => void, labels: Labels, disabled?: boolean) => (
  <TextField
    select
    size="small"
    label={t(labels, 'align', 'Căn chỉnh')}
    value={value ?? 'left'}
    disabled={disabled}
    onChange={event => onChange(event.target.value)}
    sx={{ backgroundColor: 'action.hover' }}
  >
    {ALIGN_OPTIONS.map(option => (
      <MenuItem key={option.value} value={option.value}>
        {t(labels, `align_${option.value}`, option.label)}
      </MenuItem>
    ))}
  </TextField>
)

const PropertiesPanel = ({ selectedComponent, selectedField, locale, readOnly, onUpdateComponent, onUpdateField, onRemoveField, labels }: Props) => {
  if (!selectedComponent) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
        {t(labels, 'noSelection', 'Chọn một component trên canvas để chỉnh sửa thuộc tính.')}
      </Typography>
    )
  }

  const disabled = Boolean(readOnly)

  if (selectedComponent.type === 'section') {
    const section = selectedComponent as SectionComponent

    return (
      <Stack spacing={2}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t(labels, 'sectionProperties', 'Thuộc tính Section')}</Typography>
        <LocalizedTextEditor
          value={section.title}
          onChange={next => onUpdateComponent(section.id, { title: next })}
          viLabel={t(labels, 'titleVi', 'Tiêu đề (VI)')}
          enLabel={t(labels, 'titleEn', 'Tiêu đề (EN)')}
          disabled={disabled}
        />
        <TextField
          select
          size="small"
          label={t(labels, 'columns', 'Số cột')}
          value={section.columns}
          disabled={disabled}
          onChange={event => onUpdateComponent(section.id, { columns: Number(event.target.value) })}
        >
          {[1, 2, 3, 4].map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}
        </TextField>
        <TextField
          select
          size="small"
          label={t(labels, 'spacing', 'Khoảng cách')}
          value={section.spacing ?? 'normal'}
          disabled={disabled}
          onChange={event => onUpdateComponent(section.id, { spacing: event.target.value as SectionSpacing })}
        >
          <MenuItem value="compact">{t(labels, 'spacingCompact', 'Gọn')}</MenuItem>
          <MenuItem value="normal">{t(labels, 'spacingNormal', 'Vừa')}</MenuItem>
          <MenuItem value="relaxed">{t(labels, 'spacingRelaxed', 'Rộng')}</MenuItem>
        </TextField>
        <FormControlLabel
          control={<Checkbox checked={Boolean(section.show_border)} disabled={disabled} onChange={event => onUpdateComponent(section.id, { show_border: event.target.checked })} />}
          label={t(labels, 'showBorder', 'Hiển thị border')}
        />
        <FormControlLabel
          control={<Checkbox checked={Boolean(section.show_background)} disabled={disabled} onChange={event => onUpdateComponent(section.id, { show_background: event.target.checked })} />}
          label={t(labels, 'showBackground', 'Hiển thị nền')}
        />
        <TextField
          select
          size="small"
          label={t(labels, 'titleAlign', 'Căn chỉnh tiêu đề')}
          value={section.title_align ?? 'left'}
          disabled={disabled}
          onChange={event => onUpdateComponent(section.id, { title_align: event.target.value })}
          sx={{ backgroundColor: 'action.hover' }}
        >
          {ALIGN_OPTIONS.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {t(labels, `align_${option.value}`, option.label)}
            </MenuItem>
          ))}
        </TextField>
        <FormControlLabel
          control={<Checkbox checked={Boolean(section.collapsible)} disabled={disabled} onChange={event => onUpdateComponent(section.id, { collapsible: event.target.checked })} />}
          label={t(labels, 'collapsible', 'Cho phép thu gọn')}
        />
      </Stack>
    )
  }

  if (selectedComponent.type === 'heading') {
    return (
      <Stack spacing={2}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t(labels, 'headingProperties', 'Thuộc tính tiêu đề')}</Typography>
        <LocalizedTextEditor
          value={selectedComponent.text}
          onChange={next => onUpdateComponent(selectedComponent.id, { text: next })}
          viLabel={t(labels, 'contentVi', 'Nội dung (VI)')}
          enLabel={t(labels, 'contentEn', 'Nội dung (EN)')}
          disabled={disabled}
        />
            <TextField
          select
          size="small"
          label={t(labels, 'headingLevel', 'Cấp độ')}
          value={selectedComponent.level ?? 2}
          disabled={disabled}
          onChange={event => onUpdateComponent(selectedComponent.id, { level: Number(event.target.value) })}
        >
          {[1, 2, 3].map(value => <MenuItem key={value} value={value}>H{value}</MenuItem>)}
        </TextField>
        {renderAlignSelect(selectedComponent.align, next => onUpdateComponent(selectedComponent.id, { align: next }), labels, disabled)}
      </Stack>
    )
  }

  if (selectedComponent.type === 'static_text') {
    return (
      <Stack spacing={2}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t(labels, 'staticTextProperties', 'Thuộc tính nội dung tĩnh')}</Typography>
        <Typography variant="caption" color="text.secondary">
          {t(labels, 'staticTextPlainOnly', 'Chỉ hỗ trợ văn bản thuần, không cho phép HTML/script.')}
        </Typography>
        <LocalizedTextEditor
          value={selectedComponent.content}
          onChange={next => onUpdateComponent(selectedComponent.id, { content: next })}
          viLabel={t(labels, 'contentVi', 'Nội dung (VI)')}
          enLabel={t(labels, 'contentEn', 'Nội dung (EN)')}
          disabled={disabled}
          multiline
        />
        {renderAlignSelect(selectedComponent.align, next => onUpdateComponent(selectedComponent.id, { align: next }), labels, disabled)}
      </Stack>
    )
  }

  if (selectedComponent.type === 'static_html') {
    return (
      <Stack spacing={2}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t(labels, 'staticHtmlProperties', 'Thuộc tính nội dung HTML')}</Typography>
        <Typography variant="caption" color="text.secondary">
          {t(labels, 'staticHtmlPlainOnly', 'Hỗ trợ định dạng cơ bản (đậm/nghiêng/danh sách/bảng/liên kết); nội dung sẽ được tự động lọc bỏ script/thẻ không an toàn trước khi hiển thị.')}
        </Typography>
        <LocalizedTextEditor
          value={selectedComponent.content}
          onChange={next => onUpdateComponent(selectedComponent.id, { content: next })}
          viLabel={t(labels, 'contentVi', 'Nội dung (VI)')}
          enLabel={t(labels, 'contentEn', 'Nội dung (EN)')}
          disabled={disabled}
          multiline
        />
        {renderAlignSelect(selectedComponent.align, next => onUpdateComponent(selectedComponent.id, { align: next }), labels, disabled)}
      </Stack>
    )
  }

  if (selectedComponent.type === 'spacer') {
    return (
      <Stack spacing={2}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Spacer</Typography>
        <TextField
          type="number"
          size="small"
          label={t(labels, 'spacerHeight', 'Chiều cao (px)')}
          value={selectedComponent.height ?? 16}
          disabled={disabled}
          onChange={event => onUpdateComponent(selectedComponent.id, { height: Number(event.target.value) || 0 })}
        />
      </Stack>
    )
  }

  if (selectedComponent.type === 'signature_block') {
    const allCodes: SignerCode[] = ['APPLICANT', 'MANAGEMENT', 'SECURITY']
    const defaultLabels: Record<SignerCode, LocalizedText> = {
      APPLICANT: { vi: 'Người đăng ký', en: 'Applicant' },
      MANAGEMENT: { vi: 'Ban quản lý', en: 'Management' },
      SECURITY: { vi: 'Bảo vệ', en: 'Security' }
    }

    return (
      <Stack spacing={2}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t(labels, 'signatureProperties', 'Thuộc tính khối chữ ký')}</Typography>
        {renderAlignSelect(selectedComponent.align, next => onUpdateComponent(selectedComponent.id, { align: next }), labels, disabled)}
        {allCodes.map(code => {
          const signer = selectedComponent.signers.find(item => item.code === code)

          return (
            <Box key={code} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={Boolean(signer)}
                    disabled={disabled}
                    onChange={event => {
                      const nextSigners = event.target.checked
                        ? [...selectedComponent.signers, { code, label: defaultLabels[code], allow_e_signature: false }]
                        : selectedComponent.signers.filter(item => item.code !== code)

                      onUpdateComponent(selectedComponent.id, { signers: nextSigners })
                    }}
                  />
                )}
                label={defaultLabels[code].vi}
              />
              {signer && (
                <Stack spacing={1} sx={{ pl: 4 }}>
                  <TextField
                    size="small"
                    label={t(labels, 'labelVi', 'Nhãn (VI)')}
                    value={signer.label.vi}
                    disabled={disabled}
                    onChange={event => {
                      const nextSigners = selectedComponent.signers.map(item => (item.code === code ? { ...item, label: { ...item.label, vi: event.target.value } } : item))

                      onUpdateComponent(selectedComponent.id, { signers: nextSigners })
                    }}
                  />
                  <FormControlLabel
                    control={(
                      <Checkbox
                        checked={Boolean(signer.allow_e_signature)}
                        disabled={disabled}
                        onChange={event => {
                          const nextSigners = selectedComponent.signers.map(item => (item.code === code ? { ...item, allow_e_signature: event.target.checked } : item))

                          onUpdateComponent(selectedComponent.id, { signers: nextSigners })
                        }}
                      />
                    )}
                    label={t(labels, 'allowESignature', 'Cho phép ký điện tử')}
                  />
                </Stack>
              )}
            </Box>
          )
        })}
      </Stack>
    )
  }

  if ((selectedComponent.type === 'field' || selectedComponent.type === 'repeater')) {
    if (!selectedField) {
      return (
        <Typography variant="body2" color="error" sx={{ p: 2 }}>
          {t(labels, 'fieldMissing', 'Field liên kết không tồn tại.')}
        </Typography>
      )
    }

    const field = selectedField
    const nameError = !isValidFieldName(field.name) ? t(labels, 'fieldNameInvalid', 'Tên field phải viết thường, dạng snake_case.') : ''

    return (
      <Stack spacing={2}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t(labels, 'fieldProperties', 'Thuộc tính field')}</Typography>

        <TextField
          size="small"
          label={t(labels, 'fieldName', 'Field name')}
          value={field.name}
          disabled={disabled}
          error={Boolean(nameError)}
          helperText={nameError}
          onChange={event => onUpdateField(field.id, { name: event.target.value })}
        />

        <LocalizedTextEditor
          value={field.label}
          onChange={next => onUpdateField(field.id, { label: next })}
          viLabel={t(labels, 'labelVi', 'Label (VI)')}
          enLabel={t(labels, 'labelEn', 'Label (EN)')}
          disabled={disabled}
        />

        <LocalizedTextEditor
          value={field.placeholder ?? { vi: '', en: '' }}
          onChange={next => onUpdateField(field.id, { placeholder: next })}
          viLabel={t(labels, 'placeholderVi', 'Placeholder (VI)')}
          enLabel={t(labels, 'placeholderEn', 'Placeholder (EN)')}
          disabled={disabled}
        />

        <LocalizedTextEditor
          value={field.help_text ?? { vi: '', en: '' }}
          onChange={next => onUpdateField(field.id, { help_text: next })}
          viLabel={t(labels, 'helpTextVi', 'Help text (VI)')}
          enLabel={t(labels, 'helpTextEn', 'Help text (EN)')}
          disabled={disabled}
        />

        <Stack direction="row" spacing={2}>
          <FormControlLabel
            control={<Checkbox checked={Boolean(field.required)} disabled={disabled} onChange={event => onUpdateField(field.id, { required: event.target.checked })} />}
            label={t(labels, 'required', 'Bắt buộc')}
          />
          <FormControlLabel
            control={<Checkbox checked={Boolean(field.read_only)} disabled={disabled} onChange={event => onUpdateField(field.id, { read_only: event.target.checked })} />}
            label={t(labels, 'readOnly', 'Chỉ đọc')}
          />
          <FormControlLabel
            control={<Checkbox checked={Boolean(field.hidden)} disabled={disabled} onChange={event => onUpdateField(field.id, { hidden: event.target.checked })} />}
            label={t(labels, 'hidden', 'Ẩn')}
          />
        </Stack>

        <TextField
          select
          size="small"
          label={t(labels, 'defaultBinding', 'Default binding')}
          value={field.default_binding ?? ''}
          disabled={disabled}
          onChange={event => onUpdateField(field.id, { default_binding: (event.target.value || null) as DefaultBindingKey | null })}
        >
          <MenuItem value="">{t(labels, 'none', '(Không)')}</MenuItem>
          {DEFAULT_BINDING_OPTIONS.map(option => (
            <MenuItem key={option.value} value={option.value}>{locale === 'vi' ? option.labelVi : option.labelEn}</MenuItem>
          ))}
        </TextField>

        {selectedComponent.type === 'field' && (
          <TextField
            select
            size="small"
            label={t(labels, 'columnSpan', 'Column span')}
            value={selectedComponent.column_span}
            disabled={disabled}
            onChange={event => onUpdateComponent(selectedComponent.id, { column_span: Number(event.target.value) })}
          >
            {[1, 2, 3, 4].map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}
          </TextField>
        )}

        {(field.type === 'select' || field.type === 'radio') && (
          <Box>
            <Typography variant="caption" color="text.secondary">{t(labels, 'options', 'Options')}</Typography>
            <Stack spacing={1} sx={{ mt: 0.5 }}>
              {(field.options ?? []).map((option, index) => (
                <Stack key={index} direction="row" spacing={1} alignItems="center">
                  <TextField
                    size="small"
                    label="value"
                    value={option.value}
                    disabled={disabled}
                    onChange={event => {
                      const next = [...(field.options ?? [])]

                      next[index] = { ...option, value: event.target.value }
                      onUpdateField(field.id, { options: next })
                    }}
                  />
                  <TextField
                    size="small"
                    label={t(labels, 'labelVi', 'Label (VI)')}
                    value={option.label.vi}
                    disabled={disabled}
                    onChange={event => {
                      const next = [...(field.options ?? [])]

                      next[index] = { ...option, label: { ...option.label, vi: event.target.value } }
                      onUpdateField(field.id, { options: next })
                    }}
                  />
                  <IconButton size="small" disabled={disabled} onClick={() => onUpdateField(field.id, { options: (field.options ?? []).filter((_, i) => i !== index) })}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              <Button
                size="small"
                startIcon={<AddIcon />}
                disabled={disabled}
                onClick={() => {
                  const next: FormFieldOption[] = [...(field.options ?? []), { value: `option_${(field.options?.length ?? 0) + 1}`, label: { vi: '', en: '' } }]

                  onUpdateField(field.id, { options: next })
                }}
              >
                {t(labels, 'addOption', 'Thêm option')}
              </Button>
            </Stack>

            <TextField
              select
              size="small"
              fullWidth
              sx={{ mt: 1.5 }}
              label={t(labels, 'dataSource', 'Data source (nếu danh sách động)')}
              value={field.data_source?.source_key ?? ''}
              disabled={disabled}
              onChange={event => onUpdateField(field.id, { data_source: event.target.value ? { source_key: event.target.value as never } : undefined })}
            >
              <MenuItem value="">{t(labels, 'none', '(Không)')}</MenuItem>
              {DATA_SOURCE_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>{locale === 'vi' ? option.labelVi : option.labelEn}</MenuItem>
              ))}
            </TextField>
          </Box>
        )}

        {(field.type === 'text' || field.type === 'textarea') && (
          <Stack direction="row" spacing={1}>
            <TextField
              type="number"
              size="small"
              label={t(labels, 'minLength', 'Min length')}
              value={field.validation?.min_length ?? ''}
              disabled={disabled}
              onChange={event => onUpdateField(field.id, { validation: { ...field.validation, min_length: event.target.value ? Number(event.target.value) : undefined } })}
            />
            <TextField
              type="number"
              size="small"
              label={t(labels, 'maxLength', 'Max length')}
              value={field.validation?.max_length ?? ''}
              disabled={disabled}
              onChange={event => onUpdateField(field.id, { validation: { ...field.validation, max_length: event.target.value ? Number(event.target.value) : undefined } })}
            />
          </Stack>
        )}

        {field.type === 'number' && (
          <Stack direction="row" spacing={1}>
            <TextField
              type="number"
              size="small"
              label={t(labels, 'min', 'Min')}
              value={field.validation?.min ?? ''}
              disabled={disabled}
              onChange={event => onUpdateField(field.id, { validation: { ...field.validation, min: event.target.value ? Number(event.target.value) : undefined } })}
            />
            <TextField
              type="number"
              size="small"
              label={t(labels, 'max', 'Max')}
              value={field.validation?.max ?? ''}
              disabled={disabled}
              onChange={event => onUpdateField(field.id, { validation: { ...field.validation, max: event.target.value ? Number(event.target.value) : undefined } })}
            />
          </Stack>
        )}

        {(field.type === 'apartment' || field.type === 'resident') && (
          <TextField
            select
            size="small"
            label={t(labels, 'dataSource', 'Data source')}
            value={field.data_source?.source_key ?? ''}
            disabled={disabled}
            onChange={event => onUpdateField(field.id, { data_source: event.target.value ? { source_key: event.target.value as never } : undefined })}
          >
            <MenuItem value="">{t(labels, 'none', '(Không)')}</MenuItem>
            {DATA_SOURCE_OPTIONS.map(option => (
              <MenuItem key={option.value} value={option.value}>{locale === 'vi' ? option.labelVi : option.labelEn}</MenuItem>
            ))}
          </TextField>
        )}

        {field.type === 'repeater' && (
          <Box>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" spacing={1}>
              <TextField
                type="number"
                size="small"
                label={t(labels, 'minRows', 'Min rows')}
                value={field.min_rows ?? ''}
                disabled={disabled}
                onChange={event => onUpdateField(field.id, { min_rows: event.target.value ? Number(event.target.value) : undefined })}
              />
              <TextField
                type="number"
                size="small"
                label={t(labels, 'maxRows', 'Max rows')}
                value={field.max_rows ?? ''}
                disabled={disabled}
                onChange={event => onUpdateField(field.id, { max_rows: event.target.value ? Number(event.target.value) : undefined })}
              />
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>{t(labels, 'repeaterColumns', 'Cột')}</Typography>
            <Stack spacing={1} sx={{ mt: 0.5 }}>
              {(field.columns ?? []).map((column, index) => (
                <Stack key={column.id} direction="row" spacing={1} alignItems="center">
                  <TextField
                    size="small"
                    label={t(labels, 'fieldName', 'name')}
                    value={column.name}
                    disabled={disabled}
                    onChange={event => {
                      const next = [...(field.columns ?? [])]

                      next[index] = { ...column, name: event.target.value }
                      onUpdateField(field.id, { columns: next })
                    }}
                  />
                  <TextField
                    select
                    size="small"
                    sx={{ minWidth: 110 }}
                    label={t(labels, 'type', 'type')}
                    value={column.type}
                    disabled={disabled}
                    onChange={event => {
                      const next = [...(field.columns ?? [])]

                      next[index] = { ...column, type: event.target.value as DataFieldType }
                      onUpdateField(field.id, { columns: next })
                    }}
                  >
                    {SIMPLE_COLUMN_TYPES.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                  </TextField>
                  <TextField
                    size="small"
                    label={t(labels, 'labelVi', 'Label (VI)')}
                    value={column.label.vi}
                    disabled={disabled}
                    onChange={event => {
                      const next = [...(field.columns ?? [])]

                      next[index] = { ...column, label: { ...column.label, vi: event.target.value } }
                      onUpdateField(field.id, { columns: next })
                    }}
                  />
                  <IconButton size="small" disabled={disabled} onClick={() => onUpdateField(field.id, { columns: (field.columns ?? []).filter((_, i) => i !== index) })}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              <Button
                size="small"
                startIcon={<AddIcon />}
                disabled={disabled}
                onClick={() => {
                  const newColumn: DataField = {
                    id: generateBuilderId('col'),
                    name: `column_${(field.columns?.length ?? 0) + 1}`,
                    type: 'text',
                    label: { vi: '', en: '' },
                    required: false
                  }

                  onUpdateField(field.id, { columns: [...(field.columns ?? []), newColumn] })
                }}
              >
                {t(labels, 'addColumn', 'Thêm cột')}
              </Button>
            </Stack>
          </Box>
        )}

        <Divider />
        <Button
          size="small"
          color="error"
          variant="outlined"
          startIcon={<DeleteOutlineIcon />}
          disabled={disabled}
          onClick={() => onRemoveField(field.id)}
        >
          {t(labels, 'deleteField', 'Xoá field khỏi biểu mẫu')}
        </Button>
      </Stack>
    )
  }

  return (
    <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
      {t(labels, 'noEditableProperties', 'Component này không có thuộc tính chỉnh sửa.')}
    </Typography>
  )
}

export default PropertiesPanel
