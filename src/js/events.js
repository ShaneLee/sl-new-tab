let contextMenu
let selectedEvent

function deleteEvent(event) {
  return api(deleteEventEndpointFn(event.id), {
    method: 'DELETE',
    headers: headers,
  })
}

function createEvent(eventObj) {
  return api(eventEndpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(eventObj),
  }).then(response =>
    response.status === 200 || response.status === 201 ? response?.json() : null,
  )
}

function setDefaultDate() {
  const dateInput = document.getElementById('date')
  const today = new Date()
  const currentYear = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0') // Month is 0-based
  const day = String(today.getDate()).padStart(2, '0')

  dateInput.value = `${currentYear}-${month}-${day}`
}

function addContextMenuListener() {
  contextMenu = document.getElementById('eventContextMenu')
  const deleteAction = document.getElementById('deleteAction')

  deleteAction.addEventListener('click', function () {
    deleteEvent(selectedEvent)
    selectedEvent = null
    hideContextMenu()
  })

  // Event listener to hide context menu on window click
  window.addEventListener('click', function () {
    hideContextMenu()
  })
}

function addEventFormListener() {
  document.getElementById('eventForm').addEventListener('submit', function (eventObj) {
    event.preventDefault()

    const formData = new FormData(this)
    const jsonObject = {}
    formData.forEach(function (value, key) {
      jsonObject[key] = value
    })

    createEvent(jsonObject)
  })
}

function getEventStartAndEndDates() {
  const today = new Date()
  const futureDate = new Date()
  futureDate.setDate(today.getDate() + 365)

  const todayFormatted = formatDate(today)
  const futureDateFormatted = formatDate(futureDate)

  return { start: todayFormatted, end: futureDateFormatted }
}

function renderEvents(events, view, containerId) {
  const container = document.getElementById(containerId)
  container.innerHTML = ''

  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.date)
    const now = new Date()

    if (view === 'year') {
      return eventDate.getFullYear() === now.getFullYear()
    } else if (view === 'month') {
      return eventDate.getMonth() === now.getMonth()
    } else if (view === 'week') {
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      return eventDate >= weekStart && eventDate <= weekEnd
    }
  })

  filteredEvents.forEach(event => {
    const div = document.createElement('div')
    div.className = 'event'

    const startDate = event.date
    const endDate = event.toDate ? `–${event.toDate}` : ''
    const dateDisplay = `${startDate}${endDate}`

    let inner

    if (event.toDate) {
      // Multi-day event: no time fields
      inner = `
      <strong>${event.name}</strong> (${dateDisplay})<br>
      Notes: ${event.notes || 'None'}
    `
    } else {
      // Single-day event: include times
      const startTime = event.startTime?.slice(0, 5) || ''
      const endTime = event.endTime?.slice(0, 5) || ''

      inner = `
      <strong>${event.name}</strong> (${dateDisplay})<br>
      Time: ${startTime} - ${endTime}<br>
      Notes: ${event.notes || 'None'}
    `
    }

    div.innerHTML = inner.trim()
    div.addEventListener('contextmenu', function (e) {
      if (!!contextMenu) {
        hideContextMenu()
      }
      showContextMenu(e, event)
    })

    container.appendChild(div)
  })
}

function showView(view) {
  document
    .querySelectorAll('.year-view, .month-view, .week-view')
    .forEach(el => el.classList.remove('visible'))
  document.getElementById(`${view}-view`).classList.add('visible')

  if (view === 'year') {
    renderEvents('year', 'year-events')
  } else if (view === 'month') {
    renderEvents('month', 'month-events')
  } else if (view === 'week') {
    renderEvents('week', 'week-events')
  }
}

function getEvents(start, end) {
  api(eventsEndpointFn(start, end), {
    method: 'GET',
    headers: headers,
  })
    .then(response => (response.status === 200 ? response?.json() : null))
    .then(val => {
      if (!!val) {
        renderEvents(val, 'year', 'year-events')
      }
    })
    .catch(err => {})
}

function showContextMenu(event, eventObj) {
  // Check if the right-click occurred outside of an 'a' tag
  if (event.target.tagName.toLowerCase() === 'a') {
    return
  }
  event.preventDefault()
  selectedEvent = eventObj
  const contextMenuId = 'eventContextMenu'
  contextMenu = document.getElementById(contextMenuId)

  // Ensure the context menu is visible before retrieving dimensions
  contextMenu.style.display = 'block'

  const contextMenuWidth = contextMenu.offsetWidth
  const contextMenuHeight = contextMenu.offsetHeight
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let left = event.clientX
  let top = event.clientY

  // Adjust left position if the context menu goes off the right edge
  if (left + contextMenuWidth > viewportWidth) {
    left = viewportWidth - contextMenuWidth
  }

  // Adjust top position if the context menu goes off the bottom edge
  if (top + contextMenuHeight > viewportHeight) {
    top = viewportHeight - contextMenuHeight
  }

  // Ensure the top position is never negative
  top = Math.max(top, 0)

  contextMenu.style.left = `${left}px`
  contextMenu.style.top = `${top}px`

  event.stopPropagation()
}

function hideContextMenu() {
  if (!!contextMenu) {
    contextMenu.style.display = 'none'
    contextMenu = null
  }
}

window.addEventListener('load', () => {
  setDefaultDate()
  addEventFormListener()
  const eventDates = getEventStartAndEndDates()
  getEvents(eventDates['start'], eventDates['end'])
  addContextMenuListener()
})
