host='http://localhost:8080'

const tempUserId = 'bd11dcc2-77f6-430f-8e87-5839d31ab0e3'
const moodEndpoint = `${host}/mood?rangeType=`

const headers = {
  'Content-Type': 'application/json',
  'tempUserId': tempUserId
}

function loadPage() {
  getRatings('WEEK')
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
      getRatings()
    }
  })
  }
}



window.addEventListener("load", loadPage);
