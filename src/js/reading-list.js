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


function populateTable(vals) {
  const tbody = document.getElementById('reading-list-table');

  // Clear the current content of the tbody
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
      checked.value = val.read;
      notesCell.appendChild(checked)
      row.appendChild(notesCell);

      const createdAt = document.createElement('td');
      createdAt.textContent = new Date(val.createdAtUtc)
      row.appendChild(createdAt);

      tbody.appendChild(row);
  });

}


window.addEventListener("load", getReadingList);
