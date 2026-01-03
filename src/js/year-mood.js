function getQueryParam(paramName) {
  const params = new URLSearchParams(window.location.search)
  return params.get(paramName)
}

function loadPage() {
  const year = getYearFromQuery()
  initYearNavigator(year)

  const { startDate, endDate } = buildYearRange(year)

  renderMoodForDateRange(startDate, endDate)
  renderWellForDateRange(startDate, endDate)
}

function initYearNavigator(year) {
  const currentYearEl = document.getElementById('current-year')
  const prevBtn = document.getElementById('prev-year')
  const nextBtn = document.getElementById('next-year')

  const thisYear = new Date().getFullYear()

  currentYearEl.textContent = year

  // Disable going into the future
  nextBtn.disabled = year >= thisYear

  prevBtn.onclick = () => navigateToYear(year - 1)
  nextBtn.onclick = () => {
    if (year < thisYear) {
      navigateToYear(year + 1)
    }
  }
}

function renderMoodForDateRange(start, end) {
  fetch(moodEndpointDateRangeFn(start, end), { headers })
    .then(res => res.json())
    .then(renderMoodTable)
}

function renderWellForDateRange(start, end) {
  fetch(wellEndpointDateRangeFn(start, end), { headers })
    .then(res => (res.status === 200 ? res.json() : []))
    .then(renderWellList)
}

function navigateToYear(year) {
  const { startDate, endDate } = buildYearRange(year)

  const params = new URLSearchParams({
    startDate,
    endDate,
    name: `Year ${year}`,
  })

  window.location.search = params.toString()
}

function getCompletedReviewForWeek(dateParam) {}

function renderReponses(responses, containerElement) {
  for (let key in responses) {
    if (key.includes('-')) {
      const h2Element = document.createElement('h2')
      h2Element.textContent = formatSection(key)

      const pElement = document.createElement('p')
      pElement.textContent = responses[key]

      containerElement.appendChild(h2Element)
      containerElement.appendChild(pElement)
    }
  }
}

function createGrid(ratings, year) {
  const gridContainer = document.getElementById('mood-grid-container')
  gridContainer.innerHTML = ''

  const dailyRatings = {}

  // Aggregate ratings and collect notes for each day
  ratings.forEach(({ createdAt, rating, notes }) => {
    const date = new Date(createdAt).toISOString().split('T')[0] // YYYY-MM-DD
    if (!dailyRatings[date]) {
      dailyRatings[date] = { total: 0, count: 0, notes: [] }
    }
    dailyRatings[date].total += rating
    dailyRatings[date].count += 1
    if (!!notes) {
      dailyRatings[date].notes.push(notes.trim())
    }
  })

  Object.keys(dailyRatings).forEach(date => {
    dailyRatings[date].average = dailyRatings[date].total / dailyRatings[date].count
  })

  function getColor(rating) {
    if (!rating) return 'transparent'
    const red = Math.round((5 - rating) * 51)
    const green = Math.round((rating - 1) * 51)
    return `rgb(${red}, ${green}, 0)`
  }

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
    daysInMonth[1] = 29 // Leap year adjustment
  }

  months.forEach((month, monthIndex) => {
    const monthContainer = document.createElement('div')
    monthContainer.classList.add('month-container')

    const heading = document.createElement('h3')
    heading.textContent = month
    monthContainer.appendChild(heading)

    const daysGrid = document.createElement('div')
    daysGrid.classList.add('days-grid')

    for (let day = 1; day <= daysInMonth[monthIndex]; day++) {
      const date = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(
        2,
        '0',
      )}`
      const dataForDay = dailyRatings[date]
      const averageRating = dataForDay ? dataForDay.average : null
      const notes = dataForDay ? dataForDay.notes : []

      const square = document.createElement('div')
      square.classList.add('square')
      square.style.backgroundColor = getColor(averageRating)

      if (averageRating) {
        square.title = `Date: ${date}\nRating: ${averageRating.toFixed(1)}\nNotes:\n- ${notes.join(
          '\n- ',
        )}`
      } else {
        square.title = `Date: ${date}\nNo rating yet.`
      }

      daysGrid.appendChild(square)
    }

    monthContainer.appendChild(daysGrid)
    gridContainer.appendChild(monthContainer)
  })
}

function getReviewForm(typeParam) {
  getFormConfig()
    .then(renderForm)
    .then(val => renderMoodForType(typeParam))
    .then(val => renderWellForType(typeParam))
}

function renderMoodForType(type) {
  getMoodRatingsForType(type).then(renderMoodTable)
}

function renderMoodTable(ratings) {
  if (!ratings) return

  const year = getYearFromQuery()

  // Clear previous renders
  document.getElementById('ratings-table-container').innerHTML = ''
  document.getElementById('mood-grid-container').innerHTML = ''

  createGrid(ratings, year)

  const table = document.createElement('table')
  table.className = 'time-tracking-summary'

  const headerRow = table.insertRow(0)
  ;['Created At', 'Rating', 'Notes'].forEach(text => {
    const th = document.createElement('th')
    th.textContent = text
    headerRow.appendChild(th)
  })

  ratings.forEach((ratingData, index) => {
    const row = table.insertRow(index + 1)

    const createdAtDate = new Date(ratingData.createdAt)
    const daysOfWeek = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]

    const createdAtText = `${daysOfWeek[createdAtDate.getDay()]} ${createdAtDate.getFullYear()}-${String(createdAtDate.getMonth() + 1).padStart(2, '0')}-${String(
      createdAtDate.getDate(),
    ).padStart(2, '0')}`

    row.insertCell(0).textContent = createdAtText
    row.insertCell(1).textContent = ratingData.rating
    row.insertCell(2).textContent = ratingData.notes || ''
  })

  document.getElementById('ratings-table-container').appendChild(table)
}

function getWellForType(type) {
  return fetch(wellEndpoint(type), {
    method: 'GET',
    headers: headers,
  })
    .then(response => (response.status === 200 ? response?.json() : null))
    .then(val => {
      if (!!val) {
        return val
      }
    })
}

function renderWellForType(type) {
  getWellForType(type).then(renderWellList)
}

function renderWellList(things) {
  const container = document.getElementById('well-list')

  container.innerHTML = ''

  things
    .map(val => val.things)
    .forEach(thing => {
      const thingItem = document.createElement('li')
      thingItem.textContent = thing
      container.appendChild(thingItem)
    })
}

function formatSection(str) {
  return (
    str
      .replaceAll('-', ' ')
      // Insert a space before all caps
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Uppercase the first character of each word
      .replace(/\b[a-z]/g, char => char.toUpperCase())
  )
}

function createRatingElement(name) {
  const ratingDiv = document.createElement('div')
  ratingDiv.className = 'rating-group'

  for (let i = 1; i <= 5; i++) {
    const radio = document.createElement('input')
    radio.type = 'radio'
    radio.value = i.toString()
    radio.name = name
    radio.id = `rating-${name}-${i}`

    const label = document.createElement('label')
    label.setAttribute('for', `rating-${name}-${i}`)
    label.innerText = i.toString()

    ratingDiv.appendChild(radio)
    ratingDiv.appendChild(label)
  }

  return ratingDiv
}

function getYearFromQuery() {
  const startDate = getQueryParam('startDate')
  if (startDate) {
    return parseInt(startDate.split('-')[0], 10)
  }
  return new Date().getFullYear()
}

function buildYearRange(year) {
  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  }
}

window.addEventListener('load', loadPage)
