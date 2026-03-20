function fetchAlbums() {
  api(albumsToListenEndpoint, { method: 'GET', headers: headers })
    .then(res => res.json())
    .then(albums => displayAlbums(albums))
    .catch(err => console.error('Error fetching albums to listen:', err))
}

function displayAlbums(albums) {
  const grid = document.getElementById('albums-grid')
  grid.innerHTML = ''

  albums.forEach(album => {
    const card = document.createElement('a')
    card.className = 'album-card'
    card.href = album.spotifyUrl
    card.target = '_blank'
    card.rel = 'noopener noreferrer'

    const img = document.createElement('img')
    img.src = album.imageUrl
    img.alt = `${album.albumName} by ${album.artistName}`

    const info = document.createElement('div')
    info.className = 'album-card-info'

    const albumName = document.createElement('span')
    albumName.className = 'album-card-title'
    albumName.textContent = album.albumName

    const artistName = document.createElement('span')
    artistName.className = 'album-card-artist'
    artistName.textContent = album.artistName

    info.appendChild(albumName)
    info.appendChild(artistName)
    card.appendChild(img)
    card.appendChild(info)
    grid.appendChild(card)
  })
}

window.onload = () => {
  fetchAlbums()
}
