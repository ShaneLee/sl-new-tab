host='http://localhost:8080'
host='http://192.168.0.46:8080'
const tempUserId = 'bd11dcc2-77f6-430f-8e87-5839d31ab0e3'

const headers = {
  'Content-Type': 'application/json',
  'tempUserId': tempUserId
}

// Endpoints
const todosEndpoint = `${host}/todos`
const deleteTodosEndpointFn = (thisInstance) => `${host}/todos?thisInstance=${thisInstance}`
const completeEndpoint = `${host}/todos/complete`
const uncompleteEndpoint = `${host}/todos/uncomplete`
const categoriesEndpoint = `${host}/todos/categories`
const transactionsEndpointFn = (start, end) => `${host}/transaction?start=${start}&endInclusive=${end}`
const transactionEndpoint = `${host}/transaction`

const runningTaskEndpoint = `${host}/tracking/running`
const timeTrackingEndpoint = `${host}/tracking`
const stopTaskEndpoint = `${host}/tracking/stop`
const taskSummaryEndpoint = type => `${host}/tracking/summary?type=${type}`
const readingListEndpoint = `${host}/reading-list`
const readingListEndpointReadFn = (id, read) => `${host}/reading-list?id=${id}&isRead=${read}`

const bucketEndpoint = `${host}/bucket`

const moodEndpoint = `${host}/mood?rangeType=`

const reviewEndpoint = `${host}/review`
const reviewEndpointFn = date => `${host}/review?reviewDate=${date}`
const tempFormId = '91f2994f-2446-459c-806d-f99387fd2f1c'
const formEndpoint = `${host}/review/form?formId=${tempFormId}`
const todoReviewEndpoint = (type, category) => `${host}/todos/review?type=${type}${category && `&category=${category}`}`

const userPreferences = `${host}/preferences`


function api(endpoint, obj, rethrow) {
  if (rethrow) {
    return fetch(endpoint, obj)
  }
  return fetch(endpoint, obj)
    .catch(err => null)
}
