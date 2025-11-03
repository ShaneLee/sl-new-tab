window.onload = function () {
  const message = getUrlParameter('message')
  if (message) {
    withFeedbackMessage('warning', message)
  }

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
    successMessage: '✨ Registered successfully! Please check your e-mail for the login code.',
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

  api(loginV2Endpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(login),
    successMessage: '✨ Please check your e-mail for your 6-digit login code!',
  }).then(response => {
    if (response?.status >= 200 && response?.status <= 299) {
      showCodeEntry(email)
    }
  })
}

function showCodeEntry(email) {
  const section = document.querySelector('section')
  section.innerHTML = `
    <form id="codeForm" class="default-form otp-form">
      <p>Enter the 6-digit code sent to <strong>${email}</strong>:</p>
      <div class="otp-inputs">
        ${Array.from({ length: 6 }, (_, i) => `<input type="text" inputmode="numeric" maxlength="1" class="otp-box" id="digit${i}" required />`).join('')}
      </div>
      <button id="verifyButton" type="submit">Verify Code</button>
    </form>
  `

  const inputs = document.querySelectorAll('.otp-box')
  inputs[0].focus()

  // Auto-advance between inputs
  inputs.forEach((input, idx) => {
    input.addEventListener('input', e => {
      const val = e.target.value
      if (/\\D/.test(val)) e.target.value = '' // only digits
      if (val && idx < inputs.length - 1) inputs[idx + 1].focus()
    })
    input.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !input.value && idx > 0) {
        inputs[idx - 1].focus()
      }
    })
  })

  const codeForm = document.getElementById('codeForm')
  codeForm.addEventListener('submit', function (e) {
    e.preventDefault()
    const code = Array.from(inputs)
      .map(i => i.value)
      .join('')
    verifyCode(email, code)
  })
}

function verifyCode(email, code) {
  api(loginV2Endpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ email: email, code: code }),
  }).then(async res => {
    if (res?.status >= 200 && res?.status <= 299) {
      const data = await res.json()
      const token = data.token
      await chrome.storage.local.set({ authToken: token })
      withFeedbackMessage('success', '✅ Login successful!')
      setTimeout(() => {
        window.location.href = `${browserExtension}://${extensionId}/template/settings.html`
      }, 1000)
    } else {
      withFeedbackMessage('error', 'Invalid or expired code. Please try again.')
    }
  })
}

function clearForm(response) {
  if (!!response && response.status >= 200 && response.status <= 299) {
    document.getElementById('email').value = null
    document.getElementById('name').value = null
    return response
  }

  return null
}
