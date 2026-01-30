

// Type Imports
import type { ThemeColor } from '@core/types'

export type CalendarFiltersType = 'Personal' | 'Business' | 'Family' | 'Holiday' | 'ETC'

export type CalendarColors = {
  ETC: ThemeColor
  Family: ThemeColor
  Holiday: ThemeColor
  Personal: ThemeColor
  Business: ThemeColor
}


export type EventType = {
  id: number
  url: string
  title: string
  allDay: boolean
  end: Date | string
  start: Date | string
  status: string
  extendedProps: {
    location?: string
    calendar?: string
    description?: string
    guests?: string[] | string | undefined
    icon?: string
  }
}

export type CalendarColorsDetail = {
  R: string
  A: string
  P: string
  C: string
}

export type CalendarTypeMain = {
  calendarApi: any
  events: EventType[] | undefined
  calendarsColor: CalendarColors
  calendarsColorDetail: CalendarColorsDetail
  setCalendarApi: (val: any) => void
  handleLeftSidebarToggle: () => void
  updateEvent: (event: EventType) => void
  handleAddEventSidebarToggle: () => void
  handleSelectEvent: (event: EventType) => void
  editTable: boolean
  eventStartEditable: boolean
}

