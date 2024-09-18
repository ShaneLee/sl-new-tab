function createEvent(eventObj) {
  return api(eventEndpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(eventObj),
  }).then(response =>
    response.status === 200 || response.status === 201 ? response?.json() : null,
  )
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

window.addEventListener('load', addEventFormListener)
