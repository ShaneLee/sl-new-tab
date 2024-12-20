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

function todosByCategory(category) {
  const endpoint =
    !!category && category !== 'all' ? `${todosEndpoint}?category=${category}` : todosEndpoint
  return api(endpoint, {
    method: 'GET',
    headers: headers,
    // If we have no response, create a todo that is just a category
    // that way we render the column
  }).then(response =>
    response.status === 200 ? response.json() : !!category ? [{ category: category }] : [],
  )
}

function todos(type) {
  if (!!type) {
    let startWeekNumber = currentWeekNumber()
    let promises = []

    for (let i = 0; i < COLUMNS; i++) {
      const weekNumber = startWeekNumber + i
      const category = `Week ${weekNumber}`
      const promise = todosByCategory(category)
      promises.push(promise)
    }

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

    handleTodoMove(todoId, groupName)
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

function handleDragOver(event) {
  event.preventDefault()
}

function handleTodoMove(todoId, groupName, todo) {
  const isWeekColumn = groupName.startsWith('Week') || groupName === 'backlog'

  if (isWeekColumn) {
    const newCategory = groupName
    todo.category = newCategory
    update(todo, false, false)
  } else {
    // TODO do I want to add to the tags and duplicate or move the tags?
    console.log(`Todo ${todoId} moved to ${groupName}`)
  }
}

function handleDragEnd() {
  draggedTodo = null
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
