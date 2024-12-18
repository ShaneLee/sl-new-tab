let contextMenu
let selectedBook

function getBooks() {
  fetch(readBooksEndpoint, {
    method: 'GET',
    headers: headers,
  })
    .then(response => (response.status === 200 ? response?.json() : null))
    .then(val => {
      if (!!val) {
        populateBooksTable(val)
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

// listItem.addEventListener('contextmenu', function(event) {
//   if (!!contextMenu) {
//     hideContextMenu()
//   }
//   showContextMenu(event, book);
// });

function populateBooksTable(books) {
  const tbody = document.getElementById('read-books-table')

  // Clear the current content of the tbody
  tbody.innerHTML = ''

  books.forEach(book => {
    const row = document.createElement('tr')

    const bookCell = document.createElement('td')
    bookCell.textContent = book.title
    row.appendChild(bookCell)

    const authorCell = document.createElement('td')
    authorCell.textContent = book.author
    row.appendChild(authorCell)

    const ratingCell = document.createElement('td')
    // TODO map to stars?
    ratingCell.textContent = book.myRating
    row.appendChild(ratingCell)

    const dateReadCell = document.createElement('td')
    dateReadCell.textContent = book.dateRead || ''
    row.appendChild(dateReadCell)

    row.addEventListener('contextmenu', function (event) {
      if (!!contextMenu) {
        hideContextMenu()
      }
      showContextMenu(event, book)
    })

    row.addEventListener('click', () => {
      // Assuming a separate HTML page named 'details.html' that will handle displaying the form
      // We pass the book ID via URL parameter so that we can fetch and display the details
      window.location.href = 'details.html?id=' + book.id
    })

    tbody.appendChild(row)
  })
}

function showContextMenu(event, book) {
  // Check if the right-click occurred outside of an 'a' tag
  if (event.target.tagName.toLowerCase() === 'a') {
    return
  }
  event.preventDefault()
  selectedBook = book
  const contextMenuId = 'bookContextMenu'
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

function addBookListener() {
  contextMenu = document.getElementById('booksContextMenu')
  const copyToTodoAction = document.getElementById('copyToTodoAction')

  // No global context menu for books
  // document.addEventListener('contextmenu', function(event) {
  //   hideContextMenu()
  //   showContextMenu(event)
  // });

  // Event listener to hide context menu on window click
  window.addEventListener('click', function () {
    hideContextMenu()
  })
}

window.addEventListener('load', getBooks)
window.onload = function () {
  addBookListener()
}
