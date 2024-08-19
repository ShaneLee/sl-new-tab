host='http://localhost:8080'
host='http://192.168.0.46:8080'
const tempUserId = 'bd11dcc2-77f6-430f-8e87-5839d31ab0e3'

const isChrome = /Chrome/.test(navigator.userAgent);
const browserExtension = isChrome ? "chrome-extension" : "moz-extension";
const extensionId = isChrome ? chrome.runtime.id : '32fbc78b-8a30-4de8-93b2-2080291501eb'

const headers = {
  'Content-Type': 'application/json',
  'tempUserId': tempUserId
}

// Endpoints
const todosEndpoint = `${host}/todos`
const importantEndpoint = `${todosEndpoint}/important`
const rankEndpoint = `${host}/todos/rank`
const deleteTodosEndpointFn = (thisInstance) => `${host}/todos?thisInstance=${thisInstance}`
const completeEndpoint = `${host}/todos/complete`
const uncompleteEndpoint = `${host}/todos/uncomplete`
const categoriesEndpoint = `${host}/todos/categories`
const transactionsEndpointFn = (start, end) => `${host}/transaction?start=${start}&endInclusive=${end}`
const transactionEndpoint = `${host}/transaction`
const eventsEndpointFn = (start, end) => `${host}/event?start=${start}&endInclusive=${end}`
const eventEndpoint = `${host}/event`
const transactionToDeductEndpoint = `${host}/transaction/to-deduct`
const transactionToDeductEndpointFn = (end) => `${host}/transaction/to-deduct?endInclusive=${end}`
const loginEndpoint = `${host}/user/login`
const spendCategoriesEndpoint = `${host}/spend-category`
const wellEndpoint = (type) => `${host}/well?rangeType=${type}`

const weightTrackingEndpoint = `${host}/tracking/weight`

const runningTaskEndpoint = `${host}/tracking/running`
const timeTrackingEndpoint = `${host}/tracking`
const stopTaskEndpoint = `${host}/tracking/stop`
const taskSummaryEndpoint = type => `${host}/tracking/summary?type=${type}`
const readingListEndpoint = `${host}/reading-list`
const readingListEndpointReadFn = (id, read) => `${host}/reading-list?id=${id}&isRead=${read}`
const readingListEndpointDeleteFn = (id) => `${host}/reading-list?id=${id}`

const bucketEndpoint = `${host}/bucket`

const moodEndpoint = `${host}/mood?rangeType=`

const reviewEndpoint = `${host}/review`
const reviewEndpointFn = date => `${host}/review?reviewDate=${date}`
const tempFormId = '91f2994f-2446-459c-806d-f99387fd2f1c'
const formEndpoint = `${host}/review/form?formId=${tempFormId}`
const todoReviewEndpoint = (type, category) => `${host}/todos/review?type=${type}${categoryParam(category)}`

const podcastSubscribeEndpoint = `${host}/podcast/subscribe`
const podcastTrack = `${host}/podcast/track`
const podcastNewEpisodesEndpointFn = (page, size, sort) => `${host}/podcast/new?page=${page}&size=${size}&sort=${sort}`
const podcastEpisodesEndpointFn = (podcastId, page, size) => `${host}/podcast/episodes?podcastId=${podcastId}&page=${page}&size=${size}`
const podcastAllSubsribedEpisodesEndpointFn = (page, size, sort) => `${host}/podcast/all?page=${page}&size=${size}&sort=${sort}`
const podcastAllSubsribedEndpointFn = (page, size) => `${host}/podcast/subscribed?page=${page}&size=${size}&sort=createdAtUtc,desc`

// Nutrition Endpoints
const mealEndpoint = `${host}/nutrition/food/meal`
const allMealsEndpoint = `${host}/nutrition/food/meal/all`
const mealPlanEndpoint = `${host}/nutrition/food/meal/plan`
const foodItemEndpoint = `${host}/nutrition/food/item`

function categoryParam(category) {
  return !!category ? `&category=${category}` : ''
}

const userPreferences = `${host}/preferences`


function api(endpoint, obj, rethrow) {
  if (rethrow) {
    return fetch(endpoint, obj)
      .then(val => withFeedback(val, obj));
  }
  return fetch(endpoint, obj)
    .then(val => withFeedback(val, obj))
    .catch(err => withFeedback({ok: false}, obj))
}

function withFeedback(response, obj) {
  try {
    const feedback = document.getElementById('feedback')
    if (!feedback || obj.method === "GET" || obj.noFeedback === true) {
      return response
    }

    if (response.ok) {
      if (obj.noSuccessFeedback) {
        return response
      }
        feedback.classList.add('success');
        feedback.classList.remove('failure');
        feedback.classList.remove('hidden');
        feedback.textContent = obj.successMessage || '✊ Nice one, submitted successfully';
      }
      else if (response.status >= 400 && response.status < 500) {
        response.json().then(body => {
          const serverMessage = !!body[0]?.message ? `🌝 Failed to submit because: ${body[0].message}` : null
          const message = serverMessage || obj.failureMessage || '🌝 Failed to submit because of an invalid request';
          feedback.classList.add('failure');
          feedback.classList.remove('success');
          feedback.classList.remove('hidden');
          feedback.textContent = message;
        });
      }
      else {
        feedback.classList.add('failure');
        feedback.classList.remove('success');
        feedback.classList.remove('hidden');
        feedback.textContent = obj.failureMessage || '🙈 Failed to submit. Please try again later';
      }
  } catch (error) {
    console.error('Error submitting:', error);
    // Rethrow the error
    throw error;
  }

  // Remove the feedback message after 5 seconds
  setTimeout(() => {
    feedback.classList.add('hidden');
    feedback.textContent = '';
    feedback.classList.remove('success', 'failure');
  }, 5000); 

  return response
}

function withFeedbackMessage(type, message) {
    const feedback = document.getElementById('feedback')

    if (type === 'success') {
      feedback.classList.add('success');
      feedback.classList.remove('failure');
      feedback.classList.remove('hidden');
      feedback.textContent = message
      }
    if (type === 'error') {
      feedback.classList.add('failure');
      feedback.classList.remove('success');
      feedback.classList.remove('hidden');
      feedback.textContent = message
    }
    if (type === 'wariing') {
      feedback.classList.add('warning');
      feedback.classList.remove('success');
      feedback.classList.remove('hidden');
      feedback.textContent = message
    }
  //
  // Remove the feedback message after 5 seconds
  setTimeout(() => {
    feedback.classList.add('hidden');
    feedback.textContent = '';
    feedback.classList.remove('success', 'failure', 'warning');
  }, 5000); 
}

const defaultTheme = new Map()
defaultTheme.set("--background-color", "#272725")
defaultTheme.set("--text-color", "#8d8271")
defaultTheme.set("--link-color", "#8d8271")
defaultTheme.set("--link-hover-color", "#f0f0f0")
defaultTheme.set("--highlighted-todo-color", "#f0f0f0")
defaultTheme.set("--font-family", "'Helvetica Neue', sans-serif")
defaultTheme.set("--main-color", "#e7b91b")
defaultTheme.set("--darker-main-color", "#d1a116")
defaultTheme.set("--dark-grey", "#2c2c2c")
defaultTheme.set("--light-grey", "#868680")


const darkerTheme = new Map()
darkerTheme.set("--background-color", "#131313")

function setTheme(theme) {
  console.log('call')
  const root = document.documentElement
  theme.forEach((value, key) => root.style.setProperty(key, value))
}
