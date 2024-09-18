let contextMenu
let selectedIdea

function getIdeas() {
  fetch(bucketEndpoint, {
    method: 'GET',
    headers: headers,
  })
    .then(response => (response.status === 200 ? response?.json() : null))
    .then(val => {
      if (!!val) {
        populateIdeaTable(val)
      }
    })
}

function createTodo(todo) {
  return api(todosEndpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(todo),
  }).then(response =>
    response.status === 200 || response.status === 201 ? response?.json() : null,
  )
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

function deleteIdea(idea) {
  return api(bucketEndpoint, {
    method: 'DELETE',
    headers: headers,
    body: JSON.stringify(idea),
  }).then(response => (response.status === 204 ? response?.json() : null))
}

function update(idea) {
  return api(bucketEndpoint, {
    method: 'PUT',
    headers: headers,
    body: JSON.stringify(idea),
  }).then(response =>
    response.status === 200 || response.status === 201 ? response?.json() : null,
  )
}

function addIdeaFormListener() {
  document.getElementById('ideaForm').addEventListener('submit', function (event) {
    event.preventDefault()

    const formData = new FormData(this)
    const jsonObject = {}
    formData.forEach(function (value, key) {
      jsonObject[key] = value
    })

    createIdea(jsonObject)
  })
}
// listItem.addEventListener('contextmenu', function(event) {
//   if (!!contextMenu) {
//     hideContextMenu()
//   }
//   showContextMenu(event, idea);
// });

function populateIdeaTable(ideas) {
  const tbody = document.getElementById('idea-bucket-table')

  // Clear the current content of the tbody
  tbody.innerHTML = ''

  ideas.forEach(idea => {
    const row = document.createElement('tr')

    const ideaCell = document.createElement('td')
    ideaCell.textContent = idea.idea
    row.appendChild(ideaCell)

    const categoryCell = document.createElement('td')
    categoryCell.textContent = idea.category
    row.appendChild(categoryCell)

    const notesCell = document.createElement('td')
    if (idea.notes && idea.notes.length > 50) {
      notesCell.textContent = idea.notes.substring(0, 47) + '...'
    } else {
      notesCell.textContent = idea.notes || ''
    }
    row.appendChild(notesCell)
    row.addEventListener('contextmenu', function (event) {
      if (!!contextMenu) {
        hideContextMenu()
      }
      showContextMenu(event, idea)
    })

    row.addEventListener('click', () => {
      // Assuming a separate HTML page named 'details.html' that will handle displaying the form
      // We pass the idea ID via URL parameter so that we can fetch and display the details
      window.location.href = 'details.html?id=' + idea.id
    })

    tbody.appendChild(row)
  })
}

function showContextMenu(event, idea) {
  // Check if the right-click occurred outside of an 'a' tag
  if (event.target.tagName.toLowerCase() === 'a') {
    return
  }
  event.preventDefault()
  selectedIdea = idea
  const contextMenuId = 'ideaContextMenu'
  contextMenu = document.getElementById(contextMenuId)

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

function addIdeaListener() {
  contextMenu = document.getElementById('ideaContextMenu')
  const deleteAction = document.getElementById('deleteAction')
  const editAction = document.getElementById('editAction')
  const changeCategoryAction = document.getElementById('changeCategoryAction')
  const copyToTodoAction = document.getElementById('copyToTodoAction')

  // No global context menu for ideas
  // document.addEventListener('contextmenu', function(event) {
  //   hideContextMenu()
  //   showContextMenu(event)
  // });

  deleteAction.addEventListener('click', function () {
    deleteIdea(selectedIdea, true)
    selectedIdea = null
    hideContextMenu()
  })

  copyToTodoAction.addEventListener('click', function () {
    const idea = selectedIdea
    const todo = { todo: idea.idea }
    const category = prompt('Enter the new category:')
    if (!!category) {
      todo.category = category
    }
    createTodo(todo)
    selectedIdea = null
    hideContextMenu()
  })

  changeCategoryAction.addEventListener('click', function () {
    const idea = selectedIdea
    const category = prompt('Enter the new category:')
    if (!!category) {
      idea.category = category
      update(idea)
    }
    selectedIdea = null
    hideContextMenu()
  })

  editAction.addEventListener('click', function () {
    const idea = selectedIdea
    const task = prompt('Edit idea:', idea.idea)
    if (!!task && idea.idea !== task) {
      idea.idea = task
      update(idea)
    }
    selectedIdea = null
    hideContextMenu()
  })

  // Event listener to hide context menu on window click
  window.addEventListener('click', function () {
    hideContextMenu()
  })
}

window.addEventListener('load', getIdeas)
window.addEventListener('load', addIdeaFormListener)
window.onload = function () {
  addIdeaListener()
}
