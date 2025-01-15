function getQueryParam(paramName) {
  const params = new URLSearchParams(window.location.search)
  return params.get(paramName)
}

function loadPage() {
  const typeParam = getQueryParam('type') || 'YEAR'

  renderMoodForType(typeParam)
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

function createGrid(ratings) {
  const gridContainer = document.getElementById('mood-grid-container')
  gridContainer.innerHTML = ''

  const dailyRatings = {}

  ratings.forEach(({ createdAt, rating }) => {
    const date = new Date(createdAt).toISOString().split('T')[0]
    if (!dailyRatings[date]) {
      dailyRatings[date] = { total: 0, count: 0 }
    }
    dailyRatings[date].total += rating
    dailyRatings[date].count += 1
  })

  Object.keys(dailyRatings).forEach(date => {
    dailyRatings[date] = dailyRatings[date].total / dailyRatings[date].count
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
  const year = new Date().getFullYear()
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
      const averageRating = dailyRatings[date]

      const square = document.createElement('div')
      square.classList.add('square')
      square.style.backgroundColor = getColor(averageRating)

      if (averageRating) {
        square.title = `Date: ${date}\nRating: ${averageRating.toFixed(1)}`
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
  createGrid(ratings)
  const table = document.createElement('table')
  table.className = 'time-tracking-summary'

  const headerRow = table.insertRow(0)

  const headers = ['Created At', 'Rating', 'Notes']

  headers.forEach((headerText, index) => {
    const th = document.createElement('th')
    th.textContent = headerText
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
    const dayOfWeekText = daysOfWeek[createdAtDate.getDay()]
    const createdAtText = `${dayOfWeekText} ${createdAtDate.getFullYear()}-${(
      createdAtDate.getMonth() + 1
    )
      .toString()
      .padStart(2, '0')}-${createdAtDate.getDate().toString().padStart(2, '0')}`

    const createdAtCell = row.insertCell(0)
    createdAtCell.textContent = createdAtText

    const ratingCell = row.insertCell(1)
    ratingCell.textContent = ratingData.rating

    const notesCell = row.insertCell(2)
    notesCell.textContent = ratingData.notes
    notesCell.style.width = '50%'
  })

  const container = document.getElementById('ratings-table-container')
  container.appendChild(table)
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

window.addEventListener('load', loadPage)
