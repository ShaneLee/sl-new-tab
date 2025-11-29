// TODO move to a common file for memes and bucket-list etc
let page = 0
let contextMenu
let selectedFile

let currentMediaIndex = 0
let mediaFiles = []

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

function fetchFiles(bucket, tags) {
  const size = 50

  // TODO items of interest is the bucket, but need tags
  // before we can get memes specifically
  api(filesEndpointFn(bucket, page, size), {
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

  mediaFiles = files.map(file => file.replace('https:', 'http:').replace(':8080', ''))

  mediaFiles.forEach((file, index) => {
    const fileDiv = document.createElement('div')
    fileDiv.classList.add('file')

    if (file.includes('.mp4')) {
      const videoElement = document.createElement('video')
      videoElement.controls = true
      videoElement.src = file
      fileDiv.appendChild(videoElement)

      videoElement.addEventListener('click', event => {
        event.preventDefault()
        event.stopPropagation() // Prevent video from playing
        openModal(index, 'video')
      })
    } else {
      const imgElement = document.createElement('img')
      imgElement.src = file
      fileDiv.appendChild(imgElement)

      // Click to enlarge image
      imgElement.addEventListener('click', () => {
        openModal(index, 'image')
      })
    }

    fileDiv.addEventListener('contextmenu', function (event) {
      event.preventDefault()
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

function openModal(index, type) {
  currentMediaIndex = index
  const modal = document.getElementById('mediaModal')
  const modalImage = document.getElementById('modalImage')
  const modalVideo = document.getElementById('modalVideo')

  modalVideo.innerHTML = ''

  // Display the correct media type
  if (type === 'image') {
    modalImage.src = mediaFiles[currentMediaIndex]
    modalImage.style.display = 'block'
    modalVideo.style.display = 'none'
  } else if (type === 'video') {
    const sourceElement = document.createElement('source')
    sourceElement.src = mediaFiles[currentMediaIndex]
    sourceElement.type = 'video/mp4' // Explicitly set MIME type
    modalVideo.appendChild(sourceElement)
    modalVideo.load() // Load the video source dynamically

    modalVideo.style.display = 'block'
    modalImage.style.display = 'none'
  }

  modal.style.display = 'flex'
  document.addEventListener('keydown', handleKeyNavigation)
}

function closeModal() {
  const modal = document.getElementById('mediaModal')
  modal.style.display = 'none'
  document.removeEventListener('keydown', handleKeyNavigation)
}

function handleKeyNavigation(event) {
  if (event.key === 'ArrowRight') {
    currentMediaIndex = (currentMediaIndex + 1) % mediaFiles.length
  } else if (event.key === 'ArrowLeft') {
    currentMediaIndex = (currentMediaIndex - 1 + mediaFiles.length) % mediaFiles.length
  } else if (event.key === 'Escape') {
    closeModal()
    return
  }

  const isVideo = mediaFiles[currentMediaIndex].includes('.mp4')
  const type = isVideo ? 'video' : 'image'
  openModal(currentMediaIndex, type)
}

function addModalCloseListener() {
  // Close modal when clicking outside the image or video
  document.getElementById('mediaModal').addEventListener('click', e => {
    if (
      e.target !== document.getElementById('modalImage') &&
      e.target !== document.getElementById('modalVideo')
    ) {
      closeModal()
    }
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
  fetchFiles('itemsofinterest')
  addEventListeners()
  addContextMenuListener()
  addModalCloseListener()
}
