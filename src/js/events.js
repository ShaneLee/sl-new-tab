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

window.addEventListener('load', () => {
  setDefaultDate()
  addEventFormListener()
})
