host='http://localhost:8080'

const tempUserId = 'bd11dcc2-77f6-430f-8e87-5839d31ab0e3'

const moodEndpoint = `${host}/mood?rangeType=WEEK`

const headers = {
  'Content-Type': 'application/json',
  'tempUserId': tempUserId
}

let chart; 

function loadPage() {
  getRatings()
    .then(createForm);
}

function getRatings() {
  return fetch(moodEndpoint, {
      method: 'GET',
      headers: headers
      })
  .then(response => response.status === 200 ? response?.json() : null)
  .then(val => {
    if (!!val) {
      populateRatings(val)
    }
  })
}


function populateRatings(data) {
  const ratings = data.map(d => d.rating);
  const timestamps = data.map(d => new Date(d.createdAt).toLocaleDateString());
  const dataset = {
      label: 'Mood',
      borderColor: '#e7b91b',
      data: ratings,
      fill: true,
      tension: 0.3
  }

  const ctx = document.getElementById('ratingsChart').getContext('2d');
  if (chart) {
    chart.data.labels = timestamps
    chart.data.datasets[0] = dataset
    chart.update()
  }
  else {
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timestamps,
            datasets: [dataset]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            scales: {
                y: {
                    beginAtZero: false,
                    min: 1,
                    max: 5,
                    ticks: {
                      stepSize: 1,
                      precision: 0
                    }
                }
            }
        }
    });
  }

}

function createForm() {
  document.getElementById('ratingForm').addEventListener('submit', function(e) {
      e.preventDefault();

      const formData = new FormData(e.target);
      const rating = formData.get('rating');
      const notes = formData.get('notes');

      submitRating(rating, notes)
        .then(val => notes.value = '');
  });

  function submitRating(rating, notes) {
    return fetch(moodEndpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({'rating': rating, 'notes': notes})
    })
  .then(response => response?.status === 201 ? response : null)
  .then(response => response?.json())
  .then(val => {
    if (!!val) {
      getRatings()
    }
  })
  }
}



window.addEventListener("load", loadPage);
