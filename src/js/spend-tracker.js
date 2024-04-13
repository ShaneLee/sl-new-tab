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

    .then(response => response.status === 200 || response.status === 201 ? response?.json() : null)

  });

  const today = new Date().toISOString().split('T')[0];
  // Set the default value of the date input field to today
  document.getElementById('date').value = today;
}

function startOfMonthCurrentDatePair() {
  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const formattedStartOfMonth = `${startOfMonth.getFullYear()}-${(startOfMonth.getMonth() + 1).toString().padStart(2, '0')}-01`;
  const formattedCurrentDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;

  return { 'start': formattedStartOfMonth, 'end': formattedCurrentDate }
}

function getTransactions() {
  const datePair = startOfMonthCurrentDatePair() 

  api(transactionsEndpointFn(datePair.start, datePair.end), {
      method: 'GET',
      headers: headers
      })
  .then(response => response.status === 200 ? response?.json() : null)
  .then(val => {
    if (!!val) {
      populateSpendsTable(val)
    }
  })
  .then(val => api(transactionToDeductEndpoint, {
      method: 'GET',
      headers: headers
      })
  .then(response => response.status === 200 ? response?.json() : null))
  .then(val => {
    if (!!val) {
      populateToDeductTable(val)
    }
  })
  .catch(err => {});
}


function populateSpendsTable(transactions) {
  const tbody = document.getElementById('spend-tracker-table');

  populateTable(tbody, transactions, true);
}

function populateTable(tbody, transactions, shouldGroup) {
  // Clear the current content of the tbody
  tbody.innerHTML = '';

  total = 0
  transactions.forEach(transaction => {
    total = total + transaction.amount
    addTransactionToTable(tbody, transaction);
  });

  addTransactionToTable(tbody, {})
  if (shouldGroup) {
    const grouped = groupTransactions(transactions)
    Object.entries(grouped).forEach(([category, transaction]) => {
        addTransactionToTable(tbody, {
          'amount': transaction.totalAmount,
          'checkboxFn': () => markAsDeductedOrNot(transaction.transactions, true),
          'description': `${category} TOTAL`})
          });
  }

  addTransactionToTable(tbody, {
    'amount': total,
    'noCheckbox': true,
    'description': 'TOTAL'})
}

function groupTransactions(transactions) {
    return transactions.reduce((acc, transaction) => {
        const { category, amount } = transaction;
        if (!acc[category]) {
            acc[category] = { totalAmount: 0, transactions: [] };
        }
        acc[category].totalAmount += amount;
        acc[category].transactions.push(transaction);
        return acc;
    }, {});
}

function populateToDeductTable(transactions) {
  const tbody = document.getElementById('to-deduct-spend-tracker-table');

  populateTable(tbody, transactions, true);
}

function addTransactionToTable(tbody, transaction) {
  const row = document.createElement('tr');

  const dateCell = document.createElement('td');
  dateCell.textContent = transaction.date;
  row.appendChild(dateCell);

  const descriptionCell = document.createElement('td');
  descriptionCell.textContent = transaction.description;
  row.appendChild(descriptionCell);

  const categoryCell = document.createElement('td');
  categoryCell.textContent = transaction.category;
  row.appendChild(categoryCell);

  const accountAliasCell = document.createElement('td');
  accountAliasCell.textContent = transaction.accountAlias;
  row.appendChild(accountAliasCell);

  const amountCell = document.createElement('td');
  amountCell.textContent = transaction.amount && `£${transaction.amount.toFixed(2)}`;
  row.appendChild(amountCell);

  const checkboxCell = document.createElement('td');
  if (!!transaction.description && !transaction.noCheckbox && !transaction.checkboxFn) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = transaction.deducted;
    checkbox.addEventListener('change', () => markAsDeductedOrNot([transaction], checkbox.checked));
    checkboxCell.appendChild(checkbox);
  }
  else if (transaction.checkboxFn) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = false;
    checkbox.addEventListener('change', transaction.checkboxFn);
    checkboxCell.appendChild(checkbox);
  }
  row.appendChild(checkboxCell);

  const notesCell = document.createElement('td');
  notesCell.textContent = transaction.notes || '';
  row.appendChild(notesCell);

  tbody.appendChild(row);

}

function markAsDeductedOrNot(transactions, deducted) {
  const promises = transactions.map(transaction => {
    transaction.deducted = deducted
    api(transactionEndpoint, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(transaction)
    })
    .then(response => response.status === 200 || response.status === 201 ? response?.json() : null)
  });

  return Promise.all(promises)
}


function getSpendCategories() {
  return api(spendCategoriesEndpoint, {
    method: 'GET',
    headers: headers})
  .then(response => response.status === 200 ? response?.json() : null)
  .then(addCategories)
}

function addCategories(categories) {
  if (!categories) {
    return
  }
  const categoryDropdown = document.getElementById('category');

  // Clear existing options
  categoryDropdown.innerHTML = '';

  // Add default option
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Select Category';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  categoryDropdown.appendChild(defaultOption);

  categories.forEach(function(category) {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryDropdown.appendChild(option);
  });
}



window.addEventListener("load", addTransactionFormListener);
window.addEventListener("load", getTransactions);
window.addEventListener("load", getSpendCategories);
