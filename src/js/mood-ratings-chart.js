let chart;

function getMoodRatingsForType(type) {
  return getRatings(type)
}

function getRatings(type) {
  return fetch(moodEndpoint + type, {
      method: 'GET',
      headers: headers
      })
  .then(response => response.status === 200 ? response?.json() : null)
  .then(val => {
    if (!!val) {
      populateRatings(val)
      return val
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
