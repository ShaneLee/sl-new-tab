let contextMenu
let selected

function getWeightTrackings() {
  api(weightTrackingEndpoint, {
    method: 'GET',
    headers: headers,
  })
    .then(response => (response.status === 200 ? response?.json() : null))
    .then(val => {
      if (!!val) {
        populateTrackingTable(val)
        updateChart(val)
      }
    })
    .catch(err => {})
}

function populateTrackingTable(vals) {
  const tbody = document.getElementById('weight-tracker-table')

  populateTable(tbody, vals)
}

function populateTable(tbody, vals) {
  tbody.innerHTML = ''

  vals.forEach(val => {
    addToTable(tbody, val)
  })
}

function addToTable(tbody, val) {
  const row = document.createElement('tr')

  const dateCell = document.createElement('td')
  dateCell.textContent = val.date
  row.appendChild(dateCell)

  const weightCell = document.createElement('td')
  weightCell.textContent = val.weightKg
  row.appendChild(weightCell)

  const bodyFatPercentageCell = document.createElement('td')
  bodyFatPercentageCell.textContent = val.bodyFatPercentage
  row.appendChild(bodyFatPercentageCell)

  const bodyWaterPercentageCell = document.createElement('td')
  bodyWaterPercentageCell.textContent = val.bodyWaterPercentage
  row.appendChild(bodyWaterPercentageCell)

  const muscleMassKgCell = document.createElement('td')
  muscleMassKgCell.textContent = val.muscleMassKg
  row.appendChild(muscleMassKgCell)

  const visceralFatCell = document.createElement('td')
  visceralFatCell.textContent = val.visceralFat
  row.appendChild(visceralFatCell)

  const recommendedCalorieIntakeCell = document.createElement('td')
  recommendedCalorieIntakeCell.textContent = val.recommendedCalorieIntake
  row.appendChild(recommendedCalorieIntakeCell)

  tbody.appendChild(row)
}

function updateChart(data) {
  const labels = data.map(entry => entry.date)

  const weightData = data.map(entry => entry.weightKg)
  const bodyFatData = data.map(entry => entry.bodyFatPercentage)
  const bodyWaterData = data.map(entry => entry.bodyWaterPercentage)
  const muscleMassData = data.map(entry => entry.muscleMassKg)
  const visceralFatData = data.map(entry => entry.visceralFat)
  const calorieIntakeData = data.map(entry => entry.recommendedCalorieIntake)

  const ctx = document.getElementById('weightTrackerChart').getContext('2d')

  const weightTrackerChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Weight (KG)',
          data: weightData,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: false,
          yAxisID: 'y',
        },
        {
          label: 'Body Fat (%)',
          data: bodyFatData,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: false,
          yAxisID: 'y1',
        },
        {
          label: 'Body Water (%)',
          data: bodyWaterData,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: false,
          yAxisID: 'y1',
        },
        {
          label: 'Muscle Mass (KG)',
          data: muscleMassData,
          borderColor: 'rgba(255, 206, 86, 1)',
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          fill: false,
          yAxisID: 'y1',
        },
        {
          label: 'Visceral Fat',
          data: visceralFatData,
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          fill: false,
          yAxisID: 'y1',
        },
        {
          label: 'Recommended Calorie Intake',
          data: calorieIntakeData,
          borderColor: 'rgba(255, 159, 64, 1)',
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          fill: false,
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    },
  })
}

function addContextMenuListener() {
  contextMenu = document.getElementById('weightContextMenu')
  const deleteAction = document.getElementById('deleteAction')

  deleteAction.addEventListener('click', function () {
    deleteval(selected)
    selected = null
    hideContextMenu()
  })

  // Event listener to hide context menu on window click
  window.addEventListener('click', function () {
    hideContextMenu()
  })
}

function showContextMenu(event, weight) {
  // Check if the right-click occurred outside of an 'a' tag
  if (event.target.tagName.toLowerCase() === 'a') {
    return
  }
  event.preventDefault()
  selected = weight
  const contextMenuId = 'weightContextMenu'
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

window.addEventListener('load', getWeightTrackings)
window.onload = function () {
  addContextMenuListener()
}
