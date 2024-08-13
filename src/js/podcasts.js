const userId = tempUserId;
let page = 0;
let podcastPage = 0;
let contextMenu;
let selectedEpisode;
let selectedPodcast;

function addFindEpisodesContextListener() {
  const podcastId = selectedPodcast.id
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set('podcastId', podcastId);
  window.location.href = currentUrl.toString();
}

function unsubscribe() {
  const podcastId = selectedPodcast.id
  return api(podcastSubscribeEndpoint, {
      method: 'DELETE',
      headers: headers,
      body: JSON.stringify({'id': podcastId})
      })
}

function addContextMenuListener() {

  contextMenu = document.getElementById('podcastEpisodeContextMenu');
  const trackAction = document.getElementById('trackAction');

  trackAction.addEventListener('click', function() {
    markAsListened(selectedEpisode.id)
    selectedEpisode = null
    hideContextMenu();
  });

  contextMenu = document.getElementById('podcastEpisodeContextMenu');

  const unsubscribeAction = document.getElementById('unsubscribeAction')

  unsubscribeAction.addEventListener('click', unsubscribe)

  const findEpisodesAction = document.getElementById('findEpisodesAction')

  findEpisodesAction.addEventListener('click', addFindEpisodesContextListener)

  // Event listener to hide context menu on window click
  window.addEventListener('click', function() {
    hideContextMenu();
  });
}

function addPodcastFormListener() {
  document.getElementById('podcastForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const formData = new FormData(this);
    const jsonObject = {};
    formData.forEach(function(value, key){
      jsonObject[key] = value;
    });

    subscribe(jsonObject.url)
      .then(response => response.status === 200 || response.status === 201 ? response?.json() : null)

  });
}

function markAsListened(episodeId) {
  return api(podcastTrack, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify({'episodeId':episodeId})
      })
}

function subscribe(url) {
  return api(podcastSubscribeEndpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({'url': url})
      })
}


function addEventListeners() {
  document.getElementById("prevPage").addEventListener("click", () => {
      if (page > 0) {
          page--;
          fetchPodcastEpisodes();
      }
  });

  document.getElementById("nextPage").addEventListener("click", () => {
      page++;
      fetchPodcastEpisodes();
  });

}

function fetchSubscribedPodcasts() {
  const size = 50;

  api(podcastAllSubsribedEndpointFn(page, size), {
      method: 'GET',
      headers: headers
      })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            displayPodcasts(data.content);
            //updatePodcastPaginationButtons(data);
        })
        .catch(error => {
            console.error("Error fetching podcast episodes:", error);
        });
}

function fetchPodcastEpisodesByPodcastId(podcastId) {
  const size = 50;

  api(podcastEpisodesEndpointFn(podcastId, page, size), {
      method: 'GET',
      headers: headers
  })
  .then(response => {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
      displayEpisodes(data.content);
      updatePaginationButtons(data);
  })
  .catch(error => {
      console.error("Error fetching podcast episodes by podcastId:", error);
  });
}

function fetchPodcastEpisodes() {
  const size = 50;
  const sort = "publishedDate,desc";

  api(podcastNewEpisodesEndpointFn(page, size, sort), {
  // api(podcastAllSubsribedEpisodesEndpointFn(page, size, sort), {
      method: 'GET',
      headers: headers
      })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            displayEpisodes(data.content);
            updatePaginationButtons(data);
        })
        .catch(error => {
            console.error("Error fetching podcast episodes:", error);
        });
}

function displayPodcasts(podcasts) {
  const podcastsTable = document.getElementById("podcastsTable");
  podcasts.forEach(podcast => {
    addPodcastToTable(podcastsTable, podcast)
  })
}

function addPodcastToTable(tbody, podcast) {
  const row = document.createElement('tr');

  const imgCell = document.createElement('td');
  imgCell.innerHtml = `<img src="${podcast.coverUrl}" alt="Cover Image" />`
  row.appendChild(imgCell);
      

  const titleCell = document.createElement('td');
  titleCell.textContent = podcast.podcastTitle;
  row.appendChild(titleCell);

  const subcribedAtCell = document.createElement('td');
  subcribedAtCell.textContent = new Date(podcast.createdAtUtc);
  row.appendChild(subcribedAtCell);

  row.addEventListener('contextmenu', function(event) {
    if (!!contextMenu) {
      hideContextMenu()
    }
    showContextMenu(event,
      podcast,
      (val) => { selectedPodcast = val },
      'podcastContextMenu');
  });

  tbody.appendChild(row);

}
function displayEpisodes(episodes) {
  const episodesDiv = document.getElementById("episodes");
  episodesDiv.innerHTML = "";

  episodes.forEach(episode => {
    const episodeDiv = document.createElement("div");
    episodeDiv.classList.add("episode");
    episodeDiv.innerHTML = `
      <img src="${episode.coverUrl}" alt="Cover Image" />
      <h3>${episode.episodeTitle}</h3>
      <p>Published Date: ${new Date(episode.publishedDate).toLocaleDateString()}</p>
      <audio controls>
          <source src="${episode.url}" type="audio/mpeg">
          Your browser does not support the audio element.
      </audio>
    `;

    const audioElement = episodeDiv.querySelector('audio');

    audioElement.addEventListener('ended', function() {
      markAsListened(episode.id)
    });

    episodeDiv.addEventListener('contextmenu', function(event) {
      if (!!contextMenu) {
        hideContextMenu()
      }
      showContextMenu(event,
        episode,
        (val) => { selectedEpisode = val },
        'podcastEpisodeContextMenu');
    });
      episodesDiv.appendChild(episodeDiv);
  });
}

function showContextMenu(event, val, setterFn, contextMenuId) {
  // Check if the right-click occurred outside of an 'a' tag
  if (event.target.tagName.toLowerCase() === 'a') {
    return;
  }
  event.preventDefault();
  setterFn(val)
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

function updatePaginationButtons(data) {
  document.getElementById("prevPage").disabled = data.first;
  document.getElementById("nextPage").disabled = data.last;
}

function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  const results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

window.onload = () => {
  const podcastId = getUrlParameter('podcastId')
  if (podcastId) {
    fetchPodcastEpisodesByPodcastId(podcastId)
  }
  else {
    fetchPodcastEpisodes()
    fetchSubscribedPodcasts()
  }
  addEventListeners()
  addPodcastFormListener()
  addContextMenuListener()
}
