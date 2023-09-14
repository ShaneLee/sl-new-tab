host='http://localhost:8080'
function getSummary() {
  fetch(taskSummaryEndpoint, {
      method: 'GET',
      headers: headers
      })
  .then(response => response.status === 200 ? response?.json() : null)
  .then(val => {
    if (!!val) {
      populateSummaryTable(val)
    }
  });
}

const tempUserId = 'bd11dcc2-77f6-430f-8e87-5839d31ab0e3'

const type = 'WEEK'
const taskSummaryEndpoint = `${host}/tracking/summary?type=${type}`

const headers = {
  'Content-Type': 'application/json',
  'tempUserId': tempUserId
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
            const projectFormattedTime = secondsToHHMMSS(projectSummary.totalSecondsTracked)
            html += `<tr><td>${projectName}</td><td></td><td></td><td>${projectFormattedTime}</td></tr>`;

            projectSummary.categories.forEach(category => {
                const categoryformattedTime = secondsToHHMMSS(category.totalSecondsTracked)
                html += `<tr><td></td><td>${category.categoryName}</td><td></td><td>${categoryformattedTime}</td></tr>`;
                
                category.tasks.forEach(task => {
                    const formattedTime = secondsToHHMMSS(task.totalSecondsTracked)
                    html += `<tr><td></td><td></td><td>${task.task}</td><td>${formattedTime}</td></tr>`;
                });
            });
        }

        tableBody.innerHTML = html;

}

// Call the function to populate the table when the page loads
window.addEventListener("load", getSummary);
