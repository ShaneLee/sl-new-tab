const host='http://localhost:8080'

const tempUserId = 'bd11dcc2-77f6-430f-8e87-5839d31ab0e3'

const type = 'WEEK'
const headers = {
  'Content-Type': 'application/json',
  'tempUserId': tempUserId
}



// Call the function to populate the table when the page loads
window.addEventListener("load", () => getSummary(type));
