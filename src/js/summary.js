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
    

function populateSummaryTable(summaryData) {
    const tableBody = document.getElementById("summaryTableBody");

    for (const project in summaryData.projectSummaryByProject) {
        const projectSummary = summaryData.projectSummaryByProject[project];

        for (const category in projectSummary.secondsTrackedByCategory) {
            const totalSeconds = projectSummary.secondsTrackedByCategory[category];
            const formattedTime = secondsToHHMMSS(totalSeconds);

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${project}</td>
                <td>${category}</td>
                <td>${formattedTime}</td>
            `;

            tableBody.appendChild(row);
        }
    }
}

// Call the function to populate the table when the page loads
window.addEventListener("load", getSummary);
