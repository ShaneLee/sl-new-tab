let contextMenu = null
let selectedElement = null

function getTodosForCategory(category) {
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
  }).then(response => response?.json())
}

document.addEventListener('DOMContentLoaded', async function () {
  console.log('Planner2026 integrated')

  const stage = document.getElementById('stage')
  if (!stage) {
    console.warn('Planner stage not found — ensure planner HTML loaded')
    return
  }

  const STORAGE_KEY = 'planner2026-elements-v1'
  let elements = loadElements()

  function loadElements() {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  }

  function saveElements() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(elements))
  }

  // -------------------------------
  // Context Menu Handlers
  // -------------------------------
  function showElementContextMenu(event, el) {
    event.preventDefault()
    selectedElement = el
    contextMenu = document.getElementById('contextMenu')
    if (!contextMenu) return

    contextMenu.style.display = 'block'

    // Position within viewport
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

  function hideContextMenu() {
    if (contextMenu) {
      contextMenu.style.display = 'none'
      contextMenu = null
      selectedElement = null
    }
  }

  window.addEventListener('click', hideContextMenu)

  // -------------------------------
  // Render Elements
  // -------------------------------
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
    card.dataset.id = el.id

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

    // Right-click context menu for element
    card.addEventListener('contextmenu', e => showElementContextMenu(e, el))

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
        const li = document.createElement('li')
        li.textContent = t.todo
        li.dataset.todoId = t.id
        li.style.padding = '6px 4px'
        if (t.complete) {
          li.classList.add('strikethrough')
          li.style.opacity = '0.6'
        }
        li.addEventListener('contextmenu', ev => openTodoContextMenu(ev, t))
        ul.appendChild(li)
      })
      card.appendChild(ul)
    } else if (el.type === 'image') {
      if (el.src) {
        const img = document.createElement('img')
        img.src = el.src
        img.className = 'responsive'
        card.appendChild(img)
      }
    } else if (el.type === 'video') {
      if (el.src) {
        const vid = document.createElement('video')
        vid.src = el.src
        vid.className = 'responsive'
        vid.controls = true
        card.appendChild(vid)
      }
    }

    stage.appendChild(card)
    makeDraggable(card, handle, el.id)
  }

  // -------------------------------
  // Draggable
  // -------------------------------
  function makeDraggable(card, handle, id) {
    let dragging = false,
      startX = 0,
      startY = 0,
      ox = 0,
      oy = 0

    handle.addEventListener('pointerdown', e => {
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

  // -------------------------------
  // Todo Context Menu
  // -------------------------------
  function openTodoContextMenu(event, todo) {
    event.preventDefault()
    const menu = document.getElementById('todoContextMenu')
    if (!menu) return
    menu.style.display = 'block'
    menu.style.left = `${event.clientX}px`
    menu.style.top = `${event.clientY}px`
    window.currentContextTodo = todo
  }

  // -------------------------------
  // Toolbar Add / File / Export / Import
  // -------------------------------
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
    const el = { id: generateId(), type, title, x: 40, y: 40 }
    if (type === 'note') el.content = 'New note...'
    if (type === 'list') el.category = categorySelect.value || 'Week 48'
    elements.push(el)
    saveElements()
    renderAll()
  })

  const fileInput = document.getElementById('fileInput')
  fileInput?.addEventListener('change', e => {
    const file = e.target.files[0]
    if (!file) return
    const type = file.type.startsWith('image') ? 'image' : 'video'
    const src = URL.createObjectURL(file)
    const el = { id: generateId(), type, title: file.name, x: 40, y: 40, src }
    elements.push(el)
    saveElements()
    renderAll()
    fileInput.value = ''
  })

  document.getElementById('exportBtn')?.addEventListener('click', () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(elements))
    const dlAnchor = document.createElement('a')
    dlAnchor.setAttribute('href', dataStr)
    dlAnchor.setAttribute('download', 'planner-export.json')
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
    if (confirm('Clear all elements?')) {
      elements = []
      saveElements()
      renderAll()
    }
  })

  // -------------------------------
  // Context Menu Actions
  // -------------------------------
  document.getElementById('deleteElementAction')?.addEventListener('click', () => {
    if (selectedElement) {
      elements = elements.filter(el => el.id !== selectedElement.id)
      saveElements()
      renderAll()
      hideContextMenu()
    }
  })

  document.getElementById('editAction')?.addEventListener('click', () => {
    if (selectedElement) {
      const newTitle = prompt('Edit element title', selectedElement.title || '')
      if (newTitle !== null) selectedElement.title = newTitle
      saveElements()
      renderAll()
      hideContextMenu()
    }
  })

  renderAll()
})
