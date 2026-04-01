function getQueryParam(paramName) {
  const params = new URLSearchParams(window.location.search)
  return params.get(paramName)
}

function loadPage() {
  const year = getYearFromQuery()
  initYearNavigator(year)

  const { startDate, endDate } = buildYearRange(year)

  renderDiaryForDateRange(startDate, endDate)
}

function initYearNavigator(year) {
  const currentYearEl = document.getElementById('current-year')
  const prevBtn = document.getElementById('prev-year')
  const nextBtn = document.getElementById('next-year')

  const thisYear = new Date().getFullYear()

  currentYearEl.textContent = year

  nextBtn.disabled = year >= thisYear

  prevBtn.onclick = () => navigateToYear(year - 1)
  nextBtn.onclick = () => {
    if (year < thisYear) {
      navigateToYear(year + 1)
    }
  }
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

function renderDiaryForDateRange(start, end) {
  fetch(diaryEndpointDateRangeFn(start, end), { method: 'GET', headers })
    .then(res => res.json())
    .then(entries => {
      const year = getYearFromQuery()
      renderDiaryGrid(entries, year)
      renderDiaryTable(entries)
    })
}

function renderDiaryGrid(entries, year) {
  const gridContainer = document.getElementById('diary-grid-container')
  gridContainer.innerHTML = ''

  const dailyEntries = {}

  entries.forEach(({ createdAt, entry }) => {
    const date = new Date(createdAt).toISOString().split('T')[0]
    if (!dailyEntries[date]) {
      dailyEntries[date] = []
    }
    if (entry) {
      dailyEntries[date].push(entry.trim())
    }
  })

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
    daysInMonth[1] = 29
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
      const date = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const entriesForDay = dailyEntries[date]
      const hasEntry = entriesForDay && entriesForDay.length > 0

      const square = document.createElement('div')
      square.classList.add('square')
      square.style.backgroundColor = hasEntry ? 'var(--main-color)' : 'transparent'

      if (hasEntry) {
        const preview = entriesForDay.map(e => e.substring(0, 100)).join('\n---\n')
        square.title = `${date}\n${preview}`
      } else {
        square.title = `${date}\nNo entry`
      }

      daysGrid.appendChild(square)
    }

    monthContainer.appendChild(daysGrid)
    gridContainer.appendChild(monthContainer)
  })
}

function renderDiaryTable(entries) {
  if (!entries) return

  const container = document.getElementById('diary-table-container')
  container.innerHTML = ''

  const table = document.createElement('table')
  table.className = 'time-tracking-summary'

  const headerRow = table.insertRow(0)
  ;['Created At', 'Entry'].forEach(text => {
    const th = document.createElement('th')
    th.textContent = text
    headerRow.appendChild(th)
  })

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  entries.forEach((data, index) => {
    const row = table.insertRow(index + 1)

    const createdAtDate = new Date(data.createdAt)
    const createdAtText = `${daysOfWeek[createdAtDate.getDay()]} ${createdAtDate.getFullYear()}-${String(createdAtDate.getMonth() + 1).padStart(2, '0')}-${String(createdAtDate.getDate()).padStart(2, '0')}`

    row.insertCell(0).textContent = createdAtText

    const entryCell = row.insertCell(1)
    entryCell.textContent = data.entry
    entryCell.style.width = '70%'
  })

  container.appendChild(table)
}

window.addEventListener('load', loadPage)
