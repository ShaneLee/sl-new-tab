let contextMenu
let selectedBook

function getBookSummary() {
  fetch(booksSummaryEndpoint('all'), {
    method: 'GET',
    headers: headers,
  })
    .then(response => (response.status === 200 ? response?.json() : null))
    .then(val => {
      if (!!val) {
        renderReadingStats(val)
      }
    })
}

function getAllReadBooks() {
  fetch(readBooksEndpoint, {
    method: 'GET',
    headers: headers,
  })
    .then(response => (response.status === 200 ? response?.json() : null))
    .then(val => {
      if (!!val) {
        const tbody = document.getElementById('all-books-table')
        populateBooksTable(val, tbody)
      }
    })
}

function getCurrentlyReadingBooks() {
  fetch(booksOnShelfEndpointFn('currently-reading'), {
    method: 'GET',
    headers: headers,
  })
    .then(response => (response.status === 200 ? response?.json() : null))
    .then(val => {
      if (!!val) {
        const tbody = document.getElementById('read-books-table')
        populateBooksTable(val, tbody)
      }
    })
}

function getFavouriteBooks() {
  fetch(booksOnShelfEndpointFn('favourites'), {
    method: 'GET',
    headers: headers,
  })
    .then(response => (response.status === 200 ? response?.json() : null))
    .then(val => {
      if (!!val) {
        const tbody = document.getElementById('favourite-books-table')
        populateBooksTable(val, tbody)
      }
    })
}

function getToReadBooks() {
  fetch(booksOnShelfEndpointFn('to-read'), {
    method: 'GET',
    headers: headers,
  })
    .then(response => (response.status === 200 ? response?.json() : null))
    .then(val => {
      if (!!val) {
        const tbody = document.getElementById('want-to-read-books-table')
        populateBooksTable(val, tbody)
      }
    })
}

function searchSuggestions(query) {
  return fetch(bookSuggestEndpointFn(query), {
    method: 'GET',
    headers: headers,
  }).then(response => (response.status === 200 ? response?.json() : null))
}

function getUserShelves(query) {
  return fetch(bookShelvesEndpoint, {
    method: 'GET',
    headers: headers,
  }).then(response => (response.status === 200 ? response?.json() : null))
}

function addNewBook(book) {
  return api(addManualBookEndpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(book),
  }).then(response =>
    response.status === 200 || response.status === 201 ? response?.json() : null,
  )
}

function addBookToShelf(bookRequest) {
  console.log('Adding book to shelf:', bookRequest)
  return api(bookShelfEndpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(bookRequest),
  }).then(response =>
    response.status === 200 || response.status === 201 ? response?.json() : null,
  )
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

function renderReadingStats(stats) {
  document.getElementById('uniqueNumberOfBooksRead').textContent = stats.uniqueNumberOfBooksRead
  document.getElementById('numberOfBooksRead').textContent = stats.numberOfBooksRead
  document.getElementById('numberOfPagesRead').textContent = stats.numberOfPagesRead
  document.getElementById('wantToReadCount').textContent = stats.wantToReadCount
}

function addNewBookFormListener() {
  document.getElementById('newBookForm').addEventListener('submit', function (event) {
    event.preventDefault()

    const formData = new FormData(this)
    const jsonObject = {}
    formData.forEach(function (value, key) {
      jsonObject[key] = value
    })

    addNewBook(jsonObject)
  })
}

// listItem.addEventListener('contextmenu', function(event) {
//   if (!!contextMenu) {
//     hideContextMenu()
//   }
//   showContextMenu(event, book);
// });

function populateBooksTable(books, tbody) {
  // Clear the current content of the tbody
  tbody.innerHTML = ''

  books.forEach(book => {
    const row = document.createElement('tr')

    const bookCell = document.createElement('td')

    if (book.amazonAffiliateLink) {
      const link = document.createElement('a')
      link.href = book.amazonAffiliateLink
      link.textContent = book.title
      // Open in a new tab
      link.target = '_blank'
      bookCell.appendChild(link)
    } else {
      bookCell.textContent = book.title
    }

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

    const readCountCell = document.createElement('td')
    readCountCell.textContent = book.readCount || ''
    row.appendChild(readCountCell)

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

  copyToTodoAction.addEventListener('click', function () {
    const book = selectedBook
    const todo = { todo: `Read: ${book.title}`, linkedBookId: book.bookId, tags: ['reading'] }
    const category = prompt('Enter the new category:')
    if (!!category) {
      todo.category = category
    }
    createTodo(todo)
    selectedBook = null
    hideContextMenu()
  })

  const markAsReadAction = document.getElementById('markAsReadAction')

  markAsReadAction.addEventListener('click', function () {
    const book = selectedBook
    const today = new Date().toISOString().split('T')[0]
    const userInput = prompt('Enter the date read (yyyy-MM-dd):', today)
    const dateRead = userInput && userInput.trim() !== '' ? userInput.trim() : today
    const addToShelfRequest = {
      bookId: book.bookId,
      shelfName: 'read',
      dateRead: dateRead,
    }
    addBookToShelf(addToShelfRequest)
    selectedBook = null
    hideContextMenu()
  })
  //
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

function addBookToShelfFormListener() {
  const additionalShelvesSelect = document.getElementById('additionalShelves')

  getUserShelves().then(userShelves =>
    userShelves.forEach(shelf => {
      const option = document.createElement('option')
      option.value = shelf
      option.textContent = shelf
      additionalShelvesSelect.appendChild(option)
    }),
  )
  document.getElementById('addBookToShelfForm').addEventListener('submit', function (event) {
    event.preventDefault()

    const formData = new FormData(this)
    const jsonObject = {}
    formData.forEach((value, key) => {
      if (key === 'additionalShelves') {
        jsonObject[key] = jsonObject[key] ? `${jsonObject[key]},${value}` : value
      } else {
        jsonObject[key] = value
      }
    })

    addBookToShelf(jsonObject)
  })
}

function addBookSearchListener() {
  const bookSearchInput = document.getElementById('bookSearch')
  const suggestionsList = document.getElementById('bookSuggestions')

  bookSearchInput.addEventListener('input', function () {
    const query = bookSearchInput.value.trim()
    if (query.length < 3) {
      suggestionsList.innerHTML = ''
      return
    }

    searchSuggestions(query).then(suggestions => {
      suggestionsList.innerHTML = ''
      suggestions?.forEach(book => {
        const listItem = document.createElement('li')
        listItem.textContent = `${book.title} by ${book.author}`
        listItem.dataset.isbn13 = book.isbn13
        listItem.addEventListener('click', () => populateBookDetails(book))
        suggestionsList.appendChild(listItem)
      })
    })
  })
}

function populateBookDetails(book) {
  document.getElementById('isbn13').value = book.isbn13
  document.getElementById('bookSearch').value = book.title
  document.getElementById('bookSuggestions').innerHTML = ''
}

window.addEventListener('load', () => {
  // getAllReadBooks()
  getCurrentlyReadingBooks()
  getToReadBooks()
  getBookSummary()
  getFavouriteBooks()
  addBookToShelfFormListener()
  addBookSearchListener()
  addNewBookFormListener()
  addBookListener()
})
