'use client'

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { Box, Chip, IconButton, Paper, Stack, Typography } from '@mui/material'
import { useDrop } from 'react-dnd'

import { getLocalizedText } from '@/shared/utils/getLocalizedText'

import type { DataField, DataFieldType, FormDataSchema, UiComponent, UiComponentType } from '../formSchema.types'
import type { PaletteDragItem } from './ComponentPalette'
import { PALETTE_ITEM_TYPE } from './dndTypes'

type Props = {
  component: UiComponent
  dataSchema: FormDataSchema
  selectedId: string | null
  locale: string
  onSelect: (id: string) => void
  onAddInto: (parentSectionId: string, componentType: UiComponentType, fieldType?: DataFieldType) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  readOnly?: boolean
}

const findField = (dataSchema: FormDataSchema, fieldId: string): DataField | null => (
  dataSchema.fields.find(field => field.id === fieldId) ?? null
)

const getComponentSummary = (component: UiComponent, dataSchema: FormDataSchema, locale: string): string => {
  switch (component.type) {
    case 'section':
      return getLocalizedText(component.title, locale) || (locale === 'vi' ? 'Section' : 'Section')
    case 'heading':
      return getLocalizedText(component.text, locale) || 'Heading'
    case 'static_text':
      return getLocalizedText(component.content, locale) || (locale === 'vi' ? 'Nội dung tĩnh' : 'Static text')
    case 'static_html':
      return locale === 'vi' ? 'Nội dung HTML' : 'HTML content'
    case 'field':
    case 'repeater': {
      const field = findField(dataSchema, component.field_id)

      return field ? getLocalizedText(field.label, locale) || field.name : (locale === 'vi' ? 'Field không tồn tại' : 'Missing field')
    }
    case 'signature_block':
      return locale === 'vi' ? 'Khối chữ ký' : 'Signature block'
    case 'divider':
      return 'Divider'
    case 'spacer':
      return 'Spacer'
    case 'page_break':
      return locale === 'vi' ? 'Ngắt trang' : 'Page break'
    default:
      return (component as UiComponent).type
  }
}

const BuilderComponentNode = ({
  component,
  dataSchema,
  selectedId,
  locale,
  onSelect,
  onAddInto,
  onDuplicate,
  onRemove,
  onMoveUp,
  onMoveDown,
  readOnly
}: Props) => {
  const isSelected = selectedId === component.id

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: PALETTE_ITEM_TYPE,
    canDrop: () => component.type === 'section' && !readOnly,
    drop: (item: PaletteDragItem, monitor) => {
      if (monitor.didDrop()) return
      if (component.type === 'section') onAddInto(component.id, item.componentType, item.fieldType)
    },
    collect: monitor => ({ isOver: monitor.isOver({ shallow: true }), canDrop: monitor.canDrop() })
  }), [component, onAddInto, readOnly])

  const toolbar = !readOnly && (
    <Stack direction="row" spacing={0.25}>
      <IconButton size="small" onClick={event => { event.stopPropagation(); onMoveUp(component.id) }}>
        <ArrowUpwardIcon fontSize="inherit" />
      </IconButton>
      <IconButton size="small" onClick={event => { event.stopPropagation(); onMoveDown(component.id) }}>
        <ArrowDownwardIcon fontSize="inherit" />
      </IconButton>
      <IconButton size="small" onClick={event => { event.stopPropagation(); onDuplicate(component.id) }}>
        <ContentCopyIcon fontSize="inherit" />
      </IconButton>
      <IconButton size="small" onClick={event => { event.stopPropagation(); onRemove(component.id) }}>
        <DeleteOutlineIcon fontSize="inherit" />
      </IconButton>
    </Stack>
  )

  return (
    <Paper
      variant="outlined"
      onClick={() => onSelect(component.id)}
      sx={{
        p: 1.25,
        mb: 1,
        cursor: 'pointer',
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? 'primary.main' : 'divider',
        bgcolor: isSelected ? 'action.selected' : 'background.paper',
        '&:hover': { bgcolor: isSelected ? 'action.selected' : 'action.hover' }
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
        <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 0 }}>
          <Chip size="small" label={component.type} variant="outlined" />
          <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {getComponentSummary(component, dataSchema, locale)}
          </Typography>
          {component.type === 'section' && <Chip size="small" label={`${component.columns} cột`} />}
        </Stack>
        {toolbar}
      </Stack>

      {component.type === 'section' && (
        <Box
          ref={drop as unknown as React.Ref<HTMLDivElement>}
          sx={{
            mt: 1.5,
            pl: 2,
            borderLeft: '2px dashed',
            borderColor: isOver && canDrop ? 'primary.main' : 'divider',
            bgcolor: isOver && canDrop ? 'action.hover' : 'transparent',
            minHeight: 40
          }}
        >
          {component.children.length === 0 && (
            <Typography variant="caption" color="text.secondary">
              {locale === 'vi' ? 'Kéo component vào đây' : 'Drop components here'}
            </Typography>
          )}
          {component.children.map(child => (
            <BuilderComponentNode
              key={child.id}
              component={child}
              dataSchema={dataSchema}
              selectedId={selectedId}
              locale={locale}
              onSelect={onSelect}
              onAddInto={onAddInto}
              onDuplicate={onDuplicate}
              onRemove={onRemove}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              readOnly={readOnly}
            />
          ))}
        </Box>
      )}
    </Paper>
  )
}

export default BuilderComponentNode
