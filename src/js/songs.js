let selectedSong

// -------------------- Song API --------------------
function createSong(songObj) {
  return api(songsEndpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(songObj),
  }).then(res => (res.status === 200 || res.status === 201 ? res.json() : null))
}

function recordPractice(songId, difficulty) {
  return api(recordPracticeFn(songId), {
    method: 'POST',
    formUrlEncodedHeaders,
    body: new URLSearchParams({ difficulty }),
  }).then(res => (res.status === 200 ? res.json() : null))
}

function fetchSongsReview() {
  return api(reviewSongsEndpoint, { method: 'GET', headers }).then(res =>
    res.status === 200 ? res.json() : null,
  )
}

// -------------------- Rendering --------------------
function renderSongs(reviewBatch) {
  const container = document.getElementById('songs-container')
  container.innerHTML = ''

  if (!reviewBatch) return

  for (const category of ['due', 'inProgress']) {
    const songs = reviewBatch[category]
    if (!songs || !songs.length) continue

    const section = document.createElement('div')
    section.className = 'song-category'
    const heading = document.createElement('h3')
    heading.textContent = category.charAt(0).toUpperCase() + category.slice(1)
    section.appendChild(heading)

    songs.forEach(song => {
      const template = document.getElementById('song-template')
      const clone = template.content.cloneNode(true)

      clone.querySelector('.song-title').textContent = song.song
      clone.querySelector('.song-instrument').textContent = song.instrument
      clone.querySelector('.song-status').textContent = song.status

      // Set the difficulty select value from the song object
      const difficultySelect = clone.querySelector('select[name="difficulty"]')
      if (song.difficulty) {
        difficultySelect.value = song.difficulty
      }

      const form = clone.querySelector('.practice-form')
      form.addEventListener('submit', e => {
        e.preventDefault()
        const difficulty = difficultySelect.value
        recordPractice(song.id, difficulty).then(() => {
          // Refresh songs after practice
          loadSongs()
        })
      })

      section.appendChild(clone)
    })
    container.appendChild(section)
  }
}

// -------------------- Form Listeners --------------------
function addSongFormListener() {
  document.getElementById('songForm').addEventListener('submit', function (e) {
    e.preventDefault()
    const formData = new FormData(this)
    const songObj = {
      song: formData.get('song'),
      instrument: formData.get('instrument'),
      difficulty: formData.get('difficulty'),
    }

    createSong(songObj).then(() => {
      this.reset()
      loadSongs()
    })
  })
}

// -------------------- Load songs --------------------
function loadSongs() {
  fetchSongsReview().then(renderSongs)
}

// -------------------- Init --------------------
window.addEventListener('load', () => {
  addSongFormListener()
  loadSongs()
})
