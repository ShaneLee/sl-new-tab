const userId = tempUserId;
let page = 0;

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
      episodesDiv.appendChild(episodeDiv);
  });
}

function updatePaginationButtons(data) {
    document.getElementById("prevPage").disabled = data.first;
    document.getElementById("nextPage").disabled = data.last;
}

window.onload = () => {
  addEventListeners()
  addPodcastFormListener()
  fetchPodcastEpisodes()
}
