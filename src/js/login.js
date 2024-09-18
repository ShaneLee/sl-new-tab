window.onload = function () {
  document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault()
    loginRegister()
  })
}

function loginRegister() {
  const email = document.getElementById('email').value
  const name = document.getElementById('name').value
  chrome.storage.local.set({ name: name }, function () {})

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  chrome.storage.local.set({ timezone: timezone }, function () {})

  const login = { name: name, email: email }

  api(loginEndpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(login),
  })
    .then(handleLoginOrRegister)
    .then(clearForm)

  const prefs = { name: name, timezone: timezone }

  api(userPreferences, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(prefs),
  }).then(response => (response?.status === 201 ? response : null))
}

function clearForm(response) {
  if (!!response && response.status >= 200 && response.status <= 299) {
    document.getElementById('email').value = null
    document.getElementById('name').value = null
  }
}

function handleLoginOrRegister(response) {
  if (response?.status === 201) {
    // Registered
  }
  if (response?.status === 200) {
    // Login email sent
  }
}
