window.onload = function () {
  document.getElementById('settingsForm').addEventListener('submit', function (e) {
    e.preventDefault()
    saveSettings()
  })

  document.getElementById('addTagPairButton').addEventListener('click', function () {
    addTagColourPair()
  })

  loadSettings()
}

function getPreferences() {
  return api(userPreferences, {
    method: 'GET',
    headers: headers,
  }).then(res => (!!res ? res.json() : null))
}

function saveSettings() {
  localStorage.removeItem('userPreferences')
  const name = document.getElementById('name').value
  chrome.storage.local.set({ name: name }, function () {})

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  chrome.storage.local.set({ timezone: timezone }, function () {})

  const coloursByTags = {}

  document.querySelectorAll('.tag-pair').forEach(pair => {
    const tag = pair.querySelector('.tag').value
    const colour = pair.querySelector('.colour').value
    if (tag && colour) {
      coloursByTags[tag] = colour
    }
  })

  const prefs = {
    name: name,
    timezone: timezone,
    coloursByTags: coloursByTags,
  }

  // TODO put if already exists?
  api(userPreferences, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(prefs),
  }).then(response => (response?.status === 201 ? response : null))
}

function loadSettings() {
  getPreferences()
    .then(prefs => {
      if (prefs) {
        document.getElementById('name').value = prefs.name || ''

        if (prefs.coloursByTags) {
          Object.entries(prefs.coloursByTags).forEach(([tag, colour]) => {
            addTagColourPair(tag, colour)
          })
        }
      }
    })
    .catch(error => console.error('Error loading preferences:', error))
}

function addTagColourPair(tag = '', colour = '') {
  const tagColourPairsDiv = document.getElementById('tagColourPairs')

  const newPairDiv = document.createElement('div')
  newPairDiv.className = 'tag-pair'

  const tagInput = document.createElement('input')
  tagInput.name = 'tag'
  tagInput.className = 'tag'
  tagInput.placeholder = 'Tag Name'
  tagInput.value = tag

  const colourInput = document.createElement('input')
  colourInput.name = 'colour'
  colourInput.type = 'color'
  colourInput.className = 'colour'
  colourInput.placeholder = 'Colour'
  colourInput.value = colour
  colourInput.style.backgroundColor = colour

  colourInput.addEventListener('input', function () {
    this.style.backgroundColor = this.value
  })

  newPairDiv.appendChild(tagInput)
  newPairDiv.appendChild(colourInput)

  tagColourPairsDiv.appendChild(newPairDiv)
}
