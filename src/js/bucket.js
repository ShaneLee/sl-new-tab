function getIdeas() {
  fetch(bucketEndpoint, {
      method: 'GET',
      headers: headers
      })
  .then(response => response.status === 200 ? response?.json() : null)
  .then(val => {
    if (!!val) {
      populateIdeaTable(val)
    }
  });
}

function addIdeaFormListener() {
  document.getElementById('ideaForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const formData = new FormData(this);
    const jsonObject = {};
    formData.forEach(function(value, key){
      jsonObject[key] = value;
    });

    api(bucketEndpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(jsonObject)
    })

    .then(response => response.status === 200 || response.status === 201 ? response?.json() : null)
  });
}


function populateIdeaTable(ideas) {
  const tbody = document.getElementById('idea-bucket-table');

  // Clear the current content of the tbody
  tbody.innerHTML = '';

  ideas.forEach(idea => {
      const row = document.createElement('tr');

      const ideaCell = document.createElement('td');
      ideaCell.textContent = idea.idea;
      row.appendChild(ideaCell);

      const categoryCell = document.createElement('td');
      categoryCell.textContent = idea.category;
      row.appendChild(categoryCell);

      const notesCell = document.createElement('td');
      if (idea.notes && idea.notes.length > 50) {
          notesCell.textContent = idea.notes.substring(0, 47) + '...';
      } else {
          notesCell.textContent = idea.notes || '';
      }
      row.appendChild(notesCell);

      row.addEventListener('click', () => {
          // Assuming a separate HTML page named 'details.html' that will handle displaying the form
          // We pass the idea ID via URL parameter so that we can fetch and display the details
          window.location.href = 'details.html?id=' + idea.id;
      });

      tbody.appendChild(row);
  });

}


window.addEventListener("load", getIdeas);
window.addEventListener("load", addIdeaFormListener);
