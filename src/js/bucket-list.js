// TODO move to a common file for memes and bucket-list etc
let page = 0
let contextMenu
let selectedFile

let currentMediaIndex = 0
let mediaFiles = []
let isFirstPage = true
let isLastPage = true
let isFetching = false

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
    if (page > 0 && !isFetching) {
      page--
      fetchFiles()
    }
  })

  document.getElementById('nextPage').addEventListener('click', () => {
    if (!isLastPage && !isFetching) {
      page++
      fetchFiles()
    }
  })

  // Videos don't pause themselves when detached from the DOM, and a video's built-in
  // play button fires a 'click' that also opens the lightbox, so without this only one
  // video would ever look "active" while others kept playing silently in the background.
  // 'play' doesn't bubble, so this has to be a capturing listener.
  document.getElementById('files').addEventListener(
    'play',
    event => {
      if (event.target.tagName !== 'VIDEO') {
        return
      }
      document.querySelectorAll('#files video').forEach(video => {
        if (video !== event.target) {
          video.pause()
        }
      })
      document.getElementById('modalVideo').pause()
    },
    true,
  )

  document.getElementById('modalVideo').addEventListener('play', () => {
    document.querySelectorAll('#files video').forEach(video => video.pause())
  })
}

function fetchFiles(bucket, onLoaded) {
  const size = 50

  isFetching = true
  updateFetchingState()

  // TODO items of interest is the bucket, but need tags
  // before we can get memes specifically
  return api(filesEndpointFn(bucket || 'bucket-list', page, size), {
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
      if (onLoaded) {
        onLoaded()
      }
    })
    .catch(error => {
      console.error('Error fetching files:', error)
    })
    .finally(() => {
      isFetching = false
      updateFetchingState()
    })
}

function pauseGridVideos(filesDiv) {
  filesDiv.querySelectorAll('video').forEach(video => {
    video.pause()
    video.removeAttribute('src')
    video.load()
  })
}

function displayFiles(files) {
  const filesDiv = document.getElementById('files')
  pauseGridVideos(filesDiv)
  filesDiv.innerHTML = ''

  mediaFiles = files.map(file => file.replace('http:', 'https:'))

  if (mediaFiles.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'empty-state'
    empty.textContent = 'No files found.'
    filesDiv.appendChild(empty)
    return
  }

  mediaFiles.forEach((file, index) => {
    const fileDiv = document.createElement('div')
    fileDiv.classList.add('file')

    if (file.includes('.mp4')) {
      const videoElement = document.createElement('video')
      videoElement.onerror = () => {
        fileDiv.remove()
        mediaFiles[index] = null
      }
      videoElement.controls = true
      videoElement.preload = 'metadata'
      videoElement.src = file
      fileDiv.appendChild(videoElement)

      // A dedicated button to open the lightbox, so clicking the video's own
      // play/pause/seek controls doesn't also pop the modal open.
      const expandButton = document.createElement('button')
      expandButton.type = 'button'
      expandButton.className = 'file-expand'
      expandButton.setAttribute('aria-label', 'Enlarge video')
      expandButton.textContent = '⤢'
      expandButton.addEventListener('click', event => {
        event.preventDefault()
        event.stopPropagation()
        videoElement.pause()
        openModal(index, 'video')
      })
      fileDiv.appendChild(expandButton)
    } else {
      const imgElement = document.createElement('img')
      imgElement.onerror = () => {
        fileDiv.remove()
        mediaFiles[index] = null
      }
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

  modalVideo.pause()
  modalVideo.removeAttribute('src')
  modalVideo.innerHTML = ''

  // Display the correct media type
  if (type === 'image') {
    modalVideo.load()
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
  const modalVideo = document.getElementById('modalVideo')

  modalVideo.pause()
  modalVideo.removeAttribute('src')
  modalVideo.innerHTML = ''
  modalVideo.load()

  modal.style.display = 'none'
  document.removeEventListener('keydown', handleKeyNavigation)
}

// Opens the media at `index`, skipping over entries that failed to load (null).
// `direction` controls which way to keep looking when we land on a gap.
function openMediaAt(index, direction = 1) {
  if (index < 0 || index >= mediaFiles.length) {
    return
  }
  const file = mediaFiles[index]
  if (!file) {
    goToMedia(index + direction, direction)
    return
  }
  openModal(index, file.includes('.mp4') ? 'video' : 'image')
}

// Navigates within the currently loaded page. At either edge, instead of wrapping
// around, it loads the next/previous page (when one exists) and opens the
// first/last item of it.
function goToMedia(index, direction) {
  if (index < 0) {
    if (!isFirstPage && !isFetching) {
      page--
      fetchFiles(undefined, () => openMediaAt(mediaFiles.length - 1, -1))
    }
    return
  }

  if (index >= mediaFiles.length) {
    if (!isLastPage && !isFetching) {
      page++
      fetchFiles(undefined, () => openMediaAt(0, 1))
    }
    return
  }

  openMediaAt(index, direction)
}

function handleKeyNavigation(event) {
  if (event.key === 'Escape') {
    closeModal()
    return
  }

  if (event.key === 'ArrowRight') {
    goToMedia(currentMediaIndex + 1, 1)
  } else if (event.key === 'ArrowLeft') {
    goToMedia(currentMediaIndex - 1, -1)
  }
}

function addModalCloseListener() {
  document.getElementById('modalClose').addEventListener('click', event => {
    event.stopPropagation()
    closeModal()
  })

  document.getElementById('modalPrev').addEventListener('click', event => {
    event.stopPropagation()
    goToMedia(currentMediaIndex - 1, -1)
  })

  document.getElementById('modalNext').addEventListener('click', event => {
    event.stopPropagation()
    goToMedia(currentMediaIndex + 1, 1)
  })

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

function updateFetchingState() {
  document.getElementById('prevPage').disabled = isFetching || isFirstPage
  document.getElementById('nextPage').disabled = isFetching || isLastPage
  document.getElementById('files').classList.toggle('loading', isFetching)
  document.getElementById('pageStatus').textContent = isFetching ? 'Loading…' : `Page ${page + 1}`
}

function updatePaginationButtons(data) {
  isFirstPage = data.first
  isLastPage = data.last
  updateFetchingState()
}

window.onload = () => {
  fetchFiles('bucket-list')
  addEventListeners()
  addContextMenuListener()
  addModalCloseListener()
}
