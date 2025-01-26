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
    div.innerHTML = `<strong>${event.name}</strong> (${event.date})<br>Time: ${event.startTime} - ${
      event.endTime
    }<br>Notes: ${event.notes || 'None'}`
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

window.addEventListener('load', () => {
  setDefaultDate()
  addEventFormListener()
  const eventDates = getEventStartAndEndDates()
  getEvents(eventDates['start'], eventDates['end'])
})
