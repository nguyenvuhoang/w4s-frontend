'use client'

import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined'
import ApartmentIcon from '@mui/icons-material/Apartment'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule'
import InsertPageBreakIcon from '@mui/icons-material/InsertPageBreak'
import ListAltIcon from '@mui/icons-material/ListAlt'
import NotesIcon from '@mui/icons-material/Notes'
import NumbersIcon from '@mui/icons-material/Numbers'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked'
import SpaceBarIcon from '@mui/icons-material/SpaceBar'
import TableRowsIcon from '@mui/icons-material/TableRows'
import TextFieldsIcon from '@mui/icons-material/TextFields'
import TitleIcon from '@mui/icons-material/Title'
import ViewAgendaOutlinedIcon from '@mui/icons-material/ViewAgendaOutlined'
import BorderColorIcon from '@mui/icons-material/BorderColor'
import CodeIcon from '@mui/icons-material/Code'
import ScheduleIcon from '@mui/icons-material/Schedule'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { useDrag } from 'react-dnd'

import type { DataFieldType, UiComponentType } from '../formSchema.types'
import { PALETTE_ITEM_TYPE } from './dndTypes'

export type PaletteDragItem = {
  componentType: UiComponentType
  fieldType?: DataFieldType
}

type PaletteEntry = {
  key: string
  labelVi: string
  labelEn: string
  icon: React.ReactNode
  componentType: UiComponentType
  fieldType?: DataFieldType
}

const LAYOUT_ENTRIES: PaletteEntry[] = [
  { key: 'section', labelVi: 'Section', labelEn: 'Section', icon: <ViewAgendaOutlinedIcon fontSize="small" />, componentType: 'section' },
  { key: 'heading', labelVi: 'Tiêu đề', labelEn: 'Heading', icon: <TitleIcon fontSize="small" />, componentType: 'heading' },
  { key: 'static_text', labelVi: 'Nội dung tĩnh', labelEn: 'Static text', icon: <NotesIcon fontSize="small" />, componentType: 'static_text' },
  { key: 'static_html', labelVi: 'Nội dung HTML', labelEn: 'HTML content', icon: <CodeIcon fontSize="small" />, componentType: 'static_html' },
  { key: 'divider', labelVi: 'Divider', labelEn: 'Divider', icon: <HorizontalRuleIcon fontSize="small" />, componentType: 'divider' },
  { key: 'spacer', labelVi: 'Spacer', labelEn: 'Spacer', icon: <SpaceBarIcon fontSize="small" />, componentType: 'spacer' },
  { key: 'page_break', labelVi: 'Ngắt trang', labelEn: 'Page break', icon: <InsertPageBreakIcon fontSize="small" />, componentType: 'page_break' },
  { key: 'signature_block', labelVi: 'Khối chữ ký', labelEn: 'Signature block', icon: <BorderColorIcon fontSize="small" />, componentType: 'signature_block' }
]

const FIELD_ENTRIES: PaletteEntry[] = [
  { key: 'text', labelVi: 'Text', labelEn: 'Text', icon: <TextFieldsIcon fontSize="small" />, componentType: 'field', fieldType: 'text' },
  { key: 'textarea', labelVi: 'Textarea', labelEn: 'Textarea', icon: <NotesIcon fontSize="small" />, componentType: 'field', fieldType: 'textarea' },
  { key: 'number', labelVi: 'Number', labelEn: 'Number', icon: <NumbersIcon fontSize="small" />, componentType: 'field', fieldType: 'number' },
  { key: 'date', labelVi: 'Date', labelEn: 'Date', icon: <CalendarMonthIcon fontSize="small" />, componentType: 'field', fieldType: 'date' },
  { key: 'time', labelVi: 'Time', labelEn: 'Time', icon: <ScheduleIcon fontSize="small" />, componentType: 'field', fieldType: 'time' },
  { key: 'time_range', labelVi: 'Time range', labelEn: 'Time range', icon: <ScheduleIcon fontSize="small" />, componentType: 'field', fieldType: 'time_range' },
  { key: 'select', labelVi: 'Select', labelEn: 'Select', icon: <ListAltIcon fontSize="small" />, componentType: 'field', fieldType: 'select' },
  { key: 'radio', labelVi: 'Radio', labelEn: 'Radio', icon: <RadioButtonCheckedIcon fontSize="small" />, componentType: 'field', fieldType: 'radio' },
  { key: 'checkbox', labelVi: 'Checkbox', labelEn: 'Checkbox', icon: <CheckBoxOutlinedIcon fontSize="small" />, componentType: 'field', fieldType: 'checkbox' },
  { key: 'apartment', labelVi: 'Chọn căn hộ', labelEn: 'Apartment selector', icon: <ApartmentIcon fontSize="small" />, componentType: 'field', fieldType: 'apartment' },
  { key: 'resident', labelVi: 'Chọn cư dân', labelEn: 'Resident selector', icon: <PersonSearchIcon fontSize="small" />, componentType: 'field', fieldType: 'resident' },
  { key: 'repeater', labelVi: 'Repeater/Bảng', labelEn: 'Repeater/Table', icon: <TableRowsIcon fontSize="small" />, componentType: 'repeater', fieldType: 'repeater' }
]

const PaletteItem = ({ entry, locale, onAdd }: { entry: PaletteEntry; locale: string; onAdd: () => void }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: PALETTE_ITEM_TYPE,
    item: { componentType: entry.componentType, fieldType: entry.fieldType } as PaletteDragItem,
    collect: monitor => ({ isDragging: monitor.isDragging() })
  }), [entry])

  return (
    <Paper
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      onClick={onAdd}
      variant="outlined"
      sx={{
        p: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        userSelect: 'none',
        '&:hover': { bgcolor: 'action.hover', borderColor: 'text.secondary' }
      }}
    >
      <DragIndicatorIcon fontSize="small" sx={{ color: 'text.disabled' }} />
      {entry.icon}
      <Typography variant="body2">{locale === 'vi' ? entry.labelVi : entry.labelEn}</Typography>
    </Paper>
  )
}

type Props = {
  locale: string
  onAddComponent: (componentType: UiComponentType, fieldType?: DataFieldType) => void
  disabled?: boolean
  labels: { layoutGroup: string; fieldGroup: string; dragOrClickHint: string }
}

const ComponentPalette = ({ locale, onAddComponent, disabled, labels }: Props) => (
  <Stack spacing={2} sx={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
    <Typography variant="caption" color="text.secondary">{labels.dragOrClickHint}</Typography>

    <Box>
      <Typography variant="overline" sx={{ fontWeight: 700 }}>{labels.layoutGroup}</Typography>
      <Stack spacing={0.75} sx={{ mt: 0.5 }}>
        {LAYOUT_ENTRIES.map(entry => (
          <PaletteItem key={entry.key} entry={entry} locale={locale} onAdd={() => onAddComponent(entry.componentType, entry.fieldType)} />
        ))}
      </Stack>
    </Box>

    <Box>
      <Typography variant="overline" sx={{ fontWeight: 700 }}>{labels.fieldGroup}</Typography>
      <Stack spacing={0.75} sx={{ mt: 0.5 }}>
        {FIELD_ENTRIES.map(entry => (
          <PaletteItem key={entry.key} entry={entry} locale={locale} onAdd={() => onAddComponent(entry.componentType, entry.fieldType)} />
        ))}
      </Stack>
    </Box>
  </Stack>
)

export default ComponentPalette
