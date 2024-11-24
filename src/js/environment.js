host = 'http://localhost:8080'
host = 'http://192.168.0.46:8080'

const isChrome = /Chrome/.test(navigator.userAgent)
const browserExtension = isChrome ? 'chrome-extension' : 'moz-extension'
const extensionId = isChrome ? chrome.runtime.id : 'afadb1cf-b426-431a-a9f7-47adf0ceff91'

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
}

function redirectToLogin(message) {
  if (
    window.location.href.includes('login.html') ||
    window.location.href.includes('settings.html')
  ) {
    return
  }
  localStorage.removeItem('token')
  delete headers.Authorization
  const messageParam = !message ? '' : `?message=${message}`
  const redirectUrl = `${browserExtension}://${extensionId}/template/login.html${messageParam}`
  window.location.href = redirectUrl
}

const token = localStorage.getItem('token')
if (!token) {
  redirectToLogin()
}

function getPreferences() {
  const storedPreferences = localStorage.getItem('userPreferences')

  if (storedPreferences) {
    return Promise.resolve(JSON.parse(storedPreferences))
  } else {
    return api(userPreferences, {
      method: 'GET',
      headers: headers,
    })
      .then(res => res.json())
      .then(res => {
        localStorage.setItem('userPreferences', JSON.stringify(res))
        return res
      })
  }
}

// Endpoints
const todosEndpoint = `${host}/todos`
const completeTodosEndpoint = `${host}/todos?onlyComplete=true`
const tagsEndpoint = `${host}/todos/tags`
const importantEndpointFn = limit =>
  !limit ? `${todosEndpoint}/important` : `${todosEndpoint}/important?limit=${limit}`
const rankEndpoint = `${host}/todos/rank`
const deleteTodosEndpointFn = thisInstance => `${host}/todos?thisInstance=${thisInstance}`
const completeEndpoint = `${host}/todos/complete`
const uncompleteEndpoint = `${host}/todos/uncomplete`
const categoriesEndpoint = `${host}/todos/categories`
const transactionsEndpointFn = (start, end) =>
  `${host}/transaction?start=${start}&endInclusive=${end}`
const transactionEndpoint = `${host}/transaction`
const eventsEndpointFn = (start, end) => `${host}/event?start=${start}&endInclusive=${end}`
const eventEndpoint = `${host}/event`
const transactionToDeductEndpoint = `${host}/transaction/to-deduct`
const transactionToDeductEndpointFn = end => `${host}/transaction/to-deduct?endInclusive=${end}`
const loginEndpoint = `${host}/v1/login`
const registerEndpoint = `${host}/v1/register`
const spendCategoriesEndpoint = `${host}/spend-category`
const wellEndpoint = type => `${host}/well?rangeType=${type}`

const weightTrackingEndpoint = `${host}/tracking/weight`

const runningTaskEndpoint = `${host}/tracking/running`
const timeTrackingEndpoint = `${host}/tracking`
const stopTaskEndpoint = `${host}/tracking/stop`
const taskSummaryEndpoint = type => `${host}/tracking/summary?type=${type}`
const readingListEndpointFn = (page, size) => `${host}/reading-list?page=${page}&size=${size}`
const readingListEndpointReadFn = (id, read) => `${host}/reading-list?id=${id}&isRead=${read}`
const readingListEndpointDeleteFn = id => `${host}/reading-list?id=${id}`

const bucketEndpoint = `${host}/bucket`

const moodEndpoint = `${host}/mood?rangeType=`

const reviewEndpoint = `${host}/review`
const reviewEndpointFn = date => `${host}/review?reviewDate=${date}`
const tempFormId = '91f2994f-2446-459c-806d-f99387fd2f1c'
const formEndpoint = `${host}/review/form?formId=${tempFormId}`
const todoReviewEndpoint = (type, category) =>
  `${host}/todos/review?type=${type}${categoryParam(category)}`

const podcastSubscribeEndpoint = `${host}/podcast/subscribe`
const podcastTrack = `${host}/podcast/track`
const podcastListenLater = `${host}/podcast/listenLater`
const podcastListenLaterFn = (page, size) => `${host}/podcast/listenLater?page=${page}&size=${size}`
const podcastNotInterested = `${host}/podcast/notInterested`
const podcastNewEpisodesEndpointFn = (page, size, sort) =>
  `${host}/podcast/new?page=${page}&size=${size}&sort=${sort}`
const podcastEpisodesEndpointFn = (podcastId, page, size) =>
  `${host}/podcast/episodes?podcastId=${podcastId}&page=${page}&size=${size}`
const podcastAllSubsribedEpisodesEndpointFn = (page, size, sort) =>
  `${host}/podcast/all?page=${page}&size=${size}&sort=${sort}`
const podcastAllSubsribedEndpointFn = (page, size) =>
  `${host}/podcast/subscribed?page=${page}&size=${size}&sort=createdAtUtc,desc`

const versionCatalogueEndpoint = `${host}/version-catalogue`

const manualTimeTrackingEndpoint = `${host}/tracking/manual`

// Nutrition Endpoints
const mealEndpoint = `${host}/nutrition/food/meal`
const allMealsEndpoint = `${host}/nutrition/food/meal/all`
const mealPlanEndpoint = `${host}/nutrition/food/meal/plan`
const foodItemEndpoint = `${host}/nutrition/food/item`
const foodItemCsvEndpoint = `${host}/nutrition/food/item/csv`

// Files Endpoints
const filesEndpointFn = (category, page, size) =>
  `${host}/files?category=${category}&page=${page}&size=${size}`

function categoryParam(category) {
  return !!category ? `&category=${category}` : ''
}

const userPreferences = `${host}/preferences`

function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]')
  const regex = new RegExp('[\\?&]' + name + '=([^&#]*)')
  const results = regex.exec(location.search)
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '))
}

function parseWWWAuthenticateHeader(header) {
  const parts = header.split(',').map(part => part.trim())
  for (const part of parts) {
    if (part.startsWith('error=')) {
      return part.split('=')[1].replace(/"/g, '')
    }
  }
  return null
}

function api(endpoint, obj, rethrow) {
  if (rethrow) {
    return fetch(endpoint, obj).then(val => withFeedback(val, obj))
  }
  return fetch(endpoint, obj)
    .then(val => withFeedback(val, obj))
    .catch(err => withFeedback({ ok: false }, obj))
}

function withFeedback(response, obj) {
  try {
    const feedback = document.getElementById('feedback')
    if (response.status === 401) {
      const wwwAuthenticateHeader = response.headers.get('WWW-Authenticate')
      if (wwwAuthenticateHeader) {
        const message = parseWWWAuthenticateHeader(wwwAuthenticateHeader)
        if (
          message === 'Token has expired' ||
          wwwAuthenticateHeader.includes('Token has expired')
        ) {
          redirectToLogin('Your session has expired, please reauthenicate 🥺')
        }
      }
    }

    if (!feedback || obj.method === 'GET' || obj.noFeedback === true) {
      return response
    }

    if (response.ok) {
      if (obj.noSuccessFeedback) {
        return response
      }
      feedback.classList.add('success')
      feedback.classList.remove('failure')
      feedback.classList.remove('hidden')
      feedback.textContent = obj.successMessage || '✊ Nice one, submitted successfully'
    } else if (response.status >= 400 && response.status < 500) {
      response.json().then(body => {
        const serverMessage = !!body[0]?.message
          ? `🌝 Failed to submit because: ${body[0].message}`
          : null
        const message =
          serverMessage || obj.failureMessage || '🌝 Failed to submit because of an invalid request'
        feedback.classList.add('failure')
        feedback.classList.remove('success')
        feedback.classList.remove('hidden')
        feedback.textContent = message
      })
    } else {
      feedback.classList.add('failure')
      feedback.classList.remove('success')
      feedback.classList.remove('hidden')
      feedback.textContent = obj.failureMessage || '🙈 Failed to submit. Please try again later'
    }
  } catch (error) {
    console.error('Error submitting:', error)
    // Rethrow the error
    throw error
  }

  // Remove the feedback message after 5 seconds
  setTimeout(() => {
    feedback.classList.add('hidden')
    feedback.textContent = ''
    feedback.classList.remove('success', 'failure', 'warning', 'informational')
  }, 5000)

  return response
}

function withFeedbackMessage(type, message) {
  const feedback = document.getElementById('feedback')

  if (type === 'success') {
    feedback.classList.add('success')
    feedback.classList.remove('failure')
    feedback.classList.remove('hidden')
    feedback.textContent = message
  }
  if (type === 'error') {
    feedback.classList.add('failure')
    feedback.classList.remove('success')
    feedback.classList.remove('hidden')
    feedback.textContent = message
  }
  if (type === 'warning') {
    feedback.classList.add('warning')
    feedback.classList.remove('success')
    feedback.classList.remove('hidden')
    feedback.textContent = message
  }
  if (type === 'informational') {
    feedback.classList.remove('success', 'failure', 'warning', 'informational')
    feedback.classList.add('informational')
    feedback.textContent = message
  }
  //
  // Remove the feedback message after 5 seconds
  setTimeout(() => {
    feedback.classList.add('hidden')
    feedback.textContent = ''
    feedback.classList.remove('success', 'failure', 'warning', 'informational')
  }, 5000)
}

function getFavouriteCategories() {}

const defaultTheme = new Map()
defaultTheme.set('--background-color', '#272725')
defaultTheme.set('--text-color', '#8d8271')
defaultTheme.set('--link-color', '#8d8271')
defaultTheme.set('--link-hover-color', '#f0f0f0')
defaultTheme.set('--highlighted-todo-color', '#f0f0f0')
defaultTheme.set('--bright-red-color', '#f40303')
defaultTheme.set('--bright-orange-color', '#f47903')
defaultTheme.set('--bright-green-color', '#03f403')
defaultTheme.set('--blue-color', '#3498db')
defaultTheme.set('--font-family', "'Helvetica Neue', sans-serif")
defaultTheme.set('--main-color', '#e7b91b')
defaultTheme.set('--darker-main-color', '#d1a116')
defaultTheme.set('--lighter-main-color', '#f0c674')
defaultTheme.set('--dark-grey', '#2c2c2c')
defaultTheme.set('--light-medium-grey', '#555555')
defaultTheme.set('--light-grey', '#868680')
defaultTheme.set('--very-dark', '#272725')
defaultTheme.set('--medium-grey', '#303030')

const darkerTheme = new Map()
darkerTheme.set('--background-color', '#131313')

const solarisedTheme = new Map()

solarisedTheme.set('--background-color', '#002b36')
solarisedTheme.set('--text-color', '#839496')
solarisedTheme.set('--link-color', '#839496')
solarisedTheme.set('--link-hover-color', '#839496')
solarisedTheme.set('--highlighted-todo-color', '#839496')
solarisedTheme.set('--bright-red-color', '#dc322f')
solarisedTheme.set('--bright-orange-color', '#d33687')
solarisedTheme.set('--bright-green-color', '#6c7174')
solarisedTheme.set('--blue-color', '#268bd2')
solarisedTheme.set('--font-family', "'Helvetica Neue', sans-serif")
solarisedTheme.set('--main-color', '#b58900')
solarisedTheme.set('--darker-main-color', '#a87800')
solarisedTheme.set('--lighter-main-color', '#e6c75d')
solarisedTheme.set('--dark-grey', '#002b36')
solarisedTheme.set('--light-medium-grey', '#586e75')
solarisedTheme.set('--light-grey', '#839496')
solarisedTheme.set('--very-dark', '#002b36')
solarisedTheme.set('--medium-grey', '#38556d')

// TODO
const cleanTheme = new Map()
// cleanTheme.set('--background-color', '#212024')
cleanTheme.set('--background-color', '#212023')
cleanTheme.set('--text-color', '#bebebf')
cleanTheme.set('--link-color', '#aaaaaa')
cleanTheme.set('--link-hover-color', '#4e4e4f')
cleanTheme.set('--highlighted-todo-color', '#f0f0f0')
cleanTheme.set('--bright-red-color', '#f40303')
cleanTheme.set('--bright-orange-color', '#f47903')
cleanTheme.set('--bright-green-color', '#03f403')
cleanTheme.set('--blue-color', '#3498db')
cleanTheme.set('--font-family', "'Helvetica Neue', sans-serif")
cleanTheme.set('--main-color', '#e7b91b')
cleanTheme.set('--darker-main-color', '#d1a116')
cleanTheme.set('--lighter-main-color', '#f0c674')
cleanTheme.set('--dark-grey', '#2c2c2c')
cleanTheme.set('--light-medium-grey', '#555555')
cleanTheme.set('--light-grey', '#868680')
cleanTheme.set('--very-dark', '#272725')
cleanTheme.set('--medium-grey', '#303030')

const themes = new Map()

themes.set('defaultTheme', defaultTheme)
themes.set('darkerTheme', darkerTheme)
themes.set('solarisedTheme', solarisedTheme)
themes.set('cleanTheme', cleanTheme)

const theme = themes.get(localStorage.getItem('theme'))

if (!!theme) {
  setTheme(theme)
}

function setTheme(theme) {
  const root = document.documentElement
  theme.forEach((value, key) => root.style.setProperty(key, value))
}
