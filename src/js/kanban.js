const YEAR_AND_MONTH_DISPLAY = true
const COLUMNS = 5
let originalColumn = null
let originalIndex = -1
let draggedTodo = null

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

// TODO in the future remove any colours that are set by the user for given tags
const DEFAULT_TAG_COLOURS = new CircularQueue(['red', 'yellow', 'green', 'cyan'])

TAG_COLOURS.set('programming', '#00ffff')
TAG_COLOURS.set('reading', '#1abf1a')
TAG_COLOURS.set('work', '#f47903')
TAG_COLOURS.set('motorbike', '#e7b91b')
TAG_COLOURS.set('admin', '#a78e3a')
TAG_COLOURS.set('house', '#7ee651')
TAG_COLOURS.set('fitness', '#ef1add')
TAG_COLOURS.set('learning', '#7d1aef')

function getTagColour(tag) {
  let colour = TAG_COLOURS.get(tag)

  if (!colour) {
    colour = DEFAULT_TAG_COLOURS.get()
    TAG_COLOURS.set(tag, colour)
  }

  return colour
}

function currentWeekNumber() {
  const currentDate = new Date()
  const startDate = new Date(currentDate.getFullYear(), 0, 1)
  const days = Math.ceil((currentDate - startDate) / (24 * 60 * 60 * 1000))

  const weekNumber = Math.max(1, Math.ceil(days / 7))

  return weekNumber
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
      // TODO maybe we don't need this
      // refreshTodos()
    }
  })
}

function todosBacklog() {
  const endpoint = `${todosEndpoint}?category=Backlog`
  return api(endpoint, {
    method: 'GET',
    headers: headers,
  }).then(response => response.json())
}

/**
 * Updated todosByCategory:
 * - If the API returns a non-200 status, return a dummy todo with the queried category.
 * - If the API returns a 200, then:
 *    • For special categories (i.e. ones that do not start with "Week"), we override the
 *      todo.category to be the queried category. This ensures that even if the API
 *      returns todos with a week label (e.g. "Week 50"), the UI will group them
 *      under the expected column (e.g. "Yearly 2025" or "March").
 *    • If no todo in the (possibly remapped) list has the queried category, we add a dummy todo.
 */
function todosByCategory(category) {
  const endpoint =
    !!category && category !== 'all' ? `${todosEndpoint}?category=${category}` : todosEndpoint
  return api(endpoint, {
    method: 'GET',
    headers: headers,
    // If we have no response, create a todo that is just a category
    // that way we render the column
  }).then(response => {
    if (response.status !== 200) {
      return !!category ? [{ category: category }] : []
    }
    return response.json().then(data => {
      // For special (non-week) categories, ensure all todos have the queried category.
      if (category && !category.startsWith('Week')) {
        data = data.map(todo => ({ ...todo, category: category }))
      }
      // Always ensure that at least one todo carries the queried category.
      if (!data.some(todo => todo.category === category)) {
        data.unshift({ category: category })
      }
      return data
    })
  })
}

function todos(type) {
  if (!!type) {
    let startWeekNumber = currentWeekNumber()
    let promises = []

    if (YEAR_AND_MONTH_DISPLAY) {
      const now = new Date()
      const currentYear = `Yearly ${now.getFullYear().toString()}`
      // Using 'en-GB' for English month names
      const currentMonth = now.toLocaleString('en-GB', { month: 'long' })

      // Year category first, then month category
      promises.push(todosByCategory(currentYear))
      promises.push(todosByCategory(currentMonth))
    }

    for (let i = 0; i < COLUMNS; i++) {
      const weekNumber = startWeekNumber + i
      const category = `Week ${weekNumber}`
      promises.push(todosByCategory(category))
    }

    // Flatten the results so displayBy gets a single array of todos.
    return Promise.all(promises).then(results => results.flat())
  }
  const category = `Week ${currentWeekNumber()}`
  return todosByCategory(category)
}

function displayBy(type, todos, backlog) {
  const board = document.getElementById('kanban-board')
  board.innerHTML = '' // Clear current board

  let groups = {}

  if (type === 'categories') {
    groups = groupByCategories(todos)
  } else if (type === 'tags') {
    groups = groupByTags(todos)
  }

  addColumn({ backlog: backlog }, 'backlog', board)

  for (let groupName in groups) {
    addColumn(groups, groupName, board)
  }
}

function addColumn(groups, groupName, board) {
  const column = document.createElement('div')
  column.className = 'column'
  column.setAttribute('data-group', groupName)
  column.addEventListener('dragover', handleDragOver)
  column.addEventListener('drop', handleDrop)

  const tagElement = document.createElement('span')
  tagElement.title = groupName
  const colour = getTagColour(groupName)

  tagElement.className = 'tag-box'
  tagElement.style.backgroundColor = colour

  const h2 = document.createElement('h2')
  h2.innerHTML = groupName
  h2.appendChild(tagElement)
  column.appendChild(h2)

  groups[groupName].forEach(todo => {
    // We have blank todos when the category
    // is empty, we don't want to render these cards,
    // but we do want to render the column
    if (!!todo.todo) {
      const card = document.createElement('div')
      card.className = 'card'
      card.draggable = true
      card.textContent = todo.todo
      card.setAttribute('data-id', todo.id)
      card.setAttribute('data', JSON.stringify(todo))
      card.addEventListener('dragstart', handleDragStart)
      column.appendChild(card)
    }
  })

  board.appendChild(column)
}

function groupByCategories(todos) {
  return todos.reduce((acc, todo) => {
    if (!acc[todo.category]) {
      acc[todo.category] = []
    }
    acc[todo.category].push(todo)
    return acc
  }, {})
}

function groupByTags(todos) {
  const tagGroups = {}
  todos.forEach(todo => {
    todo.tags.forEach(tag => {
      if (!tagGroups[tag]) {
        tagGroups[tag] = []
      }
      tagGroups[tag].push(todo)
    })
  })
  return tagGroups
}

function handleDragStart(event) {
  draggedTodo = event.target
  originalColumn = draggedTodo.parentElement // Store the original column
  originalIndex = Array.from(originalColumn.children).indexOf(draggedTodo) // Store the original index
  event.dataTransfer.setData('text/plain', event.target.getAttribute('data-id'))
  setTimeout(() => {
    event.target.style.display = 'none' // Hide the todo being dragged
  }, 0)
}

function handleDrop(event) {
  event.preventDefault()
  const targetColumn = event.currentTarget
  const groupName = targetColumn.getAttribute('data-group')
  const todoId = event.dataTransfer.getData('text/plain')

  if (draggedTodo) {
    const todo = JSON.parse(draggedTodo.getAttribute('data'))
    const isWeekColumn = groupName.startsWith('Week') || groupName === 'backlog'

    if (isWeekColumn && todo.category === groupName) {
      restoreTodoToOriginalPosition()
      return
    }

    if (!isWeekColumn && todo.tags.includes(groupName)) {
      restoreTodoToOriginalPosition()
      return
    }

    draggedTodo.style.display = 'block'
    targetColumn.appendChild(draggedTodo)

    // Pass along the todo so we can decide whether to update or create a linked copy
    handleTodoMove(todoId, groupName, todo)
  }
}

function restoreTodoToOriginalPosition() {
  if (originalColumn && originalIndex >= 0) {
    // Restore the todo to its original position within the original column
    originalColumn.insertBefore(draggedTodo, originalColumn.children[originalIndex])
    draggedTodo.style.display = 'block'
  }
}

function handleDragEnd() {
  draggedTodo = null
}

/**
 * Updated handleTodoMove:
 * - When dropping on the backlog, update the existing todo’s category.
 * - Otherwise, if the original todo is from a special category (i.e. not a week or backlog todo),
 *   create a new, linked todo with the new category.
 * - For normal week todos, simply update the category.
 */
function handleTodoMove(todoId, groupName, todo) {
  if (groupName === 'backlog') {
    // Moving to backlog: simply update the category.
    todo.category = groupName
    update(todo, false, false)
    return
  }

  // Determine if the dragged todo is from a special category.
  // (Here, special means its category does not start with 'Week' and is not 'Backlog' (or 'backlog').)
  const isSpecial = !(
    todo.category.startsWith('Week') ||
    todo.category === 'Backlog' ||
    todo.category === 'backlog'
  )

  if (isSpecial) {
    // Instead of moving the original todo, create a new linked todo with the new category.
    const newTodo = { ...todo, category: groupName }
    link(newTodo, false, false)
  } else {
    // For normal week todos, update the category.
    todo.category = groupName
    update(todo, false, false)
  }
}

function handleDragOver(event) {
  event.preventDefault()
}

/**
 * Creates a linked todo by issuing a PATCH request.
 * The linked todo is a new todo with the desired category.
 */
function link(todo, dontRefresh, dontShowSuccessMessage) {
  if (!!dontShowSuccessMessage) {
    todo.noSuccessFeedback = true
  }
  return api(linkTodosEndpoint, {
    method: 'PATCH',
    headers: headers,
    body: JSON.stringify(todo),
  })
}

function getQueryParams() {
  const params = {}
  const queryString = window.location.search
  if (queryString) {
    const pairs = queryString.substring(1).split('&')
    pairs.forEach(pair => {
      const [key, value] = pair.split('=')
      params[decodeURIComponent(key)] = decodeURIComponent(value || '')
    })
  }
  return params
}

window.onload = function () {
  // TODO support month
  const params = getQueryParams()
  const displayType = params.type === 'WEEK' ? 'categories' : 'tags'

  todos(params.type).then(todos =>
    todosBacklog().then(backlog => displayBy(displayType, todos, backlog)),
  )
}
