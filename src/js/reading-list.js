let contextMenu;
let selectedReading;

function getReadingList() {
  fetch(readingListEndpoint, {
      method: 'GET',
      headers: headers
      })
  .then(response => response.status === 200 ? response?.json() : null)
  .then(val => {
    if (!!val) {
      populateTable(val)
    }
  });
}

function updateReadStatus(val, read) {
  fetch(readingListEndpointReadFn(val.id, read), {
      method: 'PATCH',
      headers: headers
      })
}


function populateTable(vals) {
  const tbody = document.getElementById('reading-list-table');

  tbody.innerHTML = '';

  vals.forEach(val => {
      const row = document.createElement('tr');

      const valCell = document.createElement('td');
      valCell.textContent = val.title;
      row.appendChild(valCell);

      const categoryCell = document.createElement('td');
      const link = document.createElement('a');
      link.href = val.url;
      link.textContent = val.url;
      categoryCell.appendChild(link);
      row.appendChild(categoryCell);

      const notesCell = document.createElement('td');
      const checked = document.createElement('input');
      checked.type = 'checkbox'
      checked.checked = val.read;

      checked.addEventListener('change', function() {
          updateReadStatus(val, this.checked);
      });
      notesCell.appendChild(checked)
      row.appendChild(notesCell);

      const createdAt = document.createElement('td');
      createdAt.textContent = new Date(val.createdAtUtc)
      row.appendChild(createdAt);

      row.addEventListener('contextmenu', function(event) {
        if (!!contextMenu) {
          hideContextMenu()
        }
        showContextMenu(event, val);
      });

      tbody.appendChild(row);
  });

}

function createTodo(todo) {
  return api(todosEndpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(todo)
  })
}

function addContextMenuListener() {

  contextMenu = document.getElementById('readingContextMenu');
  const deleteAction = document.getElementById('deleteAction');
  const createTodoAction = document.getElementById('createTodoAction');
  const createNoteAction = document.getElementById('createNoteAction');

  deleteAction.addEventListener('click', function() {
    console.log('todo')
    hideContextMenu();
  });

  createTodoAction.addEventListener('click', function() {
    const reading = selectedReading
    const todo = { 
      readingListId: reading.id,
      todo: `${reading.title} ${reading.url}`
    }
    const category = prompt('Enter the new category:');
    todo.category = !!category ? category : 'PENDING'

    createTodo(todo)
    selectedReading = null
    hideContextMenu();
  });

  createNoteAction.addEventListener('click', function() {
    console.log('todo')
    hideContextMenu();
  });

  // Event listener to hide context menu on window click
  window.addEventListener('click', function() {
    hideContextMenu();
  });
}

function showContextMenu(event, reading) {
  // Check if the right-click occurred outside of an 'a' tag
  if (event.target.tagName.toLowerCase() === 'a') {
    return;
  }
  event.preventDefault();
  selectedReading = reading;
  const contextMenuId = 'readingContextMenu';
  contextMenu = document.getElementById(contextMenuId);

  // Ensure the context menu is visible before retrieving dimensions
  contextMenu.style.display = 'block';
  
  const contextMenuWidth = contextMenu.offsetWidth;
  const contextMenuHeight = contextMenu.offsetHeight;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let left = event.clientX;
  let top = event.clientY;
  
  // Adjust left position if the context menu goes off the right edge
  if (left + contextMenuWidth > viewportWidth) {
    left = viewportWidth - contextMenuWidth;
  }
  
  // Adjust top position if the context menu goes off the bottom edge
  if (top + contextMenuHeight > viewportHeight) {
    top = viewportHeight - contextMenuHeight;
  }
  
  // Ensure the top position is never negative
  top = Math.max(top, 0);
  
  contextMenu.style.left = `${left}px`;
  contextMenu.style.top = `${top}px`;
  
  event.stopPropagation();
}

function hideContextMenu() {
  if (!!contextMenu) {
    contextMenu.style.display = 'none';
    contextMenu = null
  }
}


window.addEventListener("load", getReadingList);
window.onload = addContextMenuListener
