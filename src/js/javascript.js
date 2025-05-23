IMPORTANT_TODO_DISPLAY_COUNT = 3
TAGS_FILTER_LIMIT = 3
quotesEnabled = false
timerEnabled = features.get('time-tracking')?.enabled
eventsEnabled = features.get('events')?.enabled
showTags = true
persistTagFilters = true
spendTrackingEnabled = features.get('spend-tracking')?.enabled
importantTodosEnabled = true
// Should we include this week's todos in the main note?
importantTodosForThisWeek = false
// Should we default to all todos or the current week number
defaultToAll = false
const withEmojis = true
const spotifyEnabled = features.get('spotify')?.enabled
const showCurrentPlayingTrackEnabled = true

const concatWithPlus = s => s.replace(' ', '+')
const searchEngineFn = q => `https://www.google.com/search?q=${concatWithPlus(q)}`

const CATEGORIES_SET = new Set()
const LAST = new Array()

const TAGS = new Set()
let TAG_FILTERS = new Set()

let isDragging = false
let startX, startY
let selectionBox
const SELECTED_TODOS = new Set()

class CircularQueue {
  constructor(elements) {
    this.elements = elements
  }

  get() {
    const element = this.elements.pop()
    this.elements.unshift(element)
    return element
  }
}

const TAG_COLOURS = new Map()

const DEFAULT_TAG_COLOURS = new CircularQueue(['red', 'yellow', 'green', 'cyan'])

const DEFAULT_RANK = 1000

let FAVOURITE_CATEGORIES = []

function processPreferences(prefs) {
  const coloursByTags = new Map(Object.entries(prefs.coloursByTags))
  coloursByTags.forEach((colour, tag) => {
    TAG_COLOURS.set(tag, colour)
  })

  FAVOURITE_CATEGORIES = prefs.favouriteCategories
}

function getUserTags() {
  if (!!TAGS) {
    Promise.resolve(TAGS)
  }
  return api(tagsEndpoint, {
    method: 'GET',
    headers: headers,
  })
    .then(res => res.json())
    .then(tags => {
      if (!!tags) {
        tags.forEach(tag => {
          if (!!tag) {
            TAGS.add(tag)
          }
        })
        return tags
      }
    })
}

let runningTask
let timerInterval
let contextMenu
let TODOS_SET = new Set()

class Page {
  constructor({ id, url, name, emoji, shortcut, feature, clickHandler }) {
    this.id = id
    this.url = url
    this.name = name
    this.emoji = emoji
    this.shortcut = shortcut ? shortcut.split('') : []
    this.feature = feature
    this.clickHandler = clickHandler

    this.createLink()
    if (this.shortcut.length > 0) {
      this.bindShortcut()
    }
  }

  createLink() {
    const link = document.getElementById(this.id)
    if (!link) return
    link.href = this.url
    link.innerHTML = this.emoji ? `${this.emoji} ${this.name}` : this.name

    if (this.clickHandler) {
      link.addEventListener('click', this.clickHandler)
    }
  }

  bindShortcut() {
    let pressedKeys = []

    document.addEventListener('keydown', event => {
      pressedKeys.push(event.key)

      if (this.shortcut.every((key, index) => key === pressedKeys[index])) {
        if (pressedKeys.length === this.shortcut.length) {
          this.openPage()
          event.preventDefault()
          pressedKeys = []
        }
      }
    })
  }

  openPage() {
    window.location.href = this.url
  }

  init() {
    this.createLink()
    this.bindShortcut()
  }
}

document.addEventListener('keydown', event => {
  if (event.key === '~') {
    document.getElementById('main').style.display = 'none'
  }

  // undo
  if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
    const last = LAST.pop()
    if (!!last) {
      uncomplete(last)
    }
  }
})

function loadJSon() {
  const request = new XMLHttpRequest()
  const requestURL = '../data/quotes.json'
  request.open('GET', requestURL)
  request.responseType = 'json'
  request.send()
  request.onload = () => {
    const quotes = request.response
    getQuote(quotes)
  }
}

function getQuote(jsonObj) {
  const randomQuote = pickRandom(jsonObj)
  printQuote(randomQuote.author, randomQuote.quote)
}

function pickRandom(quotes) {
  return quotes[Math.floor(Math.random() * quotes.length - 1) + 0]
}

function printQuote(quoteAuthor, quote) {
  document.getElementById('quote').innerHTML = quote
  document.getElementById('author').innerHTML = quoteAuthor
}

function startOfMonthCurrentDatePair() {
  const currentDate = new Date()
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const formattedStartOfMonth = `${startOfMonth.getFullYear()}-${(startOfMonth.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-01`
  const formattedCurrentDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`

  return { start: formattedStartOfMonth, end: formattedCurrentDate }
}

function getEventStartAndEndDates() {
  const today = new Date()
  const futureDate = new Date()
  futureDate.setDate(today.getDate() + 60)

  const todayFormatted = formatDate(today)
  const futureDateFormatted = formatDate(futureDate)

  return { start: todayFormatted, end: futureDateFormatted }
}

// TODO call
function getTotalMonthSpend() {
  const datePair = startOfMonthCurrentDatePair()

  api(transactionsEndpointFn(datePair.start, datePair.end), {
    method: 'GET',
    headers: headers,
  })
    .then(response => (response.status === 200 ? response?.json() : null))
    .then(val => {
      if (!!val) {
        updateMonthSpend(val)
      }
    })
    .catch(err => {})
}

function updateMonthSpend(transactions) {
  // TODO maybe I should have an endpoint to get the month spend
  const monthSpend = transactions.map(val => val.amount).reduce((a, b) => a + b)
  document.getElementById('totalMonthSpend').innerHTML =
    `Total Month Spend £${formatNumberToTwoDecimalPlaces(monthSpend)}`
}

function formatNumberToTwoDecimalPlaces(number) {
  if (typeof number !== 'number') {
    throw new Error('Input must be a number')
  }
  return number.toFixed(2)
}

function displayEvents(events) {
  const eventsContainer = document.getElementById('events')
  eventsContainer.innerHTML = ''

  events.forEach(val => {
    const listItem = document.createElement('li')

    // Format the date, start time, and optionally the end time
    const eventDate = val.date
    const startTime = val.startTime.slice(0, 5) // Truncate seconds from start time
    const endTime = val.endTime ? ` - ${val.endTime.slice(0, 5)}` : '' // Truncate seconds from end time if present
    const eventName = val.name

    const displayText = `${eventDate} - ${startTime}${endTime} - ${eventName}`
    listItem.textContent = displayText

    // Add a tooltip with the notes if they exist
    if (val.notes) {
      //
      // Regular expression to find URLs in notes
      const urlRegex = /https?:\/\/[^\s]+/
      const match = val.notes.match(urlRegex)

      // Check if notes contain a URL
      if (match) {
        const url = match[0]
        const link = document.createElement('a')
        link.href = url
        link.target = '_blank' // Open in a new tab
        link.textContent = displayText // Set the text content of the link
        listItem.innerHTML = '' // Clear previous text content
        listItem.appendChild(link)
        listItem.title = val.notes
      } else {
        listItem.title = val.notes
      }
    }

    eventsContainer.appendChild(listItem)
  })
}

function getEvents(start, end) {
  if (!eventsEnabled) {
    return
  }
  api(eventsEndpointFn(start, end), {
    method: 'GET',
    headers: headers,
  })
    .then(response => (response.status === 200 ? response?.json() : null))
    .then(val => {
      if (!!val) {
        displayEvents(val)
      }
    })
    .catch(err => {})
}

/***************************************************
 *
 * TIMER
 *
 ***************************************************/

function getRunningTask() {
  api(runningTaskEndpoint, {
    method: 'GET',
    headers: headers,
  })
    .then(response => (response.status === 200 ? response?.json() : null))
    .then(val => {
      if (!!val) {
        runningTask = val
        updateTask(val)
      } else {
        updateTaskButton(false)
      }
    })
    .catch(err => {})
}

const stopButton = {
  iconFn: ic => {
    ic.classList.remove('stopped')
    ic.innerHTML = '&#9632;' // Stop icon (square)"
  },
  btFn: button => {
    button.classList.add('stop')
    button.classList.remove('play')
  },
}

const playButton = {
  iconFn: ic => {
    ic.classList.add('stopped')
    ic.innerHTML = '&#9654;' // Play icon (right-pointing triangle)
  },
  btFn: button => {
    button.classList.add('play')
    button.classList.remove('stop')
  },
}

function updateTaskButton(isPlaying) {
  const button = document.getElementById('task-button')
  const icon = document.getElementById('task-button-icon')

  if (isPlaying) {
    stopButton.iconFn(icon)
    stopButton.btFn(button)
  } else {
    playButton.iconFn(icon)
    playButton.btFn(button)
  }

  button.addEventListener('click', function () {
    if (button.classList.contains('play')) {
      stopButton.iconFn(icon)
      stopButton.btFn(button)
      playTask()
    } else if (button.classList.contains('stop')) {
      playButton.iconFn(icon)
      playButton.btFn(button)
      stopTask(runningTask)
    }
  })
}

function playTask() {
  submitTaskForm()
}

function stopTask(task) {
  if (!!task) {
    api(stopTaskEndpoint, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(task),
    })
  }
  clearInterval(timerInterval)
  updateTimer(0, 0, 0)
  showTaskInput()
  clearTask()
}

function startNewTask(task) {
  api(timeTrackingEndpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(task),
  })
    .then(response => (response?.status === 201 ? response : null))
    .then(response => response?.json())
    .then(val => {
      if (!!val) {
        runningTask = val
        updateTask(val)
      }
    })
}

function clearTask() {
  document.getElementById('task-name').innerHTML = ''
}

function showTaskInput() {
  const taskInput = document.getElementById('task-input')
  const projectInput = document.getElementById('project-input')
  const categoryInput = document.getElementById('task-category-input')
  taskInput.style = 'display:""'
  projectInput.style = 'display:""'
  categoryInput.style = 'display:""'
}

function hideTaskInput() {
  const taskInput = document.getElementById('task-input')
  const projectInput = document.getElementById('project-input')
  const categoryInput = document.getElementById('task-category-input')
  taskInput.value = ''
  taskInput.style = 'display:none'
  projectInput.value = ''
  projectInput.style = 'display:none'
  categoryInput.value = ''
  categoryInput.style = 'display:none'
}

function updateTask(task) {
  updateTaskName(task.task)
  hideTaskInput()
  startTimerFromInstant(task.startTime)
  updateTaskButton(true)
}

function updateTaskName(name) {
  const element = document.getElementById('task-name')
  element.textContent = name
}

function updateTimer(hours, minutes, seconds) {
  const hoursElement = document.getElementById('hours')
  const minutesElement = document.getElementById('minutes')
  const secondsElement = document.getElementById('seconds')

  hoursElement.textContent = typeof hours === 'number' ? hours.toString().padStart(2, '0') : '00'
  minutesElement.textContent =
    typeof minutes === 'number' ? minutes.toString().padStart(2, '0') : '00'
  secondsElement.textContent =
    typeof seconds === 'number' ? seconds.toString().padStart(2, '0') : '00'
}

function startTimerFromInstant(instant) {
  const startTime = new Date(instant)

  timerInterval = setInterval(function () {
    const currentTime = new Date()
    const timeDifference = currentTime - startTime

    const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24)
    const minutes = Math.floor((timeDifference / (1000 * 60)) % 60)
    const seconds = Math.floor((timeDifference / 1000) % 60)

    updateTimer(hours, minutes, seconds)
  }, 1000)
}

function submitTaskForm() {
  const taskElement = document.getElementById('task-input')
  const task = taskElement.value
  if (!task) {
    return
  }
  const projectElement = document.getElementById('project-input')
  const categoryElement = document.getElementById('task-category-input')
  const project = projectElement.value
  const category = categoryElement.value

  const formData = {
    task: task,
    category: category,
    project: project,
  }
  startNewTask(formData)
}

/******************END TIMER ************************/

function deathCountdown() {
  const deathDate = moment('2075-03-28')
  const today = moment()
  const days = deathDate.diff(today, 'days').toLocaleString('en')
  document.getElementById('deathCountdown').innerHTML =
    'You have '.toUpperCase() + days + ' days remaining.'.toUpperCase()
  document.getElementById('title').innerHTML = days + ' Days Left'
  document.title = days
  return Math.abs(today.diff(moment('1994-03-28'), 'weeks'))
}

function importantTodos() {
  return api(importantEndpointFn(IMPORTANT_TODO_DISPLAY_COUNT), {
    method: 'GET',
    headers: headers,
  }).then(response => (response.status === 200 ? response.json() : []))
}

function uncomplete(todo) {
  api(uncompleteEndpoint, {
    method: 'PATCH',
    headers: headers,
    body: JSON.stringify(todo),
  }).then(_ => refreshTodos())
}

function update(todo, dontRefresh, dontShowSuccessMessage) {
  if (!!dontShowSuccessMessage) {
    todo.noSuccessFeedback = true
  }
  return api(todosEndpoint, {
    method: 'PUT',
    headers: headers,
    body: JSON.stringify(todo),
  }).then(_ => {
    if (!dontRefresh) {
      refreshTodos()
    }
  })
}

function link(todo, dontRefresh, dontShowSuccessMessage) {
  if (!!dontShowSuccessMessage) {
    todo.noSuccessFeedback = true
  }
  return api(linkTodosEndpoint, {
    method: 'PATCH',
    headers: headers,
    body: JSON.stringify(todo),
  }).then(_ => {
    if (!dontRefresh) {
      refreshTodos()
    }
  })
}

function updateRanks(todos) {
  return api(rankEndpoint, {
    noFeedback: true,
    method: 'PUT',
    headers: headers,
    body: JSON.stringify(todos),
  })
}

function complete(todo, dontRefresh) {
  api(completeEndpoint, {
    method: 'PATCH',
    headers: headers,
    body: JSON.stringify(todo),
  }).then(_ => (!!dontRefresh ? null : refreshTodos()))
}

function deleteTodo(todo, thisInstance, alternateSuccessMessage) {
  api(deleteTodosEndpointFn(thisInstance), {
    successMessage: alternateSuccessMessage ?? '🐸 The task has been deleted',
    failureMessage: '🙉 Oh no! The task failed to delete. Please try again later',
    method: 'DELETE',
    headers: headers,
    body: JSON.stringify(todo),
  }).then(_ => refreshTodos())
}

let audio

function playAudio() {
  if (!audio || audio.paused) {
    audio = new Audio('../sounds/great-success.mp3')
    audio.play()
  }
}

function refreshTodos(includeComplete = false) {
  TODOS_SET = new Set()
  const list = document.getElementById('todos')
  ;[...list.children].forEach(val => list.removeChild(val))
  todos(includeComplete)
}

function filterAndSlice(array, count, week) {
  const weekNum = Number(week.split(' ')[1])
  const maxWeeks = 52
  let result = []
  let foundWeeks = 0

  for (let i = 0; i < array.length; i++) {
    if (array[i].match(/^Week \d+$/)) {
      let iWeekNum = Number(array[i].split(' ')[1])
      let relativeWeekNum = iWeekNum >= weekNum ? iWeekNum - weekNum : maxWeeks - weekNum + iWeekNum

      if (relativeWeekNum < count && foundWeeks < count) {
        result.push(array[i])
        foundWeeks++
      }
    } else {
      result.push(array[i])
    }
  }

  return result
}

function deleteCategory(category) {
  return api(categoriesEndpoint, {
    method: 'DELETE',
    headers: headers,
    body: JSON.stringify({ category: category }),
  })
}

function categories() {
  const categories = document.getElementById('category-input')
  categories.onchange = refreshTodos
  api(categoriesEndpoint, {
    method: 'GET',
    headers: headers,
  })
    .then(response => response?.json())
    .then(val => {
      const defaultCategory = document.createElement('option')
      const all = document.createElement('option')
      defaultCategory.className = 'categories-item'
      all.className = 'categories-item'
      all.innerHTML = 'all'
      const week = `Week ${currentWeekNumber()}`
      if (defaultToAll) {
        categories.appendChild(all)
      } else {
        defaultCategory.innerHTML = `Week ${currentWeekNumber()}`
        categories.appendChild(defaultCategory)
        categories.appendChild(all)
      }
      if (!!val) {
        filterAndSlice(
          val.filter(category => category !== week),
          3,
          week,
        ) // Keep 3+ weeks
          .forEach(category => {
            CATEGORIES_SET.add(category)
            const item = document.createElement('option')
            item.className = 'categories-item'
            item.value = category
            item.innerHTML = category

            categories.style = null
            categories.appendChild(item)
          })
      } else {
        categories.style = 'display:none;'
      }

      return ''
    })
    .catch(err => {})
    .finally(() => todos())
}

function stripSpanTags(str) {
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = str
  return tempDiv.textContent || tempDiv.innerText || ''
}

function getTagColour(tag) {
  let colour = TAG_COLOURS.get(tag)

  if (!colour) {
    colour = DEFAULT_TAG_COLOURS.get()
    TAG_COLOURS.set(tag, colour)
  }

  return colour
}

function createTodoWithLinked(todo, linkedTodoId) {
  const todoElement = document.getElementById('todo-input')
  return createTodo(todo, todoElement, linkedTodoId)
}

function createTodo(todo, todoElement, linkedTodoId) {
  // todo is the string here
  let category = document.getElementById('category-input').value
  let categoryChanged = false
  let important = false
  if (todo.startsWith('!!')) {
    todo = todo.replace('!! ', '').replace('!!', '')
    important = true
  }
  if (todo.startsWith('@')) {
    const split = todo.split('@')
    categoryChanged = split[1] !== category
    category = split[1]
    todo = split[2]?.trim()
    if (!CATEGORIES_SET.has(category)) {
      api(categoriesEndpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ category: category }),
      })
    }
  }
  const tags = parseTags(todo)
  if (!!tags) {
    todo = replaceTags(todo)
  }

  const formData = JSON.stringify({
    todo: todo,
    important: important,
    linkedCountTodoId: linkedTodoId,
    category: category === 'all' ? null : category,
    tags: tags,
  })
  return api(todosEndpoint, {
    method: 'POST',
    headers: headers,
    body: formData,
  })
    .then(response => response?.json())
    .then(val => {
      if (!!val) {
        const list = document.getElementById('todos')
        if (!categoryChanged && category === val.category) {
          // If this is in a different category to the currently
          // shown one, don't bother adding it to the list
          addTodo(list, val)
          todoElement.innerHTML = ''
        }
      }
      return ''
    })
}

function todoFormSubmitEvent(event) {
  const todoElement = document.getElementById('todo-input')
  const form = document.getElementById('todo-form')
  event.preventDefault()

  let todo = stripSpanTags(todoElement.innerHTML)
  createTodo(todo, todoElement).then(_ => (todoElement.innerHTML = ''))
}

function todoForm() {
  const todoElement = document.getElementById('todo-input')
  const form = document.getElementById('todo-form')
  todoElement.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      todoFormSubmitEvent(event)
    }
  })
  form.addEventListener('submit', todoFormSubmitEvent)
}

function pendingTodos() {
  const endpoint = todosForCategoryEndpointFn('PENDING')
  api(endpoint, {
    method: 'GET',
    headers: headers,
  }).then(response => {
    const noPending = response.status == 204
    const pendingElement = document.getElementById('pendingTodos')
    if (!noPending && response.ok) {
      pendingElement.classList.remove('hidden')
      pendingElement.innerHTML = `${withEmojis ? '📋 ' : ''}There are pending todos`
    } else {
      pendingElement.classList.add('hidden')
    }

    pendingElement.addEventListener('click', () => {
      const selectElement = document.getElementById('category-input')
      if (selectElement.value === 'PENDING') {
        return
      }
      selectElement.value = 'PENDING'
      refreshTodos()
    })
  })
}

function setToCsv(val) {
  return Array.from(val).join(',')
}

function shouldDisplayMoveToThisWeek(category) {
  const thisWeekcategoryAction = document.getElementById('thisWeekCategoryAction')
  const thisWeek = `Week ${currentWeekNumber()}`
  if (thisWeek === category) {
    thisWeekCategoryAction.classList.add('hidden')
  } else {
    thisWeekCategoryAction.classList.remove('hidden')
  }
}

function shouldDisplayCopyToSubcategory(todo) {
  if (!todo) {
    return
  }
  const action = document.getElementById('copyToSubCategoryAction')
  if (!todo.isLinkable) {
    action.classList.add('hidden')
  } else {
    action.classList.remove('hidden')
  }
}

function todos(includeComplete = false) {
  if (typeof includeComplete !== 'boolean') {
    includeComplete = false
  }
  pendingTodos()
  const category = document.getElementById('category-input').value
  shouldDisplayMoveToThisWeek(category)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let endpoint =
    !!category && category !== 'all'
      ? `${todosEndpoint}?category=${category}&includeComplete=
  ${includeComplete}`
      : `${todosEndpoint}&includeComplete=${includeComplete}`
  endpoint = TAG_FILTERS.size === 0 ? endpoint : `${endpoint}&tags=${setToCsv(TAG_FILTERS)}`
  api(endpoint, {
    method: 'GET',
    headers: headers,
  })
    .then(response => response.json())
    .then(todos => {
      const list = document.getElementById('todos')
      if (!!todos) {
        todos
          .filter(todo => !(todo.recurring && !isTodoDueToday(todo)))
          .forEach(todo => addTodo(list, todo))
      }
    })
    .catch(err => {})
}

function isTodoDueToday(todo) {
  const dueDate = new Date(todo.dueDate)
  // Get the current date
  const currentDate = new Date()
  // Compare year, month, and day parts of the due date with the current date
  return (
    (dueDate.getFullYear() === currentDate.getFullYear() &&
      dueDate.getMonth() === currentDate.getMonth() &&
      dueDate.getDate() === currentDate.getDate()) ||
    todo.due
  )
}

function todoCountString(todo) {
  return `${todo.count}/${!!todo.incrementTarget ? todo.incrementTarget : todo.targetCount}`
}

let selectedTodo = null
function addTodo(uL, todo) {
  TODOS_SET.add(todo)

  const listItem = document.createElement('li')

  listItem.className = 'todo-item'
  // listItem.innerHTML = todo.todo;
  listItem.id = todo.id
  listItem.draggable = true

  listItem.addEventListener('dragstart', event => {
    event.dataTransfer.setData('text/plain', event.target.id)
  })

  listItem.addEventListener('dragover', handleDragOver)
  listItem.addEventListener('drop', handleDrop)

  const contentDiv = document.createElement('div')
  if (todo.complete) {
    contentDiv.classList.add('strikethrough')
  }
  contentDiv.classList.add('content')
  const contentTextDiv = document.createElement('div')
  contentDiv.appendChild(contentTextDiv)

  contentTextDiv.classList.add('todo-text')
  contentTextDiv.innerHTML = todo.todo.replace('<', '').replace('>', '')

  listItem.appendChild(contentDiv)
  listItem.addEventListener('contextmenu', function (event) {
    if (!!contextMenu) {
      hideContextMenu()
    }
    showContextMenu(event, todo)
  })

  const rightBoxes = document.createElement('div')
  rightBoxes.className = 'right-boxes'
  contentDiv.appendChild(rightBoxes)

  let countElement
  // TODO come up with a better name for these
  let spanItemCount = 0

  if (showTags && !!todo.tags) {
    todo.tags.forEach(tag => {
      const tagElement = document.createElement('span')
      tagElement.title = tag
      const colour = getTagColour(tag)

      tagElement.className = 'tag-box'
      tagElement.style.backgroundColor = colour
      if (withEmojis) {
        tagElement.classList.add('emoji')
      }

      rightBoxes.appendChild(tagElement)
      spanItemCount++
    })
  }

  if (todo.targetCount != null) {
    countElement = document.createElement('span')
    countElement.innerHTML = todoCountString(todo)
    // TODO different class?
    countElement.className = 'due-date-box'
    rightBoxes.appendChild(countElement)
    spanItemCount++
  }

  if (!todo.complete && !!todo.movedWeeksCount && todo.movedWeeksCount >= 3) {
    const movedWeeksCountElement = document.createElement('span')
    movedWeeksCountElement.title = `Put off for ${todo.movedWeeksCount} weeks`
    movedWeeksCountElement.innerHTML = withEmojis ? '🕷️' : '***'

    movedWeeksCountElement.className = 'due-date-box'
    movedWeeksCountElement.classList.add('highlighted-red')
    if (withEmojis) {
      movedWeeksCountElement.classList.add('emoji')
    }

    rightBoxes.appendChild(movedWeeksCountElement)
    spanItemCount++
  }

  if (todo.important) {
    const importantElement = document.createElement('span')
    importantElement.innerHTML = withEmojis ? '🌟' : '!'

    importantElement.className = 'due-date-box'
    importantElement.classList.add('no-highlight')
    if (withEmojis) {
      importantElement.classList.add('emoji')
    }

    rightBoxes.appendChild(importantElement)
    spanItemCount++
  }

  if (todo.dueDate && !todo.complete) {
    const dueDateElement = document.createElement('span')
    const currentDate = new Date()
    const date = new Date(todo.dueDate)

    // Set both dates to midnight for a day-to-day comparison
    currentDate.setHours(0, 0, 0, 0)
    const midnightDueDate = new Date(todo.dueDate)
    midnightDueDate.setHours(0, 0, 0, 0)

    // Formatting the time portion
    const timeString = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })

    // Checking if the date is today, tomorrow, another day in the current week, or more than a week away
    const daysDifference = (midnightDueDate - currentDate) / (1000 * 60 * 60 * 24) // Difference in days
    let dateString

    if (daysDifference === 0) {
      dateString = timeString // e.g., "6:00pm"
    } else if (daysDifference === 1) {
      dateString = `Tomorrow ${timeString}` // e.g., "Tomorrow 6:00pm"
    } else if (daysDifference > 1 && daysDifference < 7) {
      dateString = `${date.toLocaleDateString('en-US', { weekday: 'short' })} ${timeString}` // e.g., "Mon 6:00pm"
    } else {
      dateString = date.toISOString().split('T')[0] // e.g., "2023-09-29"
    }

    dueDateElement.innerHTML = dateString

    dueDateElement.className = 'due-date-box'
    if (todo.due) {
      dueDateElement.classList.add('highlighted-due')
    }

    rightBoxes.appendChild(dueDateElement)
  }

  listItem.addEventListener('click', () => {
    if (todo.complete) {
      return uncomplete(todo)
    }
    if (todo.targetCount != null) {
      const existingCountInput = document.getElementById('countInput')
      if (existingCountInput) {
        // If an input already exists, focus on it and return
        existingCountInput.focus()
        return
      }
      const countInput = document.createElement('input')
      countInput.type = 'number'
      // Make this not unique for todos,
      // this means that we can't have two of this open at once, which is a simple
      // way to prevent the nonsense that would occur if I allowed that
      countInput.id = 'countInput'
      countInput.className = 'countInput'
      countInput.value = todo.count // Prepopulate with the current count
      countInput.addEventListener('keypress', event => {
        if (event.key === 'Enter') {
          const newCount = parseInt(countInput.value, 10)
          todo.count = newCount
          todo.todo = replaceEmbeddedCount(todo.todo, newCount)
          countElement.innerHTML = todoCountString(todo)
          // TODO make the backend handle updating this particular case
          update(todo, true).then(val => {
            // Why check if incrementTarget is not null?
            // Because 1 >= null = true in javascript land. What the fuck.
            if (
              newCount >= todo.targetCount ||
              (todo.incrementTarget != null && newCount >= todo.incrementTarget)
            ) {
              // Continue with the normal click function
              LAST.push(todo)
              complete(todo, true)
              listItem.style = 'display: none;'
              playAudio()
            }
          })
          contentDiv.removeChild(countInput)
        }
      })

      contentDiv.appendChild(countInput)

      countInput.focus()

      // Return to prevent further execution of the click event
      return
    }

    LAST.push(todo)
    complete(todo, true)
    listItem.style = 'display: none;'
    playAudio()
    return false
  })
  uL.appendChild(listItem)
}

function replaceEmbeddedCount(todo, newCount) {
  return todo.replace(/<\d+>/, `<${newCount}>`)
}

function handleDragOver(event) {
  event.preventDefault()
}

function handleDrop(event) {
  event.preventDefault()

  // Get the dragged data (e.g., todo ID)
  const draggedItemId = event.dataTransfer.getData('text/plain')

  // Get the drop target (the new position for the todo)
  const dropTarget = event.target.closest('li')

  // Reorder the todos based on the drop position
  reorderTodos(draggedItemId, dropTarget)
}

function reorderTodos(draggedItemId, dropTarget) {
  // Get the parent list (ul)
  const todosList = dropTarget.parentElement

  // Get all todo items in the list
  const todoItems = Array.from(todosList.children)

  // Find the index of the dragged item
  const draggedIndex = todoItems.findIndex(item => item.id === draggedItemId)

  // Find the index of the drop target
  const dropIndex = todoItems.findIndex(item => item === dropTarget)

  // Remove the dragged item from the list
  const [draggedItem] = todoItems.splice(draggedIndex, 1)

  // Insert the dragged item at the new position
  todoItems.splice(dropIndex, 0, draggedItem)

  // Update the DOM with the new order
  todosList.innerHTML = ''
  todoItems.forEach(item => todosList.appendChild(item))

  const adjacentItems = getAdjacentItems(todoItems, draggedItem)
  setRankOrderBetween(adjacentItems, draggedItem, todoItems)
}

function getAdjacentItems(array, element) {
  const index = array.indexOf(element)

  if (index === -1) {
    // Element not found in the array
    return null
  }

  const previousIndex = index - 1
  const nextIndex = index + 1

  const previousListItem = previousIndex >= 0 ? array[previousIndex] : null
  const nextListItem = nextIndex < array.length ? array[nextIndex] : null

  return { previousListItem, nextListItem }
}

function setRankOrderBetween(adjacentItems, todoObject, todos) {
  const todosMap = Array.from(TODOS_SET).reduce((map, item) => {
    map.set(item.id, item)
    return map
  }, new Map())
  const { previousListItem, nextListItem } = adjacentItems
  const previousItem = todosMap.get(previousListItem?.id)
  const nextItem = todosMap.get(nextListItem?.id)

  if (previousItem === null && nextItem === null) {
    // Handle the case when both adjacent items are null
    return updateIndividualTodoRank(todoObject, todosMap, DEFAULT_RANK)
  }

  const previousRank = previousItem ? previousItem.rankOrder : 0
  const nextRank = nextItem ? nextItem.rankOrder : 30000000

  // Calculate a rank order value between the two items
  const newRankOrder = Math.floor((previousRank + nextRank) / 2)

  // Check if there are no integers between the two items
  // If this happens, the simplest thing to do is completely
  // rerank the whole list based on the current order
  if (newRankOrder === previousRank || newRankOrder === nextRank) {
    rerank(todos, todosMap)
    return
  }

  return updateIndividualTodoRank(todoObject, todosMap, newRankOrder)
}

function updateIndividualTodoRank(todoObject, todosMap, rankOrder) {
  const todo = todosMap.get(todoObject.id)
  todo.rankOrder = rankOrder
  // Call the backend to persist the new order
  update(todo, true, true)
}

/**
 * We need to come up with a new rank for each of these elements
 * then call the backend up update the ranks
 *
 * The ranks have an arbitary gap between the ranks that prevents the
 * need to rerank all the items every single time we reorder the elements.
 * In most cases, it will be update a single item's rank in the bank end
 */
function rerank(todoElements, todosMaps) {
  const updated = todoElements.map((element, index) => {
    const todo = todosMaps.get(element.id)
    return {
      ...todo,
      rankOrder: (index + 1) * DEFAULT_RANK, // default rank is the arbitary gap
    }
  })

  updateRanks(updated)
}

function createGrid(width, height, numToColor) {
  const gridContainer = document.getElementById('grid-container')

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const square = document.createElement('div')
      square.classList.add('square')

      if (numToColor > 0) {
        square.style.backgroundColor = '#8d8271'
        numToColor--
      }

      gridContainer.appendChild(square)
    }
  }
}

function addTags(todo, tags) {
  if (!!tags) {
    const originalTags = todo.tags
    todo.tags = tags.split(',')
    if (!!originalTags) {
      todo.tags.push(...originalTags)
    }
  }
  return todo
}

function matchTags(str) {
  const regex = /(?<!\\)tags:([^\s]*)/
  const match = str.match(regex)
  return match ? match[1] : null
}

function replaceTags(todoStr) {
  const tagsPattern = /(?<!\\)tags:([^\s]*)/
  return todoStr.replace(tagsPattern, '')
}

function parseTags(csvString) {
  const tags = matchTags(csvString)
  if (tags) {
    return tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '')
  }
  return []
}

function parseFrequencyString(val) {
  const localDatePattern = /\b\d{4}-\d{2}-\d{2}\b/g
  const everyPattern =
    /every (\d+(?:st|nd|rd|th)?)?\s?(days?|weeks?|months?|quarters?|years?|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)?/i
  const dayOnlyPattern =
    /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|today|tomorrow)\b/i
  const dayTimePattern = /\b(?:@|at)\s*(\d{1,2}[ap]m)/i
  const categoryPattern = /@([^@]+)@/g
  const tagsPattern = /(?<!\\)tags:([^\s]*)/

  // Replaces matched patterns with highlighted version
  val = val.replace(everyPattern, '<span style="background-color: yellow;">$&</span>')
  val = val.replace(dayOnlyPattern, '<span style="background-color: yellow;">$&</span>')
  val = val.replace(dayTimePattern, '<span style="background-color: yellow;">$&</span>')
  val = val.replace(categoryPattern, '<span style="background-color: yellow;">$&</span>')
  val = val.replace(localDatePattern, '<span style="background-color: yellow;">$&</span>')
  val = val.replace(tagsPattern, '<span style="background-color: yellow;">$&</span>')

  return val
}

function containsLink(str) {
  const urlPattern = /(https?:\/\/[^\s]+)/g
  return urlPattern.test(str)
}

function parseLink(str) {
  const urlPattern = /(https?:\/\/[^\s]+)/g
  return str.match(urlPattern) || []
}

function highlightMatches() {
  const div = document.getElementById('todo-input')
  const content = div.innerHTML
  div.innerHTML = parseFrequencyString(content)
}

function showContextMenu(event, todo) {
  // Check if the right-click occurred outside of an 'a' tag
  if (event.target.tagName.toLowerCase() === 'a') {
    return
  }
  shouldDisplayCopyToSubcategory(todo)
  event.preventDefault()
  const isTodoContextMenu = !!todo && SELECTED_TODOS.size == 0
  selectedTodo = todo
  const contextMenuId = isTodoContextMenu ? 'todoContextMenu' : 'contextMenu'
  contextMenu = document.getElementById(contextMenuId)

  const linkedCountId = 'addLinkedCountAction'
  const removeDueDateActionId = 'removeDueDateAction'
  const openLinkActionId = 'openLinkAction'
  if (isTodoContextMenu && todo.targetCount != null) {
    const existing = document.getElementById(linkedCountId)
    existing.style.display = 'block'
  } else {
    const existing = document.getElementById(linkedCountId)
    existing.style.display = 'none'
  }

  if (isTodoContextMenu && todo.dueDate != null) {
    const existing = document.getElementById(removeDueDateActionId)
    existing.style.display = 'block'
  } else {
    const existing = document.getElementById(removeDueDateActionId)
    existing.style.display = 'none'
  }

  // TODO contains link method
  if (isTodoContextMenu && containsLink(todo.todo)) {
    const existing = document.getElementById(openLinkActionId)
    existing.style.display = 'block'
  } else {
    const existing = document.getElementById(openLinkActionId)
    existing.style.display = 'none'
  }

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

function createTodoEditForm(todo, updateTodoAction) {
  let form = document.getElementById('todo-edit-popup')
  if (form) {
    return form
  }

  function closeForm() {
    let form = document.getElementById('todo-edit-popup')
    if (form) {
      form.style.display = 'none'
      document.removeEventListener('keydown', handleKeydown)
      form.remove()
      selectedTodo = null
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closeForm()
    }
  }

  form = document.createElement('div')
  form.id = 'todo-edit-popup'
  form.classList.add('default-form')

  const closeButton = document.createElement('button')
  closeButton.type = 'button'
  closeButton.id = 'close-todo-edit-form-button'
  closeButton.innerHTML = 'Close'
  closeButton.addEventListener('click', closeForm)

  const formHTML = `
    <form id="edit-todo-form">
      <h4>Edit Todo</h4>
      
      <!-- Todo description -->
      <label for="todo-description">Todo</label>
      <input type="text" id="todo-description" name="todo" value="${todo.todo}" required>

      <!-- Category -->
      <label for="todo-category">Category</label>
      <input type="text" id="todo-category" name="category" value="${todo.category}" required>

      <!-- Due date -->
      <label for="todo-dueDate">Due Date</label>
      <input type="date" id="todo-dueDate" name="dueDate" value="${todo.dueDate || ''}">
      
      ${todo.recurring ? `<label for="todo-recurring">Recurring</label>` : ''}

      <!-- Important -->
      <label for="todo-important">Important</label>
      <input type="checkbox" id="todo-important" name="important" ${
        todo.important ? 'checked' : ''
      }>

      <!-- Important -->
      <label for="todo-time-estimate-hours">Time Estimate (Hours)</label>
      <input type="number" id="todo-time-estimate-hours" name="time-esimate-hours" ${
        todo.timeEstimateHours
      }>
      
      <!-- Tags -->
      <label for="todo-tags">Tags</label>
      <input type="text" id="todo-tags" name="tags" value="${todo.tags.join(
        ', ',
      )}" placeholder="Comma separated">

      <!-- Notes -->
      <label for="todo-notes">Notes</label>
      <textarea id="todo-notes" name="notes" placeholder="Additional notes">${
        todo.notes || ''
      }</textarea>

      <button type="submit">Update Todo</button>
    </form>
  `
  form.innerHTML = formHTML
  form.appendChild(closeButton)

  form.querySelector('form').addEventListener('submit', function (e) {
    e.preventDefault()

    const updatedTodo = {
      ...todo,
      id: todo.id,
      todo: document.getElementById('todo-description').value,
      category: document.getElementById('todo-category').value,
      dueDate: document.getElementById('todo-dueDate').value || null,
      important: document.getElementById('todo-important').checked,
      timeEstimateHours: document.getElementById('todo-time-estimate-hours').value || null,
      tags: document
        .getElementById('todo-tags')
        .value.split(',')
        .map(tag => tag.trim()),
      notes: document.getElementById('todo-notes').value || null,
    }

    updateTodoAction(updatedTodo)
    closeForm()
  })

  document.addEventListener('keydown', handleKeydown) // Add Esc listener

  return form
}

function createTagFilterForm(tags, addTodoTagFilterAction, tagPillFn, tagsContainer) {
  let form = document.getElementById('tag-filter-popup')
  if (form) {
    return form
  }

  function closeForm() {
    let form = document.getElementById('tag-filter-popup')
    if (form) {
      form.style.display = 'none'
    }
  }

  form = document.createElement('div')
  form.id = 'tag-filter-popup'
  form.classList.add('default-form')

  const closeButton = document.createElement('button')
  closeButton.type = 'button'
  closeButton.id = 'close-tag-filter-form-button'
  closeButton.innerHTML = 'Close'
  closeButton.addEventListener('click', closeForm)

  const formHTML = `
    <form>
      <h4>Filter by Tag</h4>
      <select id="tags-popup-input" name="tags">
        ${tags.map(tag => `<option value="${tag}">${tag}</option>`).join('')}
      </select>
      <button type="submit">Submit</Button>
    </form>
  `
  form.innerHTML = formHTML
  form.appendChild(closeButton)
  form.querySelector('form').addEventListener('submit', function (e) {
    e.preventDefault()

    const tagElement = document.getElementById('tags-popup-input')
    const tag = tagElement.value

    TAG_FILTERS.add(tag)
    updateTagFilters()

    const tagPill = createTagPill(tag, addTodoTagFilterAction, tagsContainer)
    tagPillFn(tagPill)
    refreshTodos()
    closeForm()
  })

  return form
}

function showTagFilter(tag) {
  const tagElement = document.getElementById('tags-popup-input')
  const tagsContainer = document.getElementById('tags-container')
  const tagPill = createTagPill(tag, null, tagsContainer)
  tagsContainer.appendChild(tagPill)
  tagsContainer.classList.remove('hidden')
}

function loadTagFilters() {
  if (!persistTagFilters) {
    return
  }
  const tagFilters = localStorage.getItem('tag_filters')
  TAG_FILTERS = tagFilters ? new Set(JSON.parse(tagFilters)) : TAG_FILTERS
  TAG_FILTERS.forEach(showTagFilter)
}

function updateTagFilters() {
  if (!persistTagFilters) {
    return
  }
  localStorage.setItem('tag_filters', JSON.stringify([...TAG_FILTERS]))
}

function createTagPill(tag, addTodoTagFilterAction, tagsContainer) {
  const tagPill = document.createElement('div')
  const colour = getTagColour(tag)
  tagPill.className = 'tag-pill'
  tagPill.style.backgroundColor = colour
  tagPill.innerHTML = tag
  const removeTagElement = document.createElement('span')
  removeTagElement.classList.add('remove-tag')
  removeTagElement.innerHTML = 'x'
  removeTagElement.addEventListener('click', function () {
    addTodoTagFilterAction?.classList.remove('hidden')
    TAG_FILTERS.delete(tag)
    updateTagFilters()
    refreshTodos()
    removeTagElement.parentElement.remove()
    if (TAG_FILTERS.size === 0) {
      tagsContainer.classList.add('hidden')
    }
  })
  tagPill.appendChild(removeTagElement)
  return tagPill
}

function createTodoTagFilterElement(tagsContainer, addTodoTagFilterAction, tagPillFn) {
  getUserTags().then(tags => {
    const tagForm = createTagFilterForm(tags, addTodoTagFilterAction, tagPillFn, tagsContainer)
    showPopupForm(tagForm)
  })
}

function addTodoDragToSelectListener() {
  function toggleSelection(item) {
    const todosMap = Array.from(TODOS_SET).reduce((map, val) => {
      map.set(val.id, val)
      return map
    }, new Map())
    const todo = todosMap.get(item.id)
    if (SELECTED_TODOS.has(todo)) {
      SELECTED_TODOS.delete(todo)
      item.classList.remove('selected')
    } else {
      SELECTED_TODOS.add(todo)
      item.classList.add('selected')
    }
  }

  function createSelectionBox() {
    selectionBox = document.createElement('div')
    selectionBox.id = 'selectionBox'
    document.body.appendChild(selectionBox)
  }

  function updateSelectionBox(x1, y1, x2, y2) {
    const left = Math.min(x1, x2)
    const top = Math.min(y1, y2)
    const width = Math.abs(x2 - x1)
    const height = Math.abs(y2 - y1)

    selectionBox.style.left = `${left}px`
    selectionBox.style.top = `${top}px`
    selectionBox.style.width = `${width}px`
    selectionBox.style.height = `${height}px`
  }

  function selectTodosWithinBox() {
    const boxRect = selectionBox.getBoundingClientRect()
    const todosMap = Array.from(TODOS_SET).reduce((map, val) => {
      map.set(val.id, val)
      return map
    }, new Map())
    document.querySelectorAll('.todo-item').forEach(item => {
      const todo = todosMap.get(item.id)
      const itemRect = item.getBoundingClientRect()
      const isInside = !(
        boxRect.right < itemRect.left ||
        boxRect.left > itemRect.right ||
        boxRect.bottom < itemRect.top ||
        boxRect.top > itemRect.bottom
      )

      if (isInside) {
        item.classList.add('selected')
        SELECTED_TODOS.add(todo)
      } else {
        item.classList.remove('selected')
        SELECTED_TODOS.delete(todo)
      }
    })
  }

  function cancelSelection(event) {
    if (event.key === 'Escape' || event.key === 'Esc') {
      document.querySelectorAll('.todo-item.selected').forEach(item => {
        item.classList.remove('selected')
      })
      SELECTED_TODOS.clear()
    }
  }

  function gToSelectListener() {
    document.addEventListener('mousedown', event => {
      if (event.shiftKey) {
        isDragging = true
        startX = event.pageX
        startY = event.pageY

        createSelectionBox()
        updateSelectionBox(startX, startY, startX, startY)
      }
    })

    document.addEventListener('mousemove', event => {
      if (isDragging) {
        updateSelectionBox(startX, startY, event.pageX, event.pageY)
        selectTodosWithinBox()
      }
    })

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false
        if (selectionBox) {
          document.body.removeChild(selectionBox)
          selectionBox = null
        }
      }
    })
  }
  gToSelectListener()
  document.addEventListener('keydown', cancelSelection)
}

function addTodoListener() {
  document.getElementById('todo-input').addEventListener('input', function () {
    if (this.innerHTML === '<br>') {
      this.innerHTML = '' // Ensure the div is truly empty
    }
    // To avoid cursor jumping, we'll only replace content if it has changed
    const newContent = parseFrequencyString(this.innerText)
    if (newContent !== this.innerHTML) {
      this.innerHTML = newContent

      // Set cursor to the end after change
      const range = document.createRange()
      const sel = window.getSelection()
      range.setStart(this, this.childNodes.length)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
    }
  })

  contextMenu = document.getElementById('contextMenu')
  const deleteThisInstanceAction = document.getElementById('deleteThisInstanceAction')
  const showCompleteTodosAction = document.getElementById('showCompleteTodosAction')
  const deleteAllInstancesAction = document.getElementById('deleteAllInstancesAction')
  const editAction = document.getElementById('editAction')
  const moveNextAction = document.getElementById('moveNextAction')
  const copyToSubcategoryAction = document.getElementById('copyToSubCategoryAction')
  const changeCategoryAction = document.getElementById('changeCategoryAction')
  const thisWeekcategoryAction = document.getElementById('thisWeekCategoryAction')
  const changeAllCategoryAction = document.getElementById('changeAllCategoryAction')
  const deleteCurrentCategoryAction = document.getElementById('deleteCurrentCategoryAction')
  const openSettingsAction = document.getElementById('openSettingsAction')
  const addTodoTagFilterAction = document.getElementById('addTagTodoFilterAction')
  const moveAllNextAction = document.getElementById('moveAllNextAction')
  const addLinkedCountAction = document.getElementById('addLinkedCountAction')
  const editDueDateAction = document.getElementById('editDueDateAction')
  const removeDueDateAction = document.getElementById('removeDueDateAction')
  const moveToBacklogAction = document.getElementById('moveToBacklogAction')
  const moveToIdeaAction = document.getElementById('moveToIdeaAction')
  const openLinkAction = document.getElementById('openLinkAction')
  const markImportantAction = document.getElementById('markImportantAction')
  const addTagAction = document.getElementById('addTagAction')
  const addNotesAction = document.getElementById('addNotesAction')
  const addTagsToAllAction = document.getElementById('addTagsToAllAction')
  const openInSearchEngineAction = document.getElementById('openInSearchEngineAction')

  document.addEventListener('contextmenu', function (event) {
    hideContextMenu()
    showContextMenu(event)
  })

  function moveToCategory(category) {
    const todo = selectedTodo
    todo.category = category
    update(todo)
    selectedTodo = null
    hideContextMenu()
  }

  copyToSubcategoryAction.addEventListener('click', function () {
    const todo = selectedTodo
    const category = prompt('Enter the new category:')
    if (!!category) {
      todo.category = category
      link(todo)
    }
    selectedTodo = null
    hideContextMenu()
  })

  if (!!FAVOURITE_CATEGORIES) {
    for (let i = 0; i < FAVOURITE_CATEGORIES.length; i++) {
      const cat = FAVOURITE_CATEGORIES[i]
      // TODO moveAllTo favourite
      const el = document.getElementById(`moveToFavourite${i}`)
      el.innerHTML = `Move to ${cat}`
      el.classList.remove('hidden')
      el.addEventListener('click', function () {
        moveToCategory(cat)
      })
    }
  }

  openSettingsAction.addEventListener('click', function () {
    window.location.href = `${browserExtension}://${extensionId}/template/settings.html`
  })

  showCompleteTodosAction.addEventListener('click', function (event) {
    event.preventDefault()
    refreshTodos(true)
  })

  addTodoTagFilterAction.addEventListener('click', function () {
    const tagsContainer = document.getElementById('tags-container')
    tagsContainer.classList.remove('hidden')
    createTodoTagFilterElement(tagsContainer, addTodoTagFilterAction, tagFilter =>
      tagsContainer.appendChild(tagFilter),
    )

    if (tagsContainer.childElementCount === TAGS_FILTER_LIMIT) {
      addTodoTagFilterAction.classList.add('hidden')
    }

    refreshTodos()
  })

  removeDueDateAction.addEventListener('click', function () {
    const todo = selectedTodo
    const dueDate = todo.dueDate
    if (!!dueDate) {
      todo.dueDate = null
      update(todo)
    }
    selectedTodo = null
    hideContextMenu()
  })

  deleteCurrentCategoryAction.addEventListener('click', function () {
    const categories = document.getElementById('category-input')
    const category = categories.value

    if (!!category && confirm(`Are you sure you want to delete the category "${category}"?`)) {
      deleteCategory(category).then(res => {
        // Go back to the the default category
        const selectedOption = categories.options[categories.selectedIndex]

        categories.removeChild(selectedOption)

        if (categories.options.length > 0) {
          categories.selectedIndex = 0
        }
      })
    }
  })

  markImportantAction.addEventListener('click', function () {
    const todo = selectedTodo
    todo.important = true
    update(todo)
    selectedTodo = null
    hideContextMenu()
  })

  openLinkAction.addEventListener('click', function () {
    const todo = selectedTodo
    // If this has been clicked we already know that there is a link in there
    const link = parseLink(todo.todo)
    window.open(link, '_blank')
    selectedTodo = null
    hideContextMenu()
  })

  openInSearchEngineAction.addEventListener('click', function () {
    const todo = selectedTodo
    window.open(searchEngineFn(todo.todo), '_blank')
    selectedTodo = null
    hideContextMenu()
  })

  editDueDateAction.addEventListener('click', function () {
    const todo = selectedTodo
    const dueDate = todo.dueDate

    const datePicker = document.createElement('input')
    datePicker.type = 'date'

    // If the due date is set use that, otherwise set yesterday,
    // reason for this is that we only submit on a change,
    // if we wanted to set today, we couldn't if today was set
    if (dueDate) {
      const formattedDueDate = (
        typeof dueDate === 'string' ? dueDate : dueDate.toISOString()
      ).split('T')[0]
      datePicker.value = formattedDueDate
    } else {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      const formatted = yesterday.toISOString().split('T')[0]
      datePicker.value = formatted
    }

    // Set the position of the date picker relative to the context menu
    const rect = editDueDateAction.getBoundingClientRect()
    datePicker.style.position = 'absolute'
    // datePicker.className = 'default-form';
    datePicker.style.top = window.scrollY + rect.bottom + 'px'
    datePicker.style.left = window.scrollX + rect.left + 'px'

    datePicker.addEventListener('change', function () {
      const selectedDate = new Date(datePicker.value)

      selectedTodo.dueDate = selectedDate
      update(selectedTodo)

      document.body.removeChild(datePicker)

      selectedTodo = null
      hideContextMenu()
    })

    // Add a global click event listener to remove the date picker if clicked outside
    function clickOutsideDatePickerHandler(event) {
      if (!datePicker.contains(event.target) && event.target !== editDueDateAction) {
        document.removeEventListener('click', clickOutsideDatePickerHandler)
        document.body.removeChild(datePicker)
        selectedTodo = null
        hideContextMenu()
      }
    }

    document.addEventListener('click', clickOutsideDatePickerHandler)

    // Append the date picker to the body
    document.body.appendChild(datePicker)
  })

  addLinkedCountAction.addEventListener('click', function () {
    const todo = selectedTodo
    const task = prompt('Add linked todo:', todo.todo)
    if (!!task && todo.todo !== task) {
      createTodoWithLinked(task, todo.id)
    }
    selectedTodo = null
    hideContextMenu()
  })

  deleteThisInstanceAction.addEventListener('click', function () {
    deleteTodo(selectedTodo, true)
    selectedTodo = null
    hideContextMenu()
  })

  deleteAllInstancesAction.addEventListener('click', function () {
    deleteTodo(selectedTodo, false)
    selectedTodo = null
    hideContextMenu()
  })

  const nextCategoryFn = match => {
    const val = parseInt(match, 10) + 1
    // There are 52 weeks
    if (val === 53) {
      return 1
    }
    return val
  }

  moveNextAction.addEventListener('click', function () {
    const todo = selectedTodo
    const category = todo?.category.replace(/\d+/, nextCategoryFn)
    if (!!category) {
      todo.category = category
      if (category === 'Week 1') {
        todo.year = !todo.year ? null : todo.year + 1
      }
      update(todo)
    }
    selectedTodo = null
    hideContextMenu()
  })

  moveToIdeaAction.addEventListener('click', function () {
    const todo = selectedTodo
    const idea = { idea: todo.todo }
    const category = prompt('Enter the new category:')
    if (!!category) {
      idea.category = category
    }
    const notes = prompt('Enter the any notes:')
    if (!!notes) {
      idea.notes = notes
    }
    createIdea(idea).then(val => deleteTodo(todo, true, '🧞‍♂️ The Todo has been moved to an idea'))
    selectedTodo = null
    hideContextMenu()
  })

  changeCategoryAction.addEventListener('click', function () {
    const todo = selectedTodo
    const category = prompt('Enter the new category:')
    if (!!category) {
      todo.category = category
      update(todo)
    }
    selectedTodo = null
    hideContextMenu()
  })

  addNotesAction.addEventListener('click', function () {
    const todo = selectedTodo
    // TODO ignores existing notes
    const notes = prompt('Enter the notes:')
    if (!!notes) {
      todo.notes = notes
      update(todo)
    }
    selectedTodo = null
    hideContextMenu()
  })

  addTagAction.addEventListener('click', function () {
    const tags = prompt('Enter the new tag(s) comma separated:')
    const todo = addTags(selectedTodo, tags)
    if (!!tags) {
      update(todo)
    }
    selectedTodo = null
    hideContextMenu()
  })

  thisWeekCategoryAction.addEventListener('click', function () {
    const todo = selectedTodo
    todo.category = `Week ${currentWeekNumber()}`
    update(todo)
    selectedTodo = null
    hideContextMenu()
  })

  moveAllNextAction.addEventListener('click', function () {
    // TODO update the backend to have a list edit endpoint
    // will need to validate that all are for the same user
    const setToUse = SELECTED_TODOS.size > 0 ? SELECTED_TODOS : TODOS_SET
    const promises = [...setToUse].map(todo => {
      const category = todo?.category.replace(/\d+/, nextCategoryFn)
      if (!!category) {
        todo.category = category
        if (category === 'Week 1') {
          todo.year = !todo.year ? null : todo.year + 1
        }
        return update(todo, true)
      }
      return Promise.resolve()
    })

    Promise.all(promises).then(() => {
      SELECTED_TODOS.clear()
      refreshTodos()
      hideContextMenu()
    })
  })

  addTagsToAllAction.addEventListener('click', function () {
    const tags = prompt('Enter the new tag(s) comma separated:')
    const setToUse = SELECTED_TODOS.size > 0 ? SELECTED_TODOS : TODOS_SET
    const promises = [...setToUse].map(selectedTodo => {
      const todo = addTags(selectedTodo, tags)
      if (!!tags) {
        return update(todo, true)
      }
      return Promise.resolve()
    })

    Promise.all(promises).then(() => {
      SELECTED_TODOS.clear()
      refreshTodos()
      hideContextMenu()
    })
  })

  changeAllCategoryAction.addEventListener('click', function () {
    // TODO update the backend to have a list edit endpoint
    // will need to validate that all are for the same user
    const category = prompt('Enter the new category:')
    const setToUse = SELECTED_TODOS.size > 0 ? SELECTED_TODOS : TODOS_SET
    const promises = [...setToUse].map(todo => {
      if (!!category) {
        todo.category = category
        return update(todo, true)
      }
      return Promise.resolve()
    })

    Promise.all(promises).then(() => {
      SELECTED_TODOS.clear()
      refreshTodos()
      hideContextMenu()
    })
  })

  editAction.addEventListener('click', function () {
    const todo = selectedTodo
    const todoForm = createTodoEditForm(todo, update)
    showPopupForm(todoForm)

    // let task = prompt('Edit todo:', todo.todo)
    // const tags = parseTags(task)
    // if (!!tags) {
    //   task = replaceTags(task)
    // }
    // if (tags && tags.length > 0) {
    //   todo.tags = Array.from(new Set([...todo.tags, ...tags]))
    // }
    // if (!!task && todo.todo !== task) {
    //   todo.todo = task
    //   update(todo)
    // }
    selectedTodo = null
    hideContextMenu()
  })

  // Event listener to hide context menu on window click
  window.addEventListener('click', function () {
    hideContextMenu()
  })
}

function createIdea(idea) {
  return api(bucketEndpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(idea),
  }).then(response =>
    response.status === 200 || response.status === 201 ? response?.json() : null,
  )
}

function getDaysUntilTargetDate(targetDate) {
  if (!targetDate) {
    return ''
  }
  const currentDate = new Date()
  const daysUntil = Math.ceil((targetDate - currentDate) / (1000 * 60 * 60 * 24))
  const day = targetDate.getDate()
  const monthNames = [
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
  const monthName = monthNames[targetDate.getMonth()]
  const formattedDate = `${day} ${monthName}`

  return `${daysUntil} day${daysUntil !== 1 ? 's' : ''} until ${formattedDate}`
}

function mapWithDueDate(todos) {
  if (!todos) {
    return
  }
  const category = document.getElementById('category-input').value
  const weekCategory = category.includes('Week')
  return todos
    .filter(val => importantTodosForThisWeek || !(weekCategory && val.category === category))
    .map(todo => {
      return {
        todo: todo,
        target: !!todo.dueDate ? new Date(todo.dueDate) : null,
        countRemaining: !!todo.count ? `${todo.targetCount - todo.count} to go!` : '',
      }
    })
    .map(val => `${val.todo.todo} ${getDaysUntilTargetDate(val.target)}${val.countRemaining}</br>`)
    .slice(0, IMPORTANT_TODO_DISPLAY_COUNT)
    .join('')
}

const pages = [
  new Page({
    id: 'events-link',
    url: `${browserExtension}://${extensionId}/template/events.html`,
    name: 'Events',
    emoji: withEmojis ? '🐸' : '',
    shortcut: ',e',
    feature: 'events',
  }),
  new Page({
    id: 'memes-link',
    url: `${browserExtension}://${extensionId}/template/memes.html`,
    name: 'Memes',
    emoji: withEmojis ? '🤣' : '',
    feature: 'memes',
  }),
  new Page({
    id: 'logs-link',
    url: `http://192.168.0.46/logs`,
    name: 'Logs',
    emoji: withEmojis ? '🤖' : '',
    shortcut: ',l',
    feature: 'logs',
  }),
  new Page({
    id: 'time-tracking-summary-link',
    url: `${browserExtension}://${extensionId}/template/time-tracking-summary.html`,
    name: 'Time tracking summary',
    emoji: withEmojis ? '🕰️' : '',
    shortcut: ',t',
    feature: 'time-tracking',
  }),
  new Page({
    id: 'spend-tracker-link',
    url: `${browserExtension}://${extensionId}/template/spend-tracker.html`,
    name: 'Spend Tracker',
    emoji: withEmojis ? '💰' : '',
    shortcut: ',s',
    feature: 'spend-tracking',
  }),
  new Page({
    id: 'weight-tracker-link',
    url: `${browserExtension}://${extensionId}/template/weight-tracker.html`,
    name: 'Weight Tracker',
    emoji: withEmojis ? '⚖️' : '',
    shortcut: ',w',
    feature: 'weight-tracking',
  }),
  new Page({
    id: 'notes-link',
    url: `file:///Users/shane/.bin/notes/`,
    name: 'Notes',
    emoji: withEmojis ? '🗒️' : '',
    shortcut: ',n',
    feature: 'notes',
  }),
  new Page({
    id: 'reading-list-link',
    url: `${browserExtension}://${extensionId}/template/reading-list.html`,
    name: 'Reading List',
    emoji: withEmojis ? '📚' : '',
    shortcut: ',r',
    feature: 'reading-list',
  }),
  new Page({
    id: 'ratings-link',
    url: `${browserExtension}://${extensionId}/template/ratings.html`,
    name: 'Mood Ratings',
    emoji: withEmojis ? '🌺' : '',
    shortcut: ',m',
    feature: 'mood',
  }),
  new Page({
    id: 'idea-bucket-link',
    url: `${browserExtension}://${extensionId}/template/idea-bucket.html`,
    name: 'Idea Bucket',
    emoji: withEmojis ? '💡' : '',
    shortcut: ',i',
    feature: 'idea-bucket',
  }),
  new Page({
    id: 'review-link',
    url: `${browserExtension}://${extensionId}/template/review.html`,
    name: 'Review',
    emoji: withEmojis ? '🌱' : '',
    shortcut: ',v',
    feature: 'review',
  }),
  new Page({
    id: 'podcasts-link',
    url: `${browserExtension}://${extensionId}/template/podcasts.html`,
    name: 'Podcasts',
    emoji: withEmojis ? '🎧' : '',
    shortcut: ',p',
    feature: 'podcasts',
  }),
  new Page({
    id: 'food-link',
    url: `${browserExtension}://${extensionId}/template/meals.html`,
    name: 'Nutrition',
    emoji: withEmojis ? '🥗' : '',
    shortcut: ',f',
    feature: 'food',
  }),
  new Page({
    id: 'kanban-link',
    url: `${browserExtension}://${extensionId}/template/kanban.html`,
    name: 'Kanban',
    emoji: withEmojis ? '🦘' : '',
    shortcut: ',k',
    feature: 'kanban',
  }),
  new Page({
    id: 'kanban-week-link',
    url: `${browserExtension}://${extensionId}/template/kanban.html?type=WEEK`,
    name: 'Kanban Week',
    emoji: withEmojis ? '🗽' : '',
    shortcut: ',kw',
    feature: 'kanban',
  }),
  new Page({
    id: 'version-catalogue-link',
    url: `${browserExtension}://${extensionId}/template/version-catalogue.html`,
    name: 'Version Catalogue',
    emoji: withEmojis ? '🗂️' : '',
    shortcut: ',k',
    feature: 'version-catalogue',
  }),
  new Page({
    id: 'books-list-link',
    url: `${browserExtension}://${extensionId}/template/books-list.html`,
    name: 'Books List',
    emoji: withEmojis ? '📔' : '',
    shortcut: ',e',
    feature: 'books',
  }),
  new Page({
    id: 'reading-goals-link',
    url: `${browserExtension}://${extensionId}/template/reading-goals.html`,
    name: 'Reading Goals',
    emoji: withEmojis ? '👓' : '',
    shortcut: ',rg',
    feature: 'books',
  }),
  new Page({
    id: 'year-mood-link',
    url: `${browserExtension}://${extensionId}/template/year-mood.html`,
    name: 'Year of Mood',
    emoji: withEmojis ? '😀' : '',
    shortcut: ',ym',
    feature: 'mood',
  }),
  new Page({
    id: 'quarter-review-link',
    url: `${browserExtension}://${extensionId}/template/review.html?type=YEAR&name="Quarter1"`,
    name: 'Quarterly Review',
    emoji: withEmojis ? '🍀' : '',
    shortcut: ',q',
    feature: 'review',
    clickHandler: function (event) {
      event.preventDefault()

      const quarterNumber = prompt('Enter the quarter number:')
      if (quarterNumber) {
        window.location.href = `${browserExtension}://${extensionId}/template/review.html?type=YEAR&name=Quarter${quarterNumber}`
      }
    },
  }),
]

function targetNote() {
  const note = document.getElementById('note')
  const important = importantTodos()
    .then(mapWithDueDate)
    .then(val => {
      if (!!val) {
        note.innerHTML = val
      }
    })
}

function addShortcuts() {
  let keySequence = []
  document.addEventListener('keydown', event => {
    keySequence.push(event.key)

    if (keySequence.join('') === 'gt') {
      const category = `Week ${currentWeekNumber()}`
      const selectElement = document.getElementById('category-input')
      selectElement.value = category
      keysPressed = {}
      keySequence = []
      refreshTodos()
    }

    if (keySequence.length > 2) {
      keySequence = []
    }
  })
}

function toggleTimerVisibility(show) {
  const timer = document.getElementById('timer')
  if (show) {
    timer.classList.add('visible')
  } else {
    timer.classList.remove('visible')
  }
}

function showCurrentlyListening() {
  document.getElementById('spotify-widget')?.classList.remove('hidden')
}

function hideCurrentlyListening() {
  document.getElementById('spotify-widget')?.classList.add('hidden')
}

function fetchCurrentlyPlaying() {
  return api(spotifyCurrentlyPlayingEndpoint, {
    method: 'GET',
    headers: headers,
  })
    .then(response => {
      if (response.status === 200) {
        showCurrentlyListening()
        return response.json()
      } else {
        hideCurrentlyListening()
      }
    })
    .then(data => {
      if (!!data) {
        const trackName = data.name || 'Unknown Track'
        const artistName = data.artists.map(artist => artist.name).join(', ') || 'Unknown Artist'
        const albumName = data.album.name || 'Unknown Album'
        const albumArtUrl = data.album.images
          ? data.album.images.reduce((closest, image) => {
              const currentDiff = Math.abs(image.height - 60) + Math.abs(image.width - 60)
              const closestDiff = Math.abs(closest.height - 60) + Math.abs(closest.width - 60)
              return currentDiff < closestDiff ? image : closest
            }).url
          : '../img/placeholder.png'

        document.getElementById('track-title').textContent = trackName
        document.getElementById('artist-name').textContent = artistName
        document.getElementById('album-title').textContent = albumName
        const albumArtImg = document.getElementById('album-art-img')
        albumArtImg.src = albumArtUrl
        albumArtImg.style.width = '60px'
        albumArtImg.style.height = '60px'
      } else {
        hideCurrentlyListening()
      }
    })
}

window.onload = function () {
  getPreferences().then(processPreferences).then(loadTagFilters).then(addTodoListener)
  // Shift + click drag
  addTodoDragToSelectListener()
  if (importantTodosEnabled) {
    targetNote()
  }
  if (spendTrackingEnabled) {
    getTotalMonthSpend()
  }
  if (quotesEnabled) {
    loadJSon()
  }
  if (timerEnabled) {
    updateTaskButton(false)
    getRunningTask()
  }
  addShortcuts()
  if (spotifyEnabled && showCurrentPlayingTrackEnabled) {
    fetchCurrentlyPlaying()
    setInterval(fetchCurrentlyPlaying, 10000)
  }
  if (timerEnabled) {
    toggleTimerVisibility(true)
  }
  const enabledPages = pages.filter(page => features.get(page.feature)?.enabled === true)
  enabledPages.forEach(page => page.init())
  const eventDates = getEventStartAndEndDates()
  getEvents(eventDates['start'], eventDates['end'])
  categories()
  const weeksUsed = deathCountdown()
  let clicked = false
  document.getElementById('deathCountdown').addEventListener('click', () => {
    if (!clicked) {
      createGrid(52, 81, weeksUsed)
      document.getElementById('grid-container').style = 'display: grid'
      clicked = true
    } else {
      // This is noddy
      document.getElementById('grid-container').style = 'display: none'
    }
  })
  todoForm()
}
