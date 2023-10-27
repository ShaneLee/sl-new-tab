function addTransactionFormListener() {
  document.getElementById('transactionForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const formData = new FormData(this);
    const jsonObject = {};
    formData.forEach(function(value, key){
      jsonObject[key] = value;
    });

    api(transactionEndpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(jsonObject)
    })

    .then(response => response.status === 200 ? response?.json() : null)

  });

  const today = new Date().toISOString().split('T')[0];
  // Set the default value of the date input field to today
  document.getElementById('date').value = today;
}


window.addEventListener("load", addTransactionFormListener);
