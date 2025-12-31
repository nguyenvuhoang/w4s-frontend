// ** React Import
import { useEffect, useRef } from 'react'

// ** Full Calendar & it's Plugins
import bootstrap5Plugin from '@fullcalendar/bootstrap5'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'

// ** Types
import { CalendarTypeMain } from '@/types/calendarTypes'

// ** Third Party Style Import
import 'bootstrap-icons/font/bootstrap-icons.css'

const blankEvent = {
  title: '',
  start: '',
  end: '',
  allDay: false,
  url: '',
  extendedProps: {
    calendar: '',
    guests: [],
    location: '',
    description: '',
    icon: ''
  }
}

const CalendarMain = (props: CalendarTypeMain) => {
  // ** Props
  const {
    events,
    calendarApi,
    calendarsColorDetail,
    setCalendarApi,
    handleLeftSidebarToggle,
    handleAddEventSidebarToggle,
    editTable,
    eventStartEditable
  } = props

  // ** Refs
  const calendarRef = useRef<FullCalendar | null>(null)

  useEffect(() => {
    if (calendarApi === null) {
      // @ts-ignore
      setCalendarApi(calendarRef.current?.getApi())
    }
  }, [calendarApi, setCalendarApi])

  if (events) {
    // ** calendarOptions(Props)
    const calendarOptions = {
      events: events.length ? events : [],
      plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin, bootstrap5Plugin],
      initialView: 'dayGridMonth',
      headerToolbar: {
        start: 'prev, next',
        end: 'dayGridMonth,timeGridWeek,timeGridDay',
        center: 'title',
      },
      views: {
        week: {
          titleFormat: { year: 'numeric', month: 'long', day: 'numeric' }
        }
      },

      /*
      Enable dragging and resizing event
      ? Docs: https://fullcalendar.io/docs/editable
    */
      editable: editTable,

      /*
      Enable resizing event from start
      ? Docs: https://fullcalendar.io/docs/eventResizableFromStart
    */
      eventResizableFromStart: true,

      /*
        Automatically scroll the scroll-containers during event drag-and-drop and date selecting
        ? Docs: https://fullcalendar.io/docs/dragScroll
      */
      dragScroll: true,

      /*
        Max number of events within a given day
        ? Docs: https://fullcalendar.io/docs/dayMaxEvents
      */
      dayMaxEvents: 5,

      /*
        Determines if day names and week names are clickable
        ? Docs: https://fullcalendar.io/docs/navLinks
      */
      navLinks: true,

      eventClassNames({ event: calendarEvent }: any) {
        // @ts-ignore
        const colorName = calendarsColorDetail[calendarEvent._def.extendedProps.status]

        const allDay = calendarEvent._def.allDay

        return [
          `border-${colorName}`,
          `text-${colorName}`,
          `event-avatar`,
          `event-${allDay ? 'allDay' : 'timed'}`,
        ]
      },

      eventClick({ }: any) {
        handleAddEventSidebarToggle()

        // * Only grab required field otherwise it goes in infinity loop
        // ! Always grab all fields rendered by form (even if it get `undefined`) otherwise due to Vue3/Composition API you might get: "object is not extensible"
        // event.value = grabEventDataFromEventApi(clickedEvent)

        // isAddNewEventSidebarActive.value = true
      },

      customButtons: {
        sidebarToggle: {
          icon: 'bi bi-list',
          click() {
            handleLeftSidebarToggle()
          }
        }
      },

      dateClick(info: any) {
        const ev = { ...blankEvent }

        ev.start = info.date
        ev.end = info.date
        ev.allDay = true

        // @ts-ignore
        handleAddEventSidebarToggle()
      },

      /*
        Handle event drop (Also include dragged event)
        ? Docs: https://fullcalendar.io/docs/eventDrop
        ? We can use `eventDragStop` but it doesn't return updated event so we have to use `eventDrop` which returns updated event
      */
      eventDrop({ }: any) {
      },

      /*
        Handle event resize
        ? Docs: https://fullcalendar.io/docs/eventResize
      */
      eventResize({ }: any) {
      },

      eventContent({ event }: any) {
        const eventContentWrapper = document.createElement('div');

        eventContentWrapper.classList.add('event-content-wrapper');

        // Kiểm tra nếu calendar là "HOLIDAY"
        if (event.extendedProps.calendar === "Holiday") {

          const eventDescription = document.createElement('div');

          eventDescription.classList.add('event-description');

          eventDescription.innerHTML = event._def.title; // Render HTML từ description

          eventContentWrapper.appendChild(eventDescription);
        } else {
          const eventAvatar = document.createElement('img');

          eventAvatar.classList.add('event-avatar');
          eventAvatar.src = event.extendedProps.icon;
          eventAvatar.width = 50;
          eventAvatar.height = 50;

          const eventTitle = document.createElement('div');

          eventTitle.classList.add('fc-title');
          let msgShow = "";
          let textColor = "";

          switch (event._def.extendedProps.status) {
            case "P":
              msgShow = 'Pending - ' + event.title;
              textColor = "orange"; // Set color for Pending
              break;
            case "R":
              msgShow = "Rejected - " + event.title;
              textColor = "#f17876"; // Set color for Rejected
              break;
            case "C":
              msgShow = "Pending - " + event.title;
              textColor = "orange"; // Set color for Pending
              break;
            case "A":
              msgShow = event.title;
              textColor = "#55ac59"; // Set color for Approved
              break;
            default:
              msgShow = event.title;
              textColor = "black"; // Default color
              break;
          }

          eventTitle.textContent = msgShow;
          eventTitle.style.color = textColor; // Apply the color
          eventTitle.style.fontSize = "11px"; // Apply the Font size

          eventContentWrapper.appendChild(eventAvatar);

          if (window.innerWidth >= 1024) {
            eventContentWrapper.appendChild(eventTitle);
          }
        }

        const eventWrapper = document.createElement('div');

        eventWrapper.classList.add('fc-content');
        eventWrapper.appendChild(eventContentWrapper);

        return { domNodes: [eventWrapper] };
      },

      ref: calendarRef,

      eventStartEditable: eventStartEditable
    }

    // @ts-ignore
    return <FullCalendar {...calendarOptions} />
  } else {
    return null
  }
}

export default CalendarMain
