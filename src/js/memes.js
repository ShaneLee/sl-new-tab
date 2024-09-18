const userId = tempUserId
let page = 0
let contextMenu
let selectedFile

function deleteFile() {
  const fileId = selectedFile.id
  console.error('Not implemented boyo')
  // return api(podcastSubscribeEndpoint, {
  //     method: 'DELETE',
  //     headers: headers,
  //     body: JSON.stringify({'id': podcastId})
  //     })
}

function addContextMenuListener() {
  contextMenu = document.getElementById('fileContextMenu')
  const deleteAction = document.getElementById('deleteAction')

  deleteAction.addEventListener('click', function () {
    delete selectedEpisode.id
    selectedEpisode = null
    hideContextMenu()
  })

  // Event listener to hide context menu on window click
  window.addEventListener('click', function () {
    hideContextMenu()
  })
}

function addEventListeners() {
  document.getElementById('prevPage').addEventListener('click', () => {
    if (page > 0) {
      page--
      fetchFiles()
    }
  })

  document.getElementById('nextPage').addEventListener('click', () => {
    page++
    fetchFiles()
  })
}

function fetchFiles() {
  const size = 50

  // TODO items of interest is the bucket, but need tags
  // before we can get memes specifically
  api(filesEndpointFn('itemsofinterest', page, size), {
    method: 'GET',
    headers: headers,
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    })
    .then(data => {
      displayFiles(data.content)
      updatePaginationButtons(data)
    })
    .catch(error => {
      console.error('Error fetching files:', error)
    })
}

function displayFiles(files) {
  const filesDiv = document.getElementById('files')
  filesDiv.innerHTML = ''

  files
    .map(file => file.replace('http:', 'https:'))
    .forEach(file => {
      const fileDiv = document.createElement('div')
      fileDiv.classList.add('file')
      if (file.includes('.mp4')) {
        const videoElement = document.createElement('video')
        videoElement.controls = true
        const source = document.createElement('source')
        source.src = file
        videoElement.appendChild(source)
        fileDiv.appendChild(videoElement)
      } else {
        const imgElement = document.createElement('img')
        imgElement.src = file
        fileDiv.appendChild(imgElement)
      }

      fileDiv.addEventListener('contextmenu', function (event) {
        if (!!contextMenu) {
          hideContextMenu()
        }
        showContextMenu(
          event,
          file,
          val => {
            selectedFile = val
          },
          'fileContextMenu',
        )
      })
      filesDiv.appendChild(fileDiv)
    })
}

function showContextMenu(event, val, setterFn, contextMenuId) {
  // Check if the right-click occurred outside of an 'a' tag
  if (event.target.tagName.toLowerCase() === 'a') {
    return
  }
  event.preventDefault()
  setterFn(val)
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

function updatePaginationButtons(data) {
  document.getElementById('prevPage').disabled = data.first
  document.getElementById('nextPage').disabled = data.last
}

window.onload = () => {
  fetchFiles()
  addEventListeners()
  addContextMenuListener()
}
