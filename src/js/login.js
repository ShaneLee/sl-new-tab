window.onload = function () {
  const form = document.getElementById('loginForm')
  const loginButton = document.getElementById('loginButton')
  const registerButton = document.getElementById('registerButton')

  form.addEventListener('submit', function (e) {
    e.preventDefault()

    if (e.submitter === loginButton) {
      login()
    } else if (e.submitter === registerButton) {
      register()
    }
  })
}

function register() {
  const name = document.getElementById('name').value
  const email = document.getElementById('email').value
  chrome.storage.local.set({ name: name }, function () {})

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  chrome.storage.local.set({ timezone: timezone }, function () {})

  const prefs = { name: name, timezone: timezone }
  const redirectUrl = `${browserExtension}://${extensionId}/template/settings.html`

  const register = { redirectUrl: redirectUrl, email: email }

  api(registerEndpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(register),
    successMessage:
      '✨ Great Success! Registered Successfully, please check your e-mail for the login link!',
  })
    .then(clearForm)
    .then(res => (!!res ? submitPreferences(prefs) : res))

  function submitPreferences(prefs) {
    return api(userPreferences, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(prefs),
    }).then(response => (response?.status === 201 ? response : null))
  }
}

function login() {
  const email = document.getElementById('email').value
  const redirectUrl = `${browserExtension}://${extensionId}/template/settings.html`

  const login = { redirectUrl: redirectUrl, email: email }

  api(loginEndpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(login),
    successMessage: '✨ Great Success! Please check your e-mail for the login link!',
  }).then(clearForm)
}

function clearForm(response) {
  if (!!response && response.status >= 200 && response.status <= 299) {
    document.getElementById('email').value = null
    document.getElementById('name').value = null
    return response
  }

  return null
}
