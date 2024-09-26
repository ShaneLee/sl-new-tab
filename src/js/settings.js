window.onload = function () {
  const token = getUrlParameter('token')

  if (!!token) {
    localStorage.setItem('token', token)
    headers.Authorization = `Bearer ${token}`
  }
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

function getUserTags() {
  return api(tagsEndpoint, {
    method: 'GET',
    headers: headers,
  }).then(res => (!!res ? res.json() : null))
}

function saveSettings() {
  localStorage.removeItem('userPreferences')
  const name = document.getElementById('name').value
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

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
      return getUserTags().then(val => {
        return {
          prefs: prefs,
          tags: new Set([...val]),
        }
      })
    })
    .then(prefs => {
      if (prefs.prefs) {
        const tagsWithoutColours = [...prefs.tags].filter(
          tag => !(prefs.prefs.coloursByTags && prefs.prefs.coloursByTags.hasOwnProperty(tag)),
        )
        document.getElementById('name').value = prefs.name || ''

        if (prefs.prefs.coloursByTags) {
          Object.entries(prefs.prefs.coloursByTags).forEach(([tag, colour]) => {
            addTagColourPair(tag, colour, 'configuredTagColourPairs')
          })
        }
        tagsWithoutColours.forEach(tag => {
          addTagColourPair(tag, '', (div = 'unconfiguredTagColourPairs'))
        })
      }
    })
    .catch(error => console.error('Error loading preferences:', error))
}

function addTagColourPair(tag = '', colour = '', div = 'unconfiguredTagColourPairs') {
  const tagColourPairsDiv = document.getElementById(div)

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
