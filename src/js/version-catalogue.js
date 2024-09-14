let contextMenu;
let selectedVersionCatalogue;

function getVersionCatalogue() {
  fetch(versionCatalogueEndpoint, {
      method: 'GET',
      headers: headers
      })
  .then(response => response.status === 200 ? response?.json() : null)
  .then(val => {
    if (!!val) {
      populateVersionCatalogueTable(val)
    }
  });
}

function createVersionCatalogue(versionCatalogue) {
  return api(versionCatalogueEndpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(versionCatalogue)
  })

  .then(response => response.status === 200 || response.status === 201 ? response?.json() : null)
}

function deleteVersionCatalogue(versionCatalogue) {
  return api(versionCatalogueEndpoint, {
    method: 'DELETE',
    headers: headers,
    body: JSON.stringify(versionCatalogue)
  })

  .then(response => response.status === 204 ? response?.json() : null)
}

function update(versionCatalogue) {
  return api(versionCatalogueEndpoint, {
    method: 'PUT',
    headers: headers,
    body: JSON.stringify(versionCatalogue)
  })

  .then(response => response.status === 200 || response.status === 201 ? response?.json() : null)
}

function addVersionCatalogueFormListener() {
  document.getElementById('versionCatalogueForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const formData = new FormData(this);
    const jsonObject = {};
    formData.forEach(function(value, key){
      jsonObject[key] = value;
    });

    createVersionCatalogue(jsonObject)
  });
}
  // listItem.addEventListener('contextmenu', function(event) {
  //   if (!!contextMenu) {
  //     hideContextMenu()
  //   }
  //   showContextMenu(event, versionCatalogue);
  // });


function populateVersionCatalogueTable(versionCatalogues) {
  const tbody = document.getElementById('version-catalogue-table');

  // Clear the current content of the tbody
  tbody.innerHTML = '';

  versionCatalogues.forEach(val => {
      const row = document.createElement('tr');

      const versionCatalogueCell = document.createElement('td');
      versionCatalogueCell.textContent = val.name;
      row.appendChild(versionCatalogueCell);

      const packageNameCell = document.createElement('td');
      packageNameCell.textContent = val.packageName;
      row.appendChild(packageNameCell);

      const versionCell = document.createElement('td');
      versionCell.textContent = val.version;
      versionCell.style.fontWeight = 800;
      row.appendChild(versionCell);

      const releaseDateCell = document.createElement('td');
      releaseDateCell.textContent = val.releaseDate;
      row.appendChild(releaseDateCell);

      row.addEventListener('contextmenu', function(event) {
        if (!!contextMenu) {
          hideContextMenu()
        }
        showContextMenu(event, val);
      });

      tbody.appendChild(row);
  });

}

function showContextMenu(event, versionCatalogue) {
  // Check if the right-click occurred outside of an 'a' tag
  if (event.target.tagName.toLowerCase() === 'a') {
    return;
  }
  event.preventDefault();
  selectedVersionCatalogue = versionCatalogue;
  const contextMenuId = 'versionCatalogueContextMenu';
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

function addVersionCatalogueListener() {

  contextMenu = document.getElementById('versionCatalogueContextMenu');
  const deleteAction = document.getElementById('deleteAction');
  const editAction = document.getElementById('editAction');

  // No global context menu for versionCatalogues
  // document.addEventListener('contextmenu', function(event) {
  //   hideContextMenu()
  //   showContextMenu(event)
  // });

  deleteAction.addEventListener('click', function() {
    // TODO 
    deleteVersionCatalogue(selectedVersionCatalogue, true)
    selectedVersionCatalogue = null
    hideContextMenu();
  });

  editAction.addEventListener('click', function() {
    // TODO 
    console.error('Not implemented')
    // const versionCatalogue = selectedVersionCatalogue
    // const task = prompt('Edit versionCatalogue:', versionCatalogue.versionCatalogue);
    // if (!!task && versionCatalogue.versionCatalogue !== task) {
    //   versionCatalogue.versionCatalogue = task
    //   update(versionCatalogue)
    // }
    // selectedVersionCatalogue = null
    // hideContextMenu();
  });

  // Event listener to hide context menu on window click
  window.addEventListener('click', function() {
    hideContextMenu();
  });
}


window.addEventListener("load", getVersionCatalogue);
window.addEventListener("load", addVersionCatalogueFormListener);
window.onload = function() {
  addVersionCatalogueListener()
}
