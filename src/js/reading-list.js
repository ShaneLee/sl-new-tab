function getReadingList() {
  fetch(readingListEndpoint, {
      method: 'GET',
      headers: headers
      })
  .then(response => response.status === 200 ? response?.json() : null)
  .then(val => {
    if (!!val) {
      populateTable(val)
    }
  });
}

function updateReadStatus(val, read) {
  fetch(readingListEndpointReadFn(val.id, read), {
      method: 'PATCH',
      headers: headers
      })
}


function populateTable(vals) {
  const tbody = document.getElementById('reading-list-table');

  tbody.innerHTML = '';

  vals.forEach(val => {
      const row = document.createElement('tr');

      const valCell = document.createElement('td');
      valCell.textContent = val.title;
      row.appendChild(valCell);

      const categoryCell = document.createElement('td');
      categoryCell.textContent = val.url;
      row.appendChild(categoryCell);

      const notesCell = document.createElement('td');
      const checked = document.createElement('input');
      checked.type = 'checkbox'
      checked.checked = val.read;

      checked.addEventListener('change', function() {
          updateReadStatus(val, this.checked);
      });
      notesCell.appendChild(checked)
      row.appendChild(notesCell);

      const createdAt = document.createElement('td');
      createdAt.textContent = new Date(val.createdAtUtc)
      row.appendChild(createdAt);

      tbody.appendChild(row);
  });

}


window.addEventListener("load", getReadingList);
