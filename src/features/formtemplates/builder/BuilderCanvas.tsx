'use client'

import { Box, Typography } from '@mui/material'
import { useDrop } from 'react-dnd'

import type { DataFieldType, FormDataSchema, UiComponent, UiComponentType } from '../formSchema.types'
import BuilderComponentNode from './BuilderComponentNode'
import type { PaletteDragItem } from './ComponentPalette'
import { PALETTE_ITEM_TYPE } from './dndTypes'

type Props = {
  components: UiComponent[]
  dataSchema: FormDataSchema
  selectedId: string | null
  locale: string
  emptyStateLabel: string
  readOnly?: boolean
  onSelect: (id: string) => void
  onAddComponent: (componentType: UiComponentType, fieldType?: DataFieldType, parentSectionId?: string) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}

const BuilderCanvas = ({
  components,
  dataSchema,
  selectedId,
  locale,
  emptyStateLabel,
  readOnly,
  onSelect,
  onAddComponent,
  onDuplicate,
  onRemove,
  onMoveUp,
  onMoveDown
}: Props) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: PALETTE_ITEM_TYPE,
    canDrop: () => !readOnly,
    drop: (item: PaletteDragItem, monitor) => {
      if (monitor.didDrop()) return
      onAddComponent(item.componentType, item.fieldType)
    },
    collect: monitor => ({ isOver: monitor.isOver({ shallow: true }), canDrop: monitor.canDrop() })
  }), [onAddComponent, readOnly])

  return (
    <Box
      ref={drop as unknown as React.Ref<HTMLDivElement>}
      sx={{
        minHeight: 320,
        p: 2,
        border: '1px dashed',
        borderColor: isOver && canDrop ? 'primary.main' : 'divider',
        borderRadius: 2,
        bgcolor: isOver && canDrop ? 'action.hover' : 'transparent'
      }}
    >
      {components.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
          {emptyStateLabel}
        </Typography>
      ) : (
        components.map(component => (
          <BuilderComponentNode
            key={component.id}
            component={component}
            dataSchema={dataSchema}
            selectedId={selectedId}
            locale={locale}
            onSelect={onSelect}
            onAddInto={(sectionId, componentType, fieldType) => onAddComponent(componentType, fieldType, sectionId)}
            onDuplicate={onDuplicate}
            onRemove={onRemove}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            readOnly={readOnly}
          />
        ))
      )}
    </Box>
  )
}

export default BuilderCanvas
