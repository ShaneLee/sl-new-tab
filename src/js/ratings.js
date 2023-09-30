const defaultType = 'WEEK'

function loadPage() {
  getRatings(defaultType)
    .then(createForm);
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
      getRatings(defaultType)
    }
  })
  }
}



window.addEventListener("load", loadPage);
