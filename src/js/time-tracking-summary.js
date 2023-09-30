function getSummary(type, containerElement) {
  return fetch(taskSummaryEndpoint(type), {
      method: 'GET',
      headers: headers
      })
  .then(response => response.status === 200 ? response?.json() : null)
  .then(val => {
    if (!!val) {
      renderTimeTrackingSummaryFromData(val, containerElement)
      return val
    }
  });
}

function renderTimeTrackingSummaryFromData(data, containerElement) {
    createTimeTrackingSummaryTable(containerElement || document.getElementById('summaryContainerDiv'))
    populateSummaryTable(data)
}

function createTimeTrackingSummaryTable(containerElement) {

    const table = document.createElement('table');
    table.classList.add('time-tracking-summary'); // Add the CSS class to the table

    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    tbody.id = 'summaryTableBody';

    const tr = document.createElement('tr');
    const th1 = document.createElement('th');
    th1.textContent = 'Project';
    const th2 = document.createElement('th');
    const th3 = document.createElement('th');
    th3.textContent = 'Total Time Tracked';

    tr.appendChild(th1);
    tr.appendChild(th2);
    tr.appendChild(th3);
    thead.appendChild(tr);

    table.appendChild(thead);
    table.appendChild(tbody);

    containerElement.appendChild(table);
}

function secondsToHHMMSS(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const remainingSeconds = seconds % 60;
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
        }
    

function populateSummaryTable(timeTrackingSummary) {
    const tableBody = document.getElementById("summaryTableBody");
    let html = '';

    for (const [projectName, projectSummary] of Object.entries(timeTrackingSummary.projectSummaryByProject)) {
        html += `<tr><td><strong>${projectName}</strong></td><td></td><td>${secondsToHHMMSS(projectSummary.totalSecondsTracked)}</td></tr>`;
        html += `<tr><td><em>Category</em></td><td><em>Task</em></td><td></td></tr>`;

        projectSummary.categories.forEach(category => {
            html += `<tr><td>${category.categoryName}</td><td></td><td>${secondsToHHMMSS(category.totalSecondsTracked)}</td></tr>`;
            
            category.tasks.forEach(task => {
                html += `<tr><td></td><td>${task.task}</td><td>${secondsToHHMMSS(task.totalSecondsTracked)}</td></tr>`;
            });
        });
    }

  tableBody.innerHTML = html; 
}
