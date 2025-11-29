let contextMenu = null
let selectedElement = null
let stageOffsetX = 0,
  stageOffsetY = 0
let isPanningStage = false,
  panStartX = 0,
  panStartY = 0
let selectedTodo = null
let TODOS_SET = new Set()
const DEFAULT_TAG_COLOURS = new CircularQueue(['red', 'yellow', 'green', 'cyan'])
const TAG_COLOURS = new Map()
const withEmojis = true
const uploadingEnabled = false

let currentPlannerName = '2026'
const PLANNERS_STORAGE_KEY = 'planner-names'
const PLANNER_ELEMENTS_STORAGE_PREFIX = 'planner-elements-'

const THIS_WEEK_CATEGRORY = 'This Week'
const THIS_MONTH_CATEGRORY = 'This Month'

const SPECIAL_CATEGORIES = [THIS_MONTH_CATEGRORY, THIS_WEEK_CATEGRORY]

function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  const metadata = {
    category: 'planner',
    fileName: $`planner/${file.name}`,
    notes: `Source: ${url}`,
  }

  const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  formData.append('metadata', metadataBlob)

  return fetch(fileUploadEndpoint, {
    method: 'POST',
    headers: noContentTypeHeaders,
    body: formData,
  }).then(response => {
    if (!response.ok) throw new Error('Upload failed')
    return response.json()
  })
}

function uploadFileByUrl(url) {
  if (uploadingEnabled === false) {
    return Promise.resolve({
      filePath: url,
    })
  }
  const name = basename(url)
  const metadata = {
    category: 'planner',
    fileName: `${basename(name)}`,
    notes: `Source: ${url}`,
  }

  const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  const formData = new FormData()
  formData.append('url', url)
  formData.append('metadata', metadataBlob)

  return fetch(fileUploadUrlEndpoint, {
    method: 'POST',
    headers: noContentTypeHeaders,
    body: formData,
  }).then(response => response?.json())
}

function getFileUrl(filePath) {
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath
  }
  return `${host.replace(':8080', '')}/synco/${filePath}`
}

function getPlannerStorageKey(plannerName) {
  return PLANNER_ELEMENTS_STORAGE_PREFIX + plannerName
}

function getAllPlannerNames() {
  const raw = localStorage.getItem(PLANNERS_STORAGE_KEY)
  if (!raw) return ['2026']
  try {
    return JSON.parse(raw)
  } catch {
    return ['2026']
  }
}

function savePlannerNames(names) {
  localStorage.setItem(PLANNERS_STORAGE_KEY, JSON.stringify(names))
}

function createNewPlanner(plannerName) {
  const names = getAllPlannerNames()
  if (!names.includes(plannerName)) {
    names.push(plannerName)
    savePlannerNames(names)
  }
  currentPlannerName = plannerName
  return plannerName
}

function handleSpecialCategories(category) {
  if (category === THIS_WEEK_CATEGRORY) {
    return `Week ${currentWeekNumber()}`
  }
  if (category === THIS_MONTH_CATEGRORY) {
    return currentMonthName()
  }
  return category
}

function getTodosForCategory(category) {
  category = handleSpecialCategories(category)
  const endpoint = todosForCategoryEndpointFn(category)
  return api(endpoint, {
    method: 'GET',
    headers: headers,
  }).then(response => response?.json())
}

function getCategories() {
  return api(categoriesEndpoint, {
    method: 'GET',
    headers: headers,
  })
    .then(response => response?.json())
    .then(categories => SPECIAL_CATEGORIES.concat(categories))
}

function getTagColour(tag) {
  let colour = TAG_COLOURS.get(tag)

  if (!colour) {
    colour = DEFAULT_TAG_COLOURS.get()
    TAG_COLOURS.set(tag, colour)
  }

  return colour
}

function todoCountString(todo) {
  return `${todo.count}/${!!todo.incrementTarget ? todo.incrementTarget : todo.targetCount}`
}

function complete(todo, dontRefresh) {
  api(completeEndpoint, {
    method: 'PATCH',
    headers: headers,
    body: JSON.stringify(todo),
  }).then(_ => (!!dontRefresh ? null : location.reload()))
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
      location.reload()
    }
  })
}

function deleteTodo(todo, thisInstance, alternateSuccessMessage) {
  api(deleteTodosEndpointFn(thisInstance), {
    successMessage: alternateSuccessMessage ?? '🐸 The task has been deleted',
    failureMessage: '🙉 Oh no! The task failed to delete. Please try again later',
    method: 'DELETE',
    headers: headers,
    body: JSON.stringify(todo),
  }).then(_ => location.reload())
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

function parseLink(str) {
  const urlPattern = /(https?:\/\/[^\s]+)/g
  return str.match(urlPattern) || []
}

function containsLink(str) {
  const urlPattern = /(https?:\/\/[^\s]+)/g
  return urlPattern.test(str)
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

      <!-- Time Estimate -->
      <label for="todo-time-estimate-hours">Time Estimate (Hours)</label>
      <input type="number" id="todo-time-estimate-hours" name="time-esimate-hours" ${
        todo.timeEstimateHours
      }>
      
      <!-- Tags -->
      <label for="todo-tags">Tags</label>
      <input type="text" id="todo-tags" name="tags" value="${(todo.tags || []).join(
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

  document.addEventListener('keydown', handleKeydown)

  return form
}

function showPopupForm(form) {
  document.body.appendChild(form)
  form.style.display = 'block'
}

function hideContextMenu() {
  if (!!contextMenu) {
    contextMenu.style.display = 'none'
    contextMenu = null
  }
}

function showTodoContextMenu(event, todo) {
  event.preventDefault()
  selectedTodo = todo
  contextMenu = document.getElementById('todoContextMenu')
  if (!contextMenu) return

  contextMenu.style.display = 'block'

  const menuWidth = contextMenu.offsetWidth
  const menuHeight = contextMenu.offsetHeight
  let left = event.clientX
  let top = event.clientY

  if (left + menuWidth > window.innerWidth) left = window.innerWidth - menuWidth
  if (top + menuHeight > window.innerHeight) top = window.innerHeight - menuHeight
  top = Math.max(top, 0)

  contextMenu.style.left = `${left}px`
  contextMenu.style.top = `${top}px`
  event.stopPropagation()
}

function renderTodoElement(todo) {
  const li = document.createElement('li')
  li.textContent = todo.todo
  li.dataset.todoId = todo.id
  li.style.padding = '6px 4px'
  li.style.cursor = 'pointer'
  li.style.userSelect = 'none'

  if (todo.complete) {
    li.classList.add('strikethrough')
    li.style.opacity = '0.6'
  }

  const contentDiv = document.createElement('div')
  contentDiv.style.display = 'flex'
  contentDiv.style.justifyContent = 'space-between'
  contentDiv.style.alignItems = 'center'

  const contentText = document.createElement('span')
  contentText.textContent = todo.todo
  if (todo.complete) {
    contentText.classList.add('strikethrough')
  }
  contentText.style.flex = '1'
  contentDiv.appendChild(contentText)

  const rightBoxes = document.createElement('div')
  rightBoxes.style.display = 'flex'
  rightBoxes.style.gap = '4px'
  rightBoxes.style.marginLeft = '8px'

  // Tags
  if (todo.tags && todo.tags.length > 0) {
    todo.tags.forEach(tag => {
      const tagElement = document.createElement('span')
      tagElement.title = tag
      const colour = getTagColour(tag)
      tagElement.className = 'tag-box'
      tagElement.style.backgroundColor = colour
      tagElement.style.padding = '2px 4px'
      tagElement.style.borderRadius = '3px'
      tagElement.style.fontSize = '0.75em'
      if (withEmojis) {
        tagElement.classList.add('emoji')
      }
      rightBoxes.appendChild(tagElement)
    })
  }

  // Count
  if (todo.targetCount != null) {
    const countElement = document.createElement('span')
    countElement.innerHTML = todoCountString(todo)
    countElement.className = 'due-date-box'
    countElement.style.padding = '2px 4px'
    countElement.style.borderRadius = '3px'
    countElement.style.fontSize = '0.75em'
    rightBoxes.appendChild(countElement)
  }

  // Important
  if (todo.important) {
    const importantElement = document.createElement('span')
    importantElement.innerHTML = withEmojis ? '🌟' : '!'
    importantElement.className = 'due-date-box'
    importantElement.style.padding = '2px 4px'
    importantElement.style.fontSize = '0.75em'
    if (withEmojis) {
      importantElement.classList.add('emoji')
    }
    rightBoxes.appendChild(importantElement)
  }

  // Due date
  if (todo.dueDate && !todo.complete) {
    const dueDateElement = document.createElement('span')
    const currentDate = new Date()
    const date = new Date(todo.dueDate)

    currentDate.setHours(0, 0, 0, 0)
    const midnightDueDate = new Date(todo.dueDate)
    midnightDueDate.setHours(0, 0, 0, 0)

    const timeString = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })

    const daysDifference = (midnightDueDate - currentDate) / (1000 * 60 * 60 * 24)
    let dateString

    if (daysDifference === 0) {
      dateString = timeString
    } else if (daysDifference === 1) {
      dateString = `Tomorrow ${timeString}`
    } else if (daysDifference > 1 && daysDifference < 7) {
      dateString = `${date.toLocaleDateString('en-US', { weekday: 'short' })} ${timeString}`
    } else {
      dateString = date.toISOString().split('T')[0]
    }

    dueDateElement.innerHTML = dateString
    dueDateElement.className = 'due-date-box'
    if (todo.due) {
      dueDateElement.classList.add('highlighted-due')
    }
    dueDateElement.style.padding = '2px 4px'
    dueDateElement.style.fontSize = '0.75em'
    rightBoxes.appendChild(dueDateElement)
  }

  contentDiv.appendChild(rightBoxes)
  li.innerHTML = ''
  li.appendChild(contentDiv)

  // Click handler for completing or incrementing count
  li.addEventListener('click', e => {
    e.stopPropagation()
    if (todo.complete) {
      return
    }
    if (todo.targetCount != null) {
      const existingCountInput = document.getElementById('countInput')
      if (existingCountInput) {
        existingCountInput.focus()
        return
      }
      const countInput = document.createElement('input')
      countInput.type = 'number'
      countInput.id = 'countInput'
      countInput.className = 'countInput'
      countInput.value = todo.count
      countInput.addEventListener('keypress', event => {
        if (event.key === 'Enter') {
          const newCount = parseInt(countInput.value, 10)
          todo.count = newCount
          todo.todo = todo.todo.replace(/<\d+>/, `<${newCount}>`)
          update(todo, true).then(val => {
            if (
              newCount >= todo.targetCount ||
              (todo.incrementTarget != null && newCount >= todo.incrementTarget)
            ) {
              complete(todo, true)
              li.style = 'display: none;'
            }
          })
          contentDiv.removeChild(countInput)
        }
      })

      contentDiv.appendChild(countInput)
      countInput.focus()
      return
    }

    complete(todo, true)
    li.style = 'display: none;'
    return false
  })

  // Right-click context menu
  li.addEventListener('contextmenu', ev => showTodoContextMenu(ev, todo))

  return li
}

document.addEventListener('DOMContentLoaded', async function () {
  const stage = document.getElementById('stage')
  if (!stage) {
    return
  }

  stage.style.width = '2000px'
  stage.style.height = '1500px'
  stage.style.overflow = 'auto'
  stage.style.position = 'relative'
  stage.style.cursor = 'grab'

  let elements = loadElements()

  function loadElements() {
    const raw = localStorage.getItem(getPlannerStorageKey(currentPlannerName))
    if (!raw) return []
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  }

  function saveElements() {
    localStorage.setItem(getPlannerStorageKey(currentPlannerName), JSON.stringify(elements))
  }

  // Update page title
  function updatePageTitle() {
    document.querySelector('h2').textContent = `${currentPlannerName} Planner`
  }

  // Planner selector
  const plannerSelect = document.getElementById('plannerSelect')
  const createPlannerBtn = document.getElementById('createPlannerBtn')

  function updatePlannerSelect() {
    const plannerNames = getAllPlannerNames()
    plannerSelect.innerHTML = ''
    plannerNames.forEach(name => {
      const option = document.createElement('option')
      option.value = name
      option.textContent = name
      option.selected = name === currentPlannerName
      plannerSelect.appendChild(option)
    })
  }

  updatePlannerSelect()

  plannerSelect.addEventListener('change', e => {
    currentPlannerName = e.target.value
    elements = loadElements()
    updatePageTitle()
    renderAll()
  })

  createPlannerBtn.addEventListener('click', () => {
    const plannerName = prompt('Enter new planner name:')
    if (plannerName && plannerName.trim()) {
      createNewPlanner(plannerName.trim())
      updatePlannerSelect()
      plannerSelect.value = plannerName.trim()
      elements = []
      saveElements()
      updatePageTitle()
      renderAll()
    }
  })

  updatePageTitle()

  // Stage panning
  stage.addEventListener('pointerdown', e => {
    if (e.target !== stage) return
    isPanningStage = true
    panStartX = e.clientX - stageOffsetX
    panStartY = e.clientY - stageOffsetY
    stage.style.cursor = 'grabbing'
  })

  window.addEventListener('pointermove', e => {
    if (!isPanningStage) return
    stageOffsetX = e.clientX - panStartX
    stageOffsetY = e.clientY - panStartY
    stage.scrollLeft = -stageOffsetX
    stage.scrollTop = -stageOffsetY
  })

  window.addEventListener('pointerup', () => {
    if (isPanningStage) {
      isPanningStage = false
      stage.style.cursor = 'grab'
    }
  })

  // Context Menu Handlers
  function showElementContextMenu(event, el) {
    event.preventDefault()
    selectedElement = el
    contextMenu = document.getElementById('contextMenu')
    if (!contextMenu) return

    contextMenu.style.display = 'block'

    const menuWidth = contextMenu.offsetWidth
    const menuHeight = contextMenu.offsetHeight
    let left = event.clientX
    let top = event.clientY

    if (left + menuWidth > window.innerWidth) left = window.innerWidth - menuWidth
    if (top + menuHeight > window.innerHeight) top = window.innerHeight - menuHeight
    top = Math.max(top, 0)

    contextMenu.style.left = `${left}px`
    contextMenu.style.top = `${top}px`
    event.stopPropagation()
  }

  window.addEventListener('click', hideContextMenu)

  // Render Elements
  function renderAll() {
    stage.innerHTML = ''
    elements.forEach(el => renderElement(el))
  }

  async function renderElement(el) {
    const card = document.createElement('div')
    card.className = 'card'
    card.style.left = el.x + 'px'
    card.style.top = el.y + 'px'
    card.style.zIndex = el.z || 2
    card.style.width = el.width || '300px'
    card.style.height = el.height || '200px'
    card.dataset.id = el.id
    card.style.overflow = 'auto'
    card.style.resize = 'none'
    card.style.minWidth = '150px'
    card.style.minHeight = '100px'

    // Title bar
    const titleBar = document.createElement('div')
    titleBar.className = 'title'
    const h = document.createElement('h3')
    h.textContent = el.title || ''
    const controls = document.createElement('div')
    controls.className = 'controls'
    const handle = document.createElement('div')
    handle.className = 'handle'
    handle.textContent = '⋮⋮'
    controls.appendChild(handle)
    titleBar.appendChild(h)
    titleBar.appendChild(controls)
    card.appendChild(titleBar)

    card.addEventListener('contextmenu', e => showElementContextMenu(e, el))

    // Resize handle
    const resizeHandle = document.createElement('div')
    resizeHandle.style.width = '12px'
    resizeHandle.style.height = '12px'
    resizeHandle.style.background = 'var(--highlighted-todo-color)'
    resizeHandle.style.position = 'absolute'
    resizeHandle.style.right = '2px'
    resizeHandle.style.bottom = '2px'
    resizeHandle.style.cursor = 'se-resize'
    card.appendChild(resizeHandle)

    resizeHandle.addEventListener('pointerdown', e => {
      e.stopPropagation()
      let startX = e.clientX,
        startY = e.clientY
      let startWidth = card.offsetWidth,
        startHeight = card.offsetHeight

      function doResize(ev) {
        card.style.width = Math.max(150, startWidth + ev.clientX - startX) + 'px'
        card.style.height = Math.max(100, startHeight + ev.clientY - startY) + 'px'
      }

      function stopResize() {
        el.width = card.style.width
        el.height = card.style.height
        saveElements()
        window.removeEventListener('pointermove', doResize)
        window.removeEventListener('pointerup', stopResize)
      }

      window.addEventListener('pointermove', doResize)
      window.addEventListener('pointerup', stopResize)
    })

    // Content
    if (el.type === 'note') {
      const p = document.createElement('p')
      p.textContent = el.content || ''
      card.appendChild(p)
    } else if (el.type === 'list') {
      const ul = document.createElement('ul')
      ul.style.listStyle = 'none'
      ul.style.margin = '0'
      ul.style.padding = '0'
      let todos = []
      try {
        todos = (await getTodosForCategory(el.category || 'Week 48')) || []
      } catch (e) {
        console.error('Failed to load backend todos', e)
      }

      todos.forEach(t => {
        const li = renderTodoElement(t)
        ul.appendChild(li)
      })
      card.appendChild(ul)
    } else if (el.type === 'image') {
      if (el.filePath) {
        const img = document.createElement('img')
        img.src = getFileUrl(el.filePath)
        img.className = 'responsive'
        img.style.maxWidth = '100%'
        img.style.maxHeight = '100%'
        img.style.objectFit = 'contain'
        card.appendChild(img)
      }
    } else if (el.type === 'video') {
      if (el.filePath) {
        const vid = document.createElement('video')
        vid.src = getFileUrl(el.filePath)
        vid.controls = true
        vid.className = 'responsive'
        vid.style.maxWidth = '100%'
        vid.style.maxHeight = '100%'
        card.appendChild(vid)
      }
    }

    stage.appendChild(card)
    makeDraggable(card, handle, el.id)
  }

  // Draggable
  function makeDraggable(card, handle, id) {
    let dragging = false,
      startX = 0,
      startY = 0,
      ox = 0,
      oy = 0

    handle.addEventListener('pointerdown', e => {
      e.stopPropagation()
      handle.setPointerCapture(e.pointerId)
      dragging = true
      startX = e.clientX
      startY = e.clientY
      ox = parseInt(card.style.left || 0, 10)
      oy = parseInt(card.style.top || 0, 10)
    })

    window.addEventListener('pointermove', e => {
      if (!dragging) return
      card.style.left = ox + (e.clientX - startX) + 'px'
      card.style.top = oy + (e.clientY - startY) + 'px'
    })

    window.addEventListener('pointerup', e => {
      if (!dragging) return
      dragging = false
      try {
        handle.releasePointerCapture(e.pointerId)
      } catch {}
      const idx = elements.findIndex(el => el.id === id)
      if (idx >= 0) {
        elements[idx].x = parseInt(card.style.left || 0, 10)
        elements[idx].y = parseInt(card.style.top || 0, 10)
        saveElements()
      }
    })
  }

  // Toolbar
  function generateId() {
    return 'id-' + Math.random().toString(36).substr(2, 9)
  }

  const typeSelect = document.getElementById('typeSelect')
  const categorySelect = document.getElementById('categorySelect')

  typeSelect.addEventListener('change', async () => {
    if (typeSelect.value === 'list') {
      categorySelect.style.display = 'inline-block'
      try {
        const cats = (await getCategories()) || []
        categorySelect.innerHTML = '<option value="">Select category</option>'
        cats.forEach(c => {
          const opt = document.createElement('option')
          opt.value = c
          opt.textContent = c
          categorySelect.appendChild(opt)
        })
      } catch (e) {
        console.error(e)
      }
    } else {
      categorySelect.style.display = 'none'
    }
  })

  document.getElementById('addBtn').addEventListener('click', () => {
    const title = document.getElementById('newTitle')?.value || 'Untitled'
    const type = typeSelect.value
    const el = { id: generateId(), type, title, x: 40, y: 40, width: '300px', height: '200px' }
    if (type === 'note') el.content = 'New note...'
    if (type === 'list') el.category = categorySelect.value || 'Week 48'
    elements.push(el)
    saveElements()
    renderAll()
  })

  const fileInput = document.getElementById('fileInput')
  fileInput?.addEventListener('change', async e => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const response = await uploadFile(file)
      const fileData = response

      const type = file.type.startsWith('image') ? 'image' : 'video'
      const el = {
        id: generateId(),
        type,
        title: file.name,
        x: 40,
        y: 40,
        width: '300px',
        height: '200px',
        filePath: fileData.filePath, // Store filePath instead of src
      }
      elements.push(el)
      saveElements()
      renderAll()
      fileInput.value = ''
    } catch (error) {
      console.error('File upload error:', error)
      alert('Failed to upload file')
    }
  })

  const uploadByUrlBtn = document.getElementById('uploadByUrlBtn')
  uploadByUrlBtn?.addEventListener('click', async () => {
    const url = prompt('Enter image or video URL:')
    if (!url) return

    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)
    const isVideo = /\.(mp4|webm|ogg|mov|mkv)$/i.test(url)

    if (!isImage && !isVideo) {
      alert('Please enter a valid image or video URL')
      return
    }

    try {
      const response = await uploadFileByUrl(url)
      const fileData = response

      const type = isImage ? 'image' : 'video'
      const fileName = url.split('/').pop() || 'untitled'

      const el = {
        id: generateId(),
        type,
        title: fileName,
        x: 40,
        y: 40,
        width: '300px',
        height: '200px',
        filePath: fileData.filePath, // Store filePath from backend response
      }
      elements.push(el)
      saveElements()
      renderAll()
    } catch (error) {
      console.error('URL upload error:', error)
      alert('Failed to upload file from URL')
    }
  })

  document.getElementById('exportBtn')?.addEventListener('click', () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(elements))
    const dlAnchor = document.createElement('a')
    dlAnchor.setAttribute('href', dataStr)
    dlAnchor.setAttribute('download', `planner-${currentPlannerName}-export.json`)
    dlAnchor.click()
  })

  document.getElementById('importBtn')?.addEventListener('click', () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = e => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = ev => {
        try {
          elements = JSON.parse(ev.target.result)
          saveElements()
          renderAll()
        } catch {
          alert('Invalid JSON')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  })

  document.getElementById('clearBtn')?.addEventListener('click', () => {
    if (confirm('Clear all elements in this planner?')) {
      elements = []
      saveElements()
      renderAll()
    }
  })

  // Context Menu Actions
  document.getElementById('deleteElementAction')?.addEventListener('click', () => {
    if (selectedElement) {
      elements = elements.filter(el => el.id !== selectedElement.id)
      saveElements()
      renderAll()
      hideContextMenu()
    }
  })

  document.getElementById('editElementAction')?.addEventListener('click', () => {
    if (selectedElement) {
      const newTitle = prompt('Edit element title', selectedElement.title || '')
      if (newTitle !== null) selectedElement.title = newTitle
      saveElements()
      renderAll()
      hideContextMenu()
    }
  })

  // Todo Context Menu Actions
  const deleteThisInstanceAction = document.getElementById('deleteThisInstanceAction')
  const deleteAllInstancesAction = document.getElementById('deleteAllInstancesAction')
  const editTodoAction = document.getElementById('editTodoAction')
  const editDueDateAction = document.getElementById('editDueDateAction')
  const removeDueDateAction = document.getElementById('removeDueDateAction')
  const openLinkAction = document.getElementById('openLinkAction')
  const markImportantAction = document.getElementById('markImportantAction')
  const addTagAction = document.getElementById('addTagAction')
  const addNotesAction = document.getElementById('addNotesAction')
  const openInSearchEngineAction = document.getElementById('openInSearchEngineAction')
  const changeCategoryAction = document.getElementById('changeCategoryAction')

  if (deleteThisInstanceAction) {
    deleteThisInstanceAction.addEventListener('click', function () {
      deleteTodo(selectedTodo, true)
      selectedTodo = null
      hideContextMenu()
      renderAll()
    })
  }

  if (deleteAllInstancesAction) {
    deleteAllInstancesAction.addEventListener('click', function () {
      deleteTodo(selectedTodo, false)
      selectedTodo = null
      hideContextMenu()
      renderAll()
    })
  }

  if (editTodoAction) {
    editTodoAction.addEventListener('click', function () {
      const todo = selectedTodo
      const todoForm = createTodoEditForm(todo, update)
      showPopupForm(todoForm)
      selectedTodo = null
      hideContextMenu()
    })
  }

  if (editDueDateAction) {
    editDueDateAction.addEventListener('click', function () {
      const todo = selectedTodo
      const dueDate = todo.dueDate

      const datePicker = document.createElement('input')
      datePicker.type = 'date'

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

      const rect = editDueDateAction.getBoundingClientRect()
      datePicker.style.position = 'absolute'
      datePicker.style.top = window.scrollY + rect.bottom + 'px'
      datePicker.style.left = window.scrollX + rect.left + 'px'

      datePicker.addEventListener('change', function () {
        const selectedDate = new Date(datePicker.value)
        selectedTodo.dueDate = selectedDate
        update(selectedTodo)
        document.body.removeChild(datePicker)
        selectedTodo = null
        hideContextMenu()
        renderAll()
      })

      function clickOutsideDatePickerHandler(event) {
        if (!datePicker.contains(event.target) && event.target !== editDueDateAction) {
          document.removeEventListener('click', clickOutsideDatePickerHandler)
          document.body.removeChild(datePicker)
          selectedTodo = null
          hideContextMenu()
        }
      }

      document.addEventListener('click', clickOutsideDatePickerHandler)
      document.body.appendChild(datePicker)
    })
  }

  if (removeDueDateAction) {
    removeDueDateAction.addEventListener('click', function () {
      const todo = selectedTodo
      const dueDate = todo.dueDate
      if (!!dueDate) {
        todo.dueDate = null
        update(todo)
      }
      selectedTodo = null
      hideContextMenu()
      renderAll()
    })
  }

  if (openLinkAction) {
    openLinkAction.addEventListener('click', function () {
      const todo = selectedTodo
      const link = parseLink(todo.todo)
      window.open(link, '_blank')
      selectedTodo = null
      hideContextMenu()
    })
  }

  if (markImportantAction) {
    markImportantAction.addEventListener('click', function () {
      const todo = selectedTodo
      todo.important = true
      update(todo)
      selectedTodo = null
      hideContextMenu()
      renderAll()
    })
  }

  if (addTagAction) {
    addTagAction.addEventListener('click', function () {
      const tags = prompt('Enter the new tag(s) comma separated:')
      const todo = addTags(selectedTodo, tags)
      if (!!tags) {
        update(todo)
      }
      selectedTodo = null
      hideContextMenu()
      renderAll()
    })
  }

  if (addNotesAction) {
    addNotesAction.addEventListener('click', function () {
      const todo = selectedTodo
      const notes = prompt('Enter the notes:')
      if (!!notes) {
        todo.notes = notes
        update(todo)
      }
      selectedTodo = null
      hideContextMenu()
      renderAll()
    })
  }

  if (openInSearchEngineAction) {
    openInSearchEngineAction.addEventListener('click', function () {
      const todo = selectedTodo
      const concatWithPlus = s => s.replace(' ', '+')
      const searchEngineFn = q => `https://www.google.com/search?q=${concatWithPlus(q)}`
      window.open(searchEngineFn(todo.todo), '_blank')
      selectedTodo = null
      hideContextMenu()
    })
  }

  if (changeCategoryAction) {
    changeCategoryAction.addEventListener('click', function () {
      const todo = selectedTodo
      const category = prompt('Enter the new category:')
      if (!!category) {
        todo.category = category
        update(todo)
      }
      selectedTodo = null
      hideContextMenu()
      renderAll()
    })
  }

  renderAll()
})
