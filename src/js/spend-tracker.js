let contextMenu
let selectedSpend

function createTransaction(spend) {
  return api(transactionEndpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(spend),
  })
}

function updateTransaction(spend) {
  return api(transactionEndpoint, {
    method: 'PUT',
    headers: headers,
    body: JSON.stringify(spend),
  })
}

function deleteTransaction(spend) {
  return api(transactionEndpoint, {
    method: 'DELETE',
    headers: headers,
    body: JSON.stringify(spend),
  })
}

function addTransactionFormListener() {
  document.getElementById('transactionForm').addEventListener('submit', function (event) {
    event.preventDefault()

    const formData = new FormData(this)
    const jsonObject = {}
    formData.forEach(function (value, key) {
      jsonObject[key] = value
    })

    createTransaction(jsonObject).then(response =>
      response.status === 200 || response.status === 201 ? response?.json() : null,
    )
  })

  const today = new Date().toISOString().split('T')[0]
  // Set the default value of the date input field to today
  document.getElementById('date').value = today
}

function monthDates() {
  const currentDate = new Date()

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const formattedStartOfMonth = `${startOfMonth.getFullYear()}-${(startOfMonth.getMonth() + 1).toString().padStart(2, '0')}-01`

  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  const formattedEndOfMonth = `${endOfMonth.getFullYear()}-${(endOfMonth.getMonth() + 1).toString().padStart(2, '0')}-${endOfMonth.getDate().toString().padStart(2, '0')}`

  const formattedCurrentDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`

  return { start: formattedStartOfMonth, end: formattedEndOfMonth, current: formattedCurrentDate }
}

function getTransactions() {
  const dates = monthDates()

  api(transactionsEndpointFn(dates.start, dates.current), {
    method: 'GET',
    headers: headers,
  })
    .then(response => (response.status === 200 ? response?.json() : null))
    .then(val => {
      if (!!val) {
        populateSpendsTable(val)
      }
    })
    .then(val =>
      api(transactionToDeductEndpointFn(dates.end), {
        method: 'GET',
        headers: headers,
      }).then(response => (response.status === 200 ? response?.json() : null)),
    )
    .then(val => {
      if (!!val) {
        populateToDeductTable(val)
        populateToDeductByAccountTable(val)
      }
    })
    .catch(err => {})
}

function populateSpendsTable(transactions) {
  const tbody = document.getElementById('spend-tracker-table')

  populateTable(tbody, transactions, true)
}

function populateTable(tbody, transactions, shouldGroup, groupingFunction) {
  // Clear the current content of the tbody
  tbody.innerHTML = ''

  total = 0
  transactions.forEach(transaction => {
    total = total + transaction.amount
    addTransactionToTable(tbody, transaction)
  })

  addTransactionToTable(tbody, {})
  if (shouldGroup) {
    const grouped = !!groupingFunction
      ? groupingFunction(transaction)
      : groupTransactions(transactions)
    Object.entries(grouped).forEach(([category, transaction]) => {
      addTransactionToTable(tbody, {
        grouped: true,
        amount: transaction.totalAmount,
        checkboxFn: () => markAsDeductedOrNot(transaction.transactions, true),
        description: `${category} TOTAL`,
      })
    })
  }

  addTransactionToTable(tbody, {
    amount: total,
    noCheckbox: true,
    description: 'TOTAL',
  })
}

// tODO use thsi
function groupTransactionsByAccount(transactions) {
  return transactions.reduce((acc, transaction) => {
    const { accountAlias, amount } = transaction
    if (!acc[accountAlias]) {
      acc[accountAlias] = { totalAmount: 0, transactions: [] }
    }
    acc[accountAlias].totalAmount += amount
    acc[accountAlias].transactions.push(transaction)
    return acc
  }, {})
}

function groupTransactions(transactions) {
  return transactions.reduce((acc, transaction) => {
    const { category, amount } = transaction
    if (!acc[category]) {
      acc[category] = { totalAmount: 0, transactions: [] }
    }
    acc[category].totalAmount += amount
    acc[category].transactions.push(transaction)
    return acc
  }, {})
}

function populateToDeductTable(transactions) {
  const tbody = document.getElementById('to-deduct-spend-tracker-table')

  populateTable(tbody, transactions, true)
}

function populateToDeductByAccountTable(transactions) {
  const tbody = document.getElementById('to-deduct-by-account-spend-tracker-table')

  const grouped = groupTransactionsByAccount(transactions)

  tbody.innerHTML = ''

  addTransactionToTable(tbody, {})
  Object.entries(grouped).forEach(([account, transaction]) => {
    console.log(account, transaction)
    addTransactionToTable(tbody, {
      grouped: true,
      amount: transaction.totalAmount,
      checkboxFn: () => markAsDeductedOrNot(transaction.transactions, true),
      description: `${account} TOTAL`,
    })
  })
}

function addTransactionToTable(tbody, transaction) {
  const row = document.createElement('tr')

  const dateCell = document.createElement('td')
  dateCell.textContent = transaction.date
  row.appendChild(dateCell)

  const descriptionCell = document.createElement('td')
  descriptionCell.textContent = transaction.description
  row.appendChild(descriptionCell)

  const categoryCell = document.createElement('td')
  categoryCell.textContent = transaction.category
  row.appendChild(categoryCell)

  const accountAliasCell = document.createElement('td')
  accountAliasCell.textContent = transaction.accountAlias
  row.appendChild(accountAliasCell)

  const amountCell = document.createElement('td')
  amountCell.textContent = transaction.amount && `£${transaction.amount.toFixed(2)}`
  row.appendChild(amountCell)

  const checkboxCell = document.createElement('td')
  if (!!transaction.description && !transaction.noCheckbox && !transaction.checkboxFn) {
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = transaction.deducted
    checkbox.addEventListener('change', () => markAsDeductedOrNot([transaction], checkbox.checked))
    checkboxCell.appendChild(checkbox)
  } else if (transaction.checkboxFn) {
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = false
    checkbox.addEventListener('change', transaction.checkboxFn)
    checkboxCell.appendChild(checkbox)
  }
  row.appendChild(checkboxCell)

  const notesCell = document.createElement('td')
  notesCell.textContent = transaction.notes || ''
  row.appendChild(notesCell)
  const grouped = transaction.grouped
  if (!grouped) {
    row.addEventListener('contextmenu', function (event) {
      if (!!contextMenu) {
        hideContextMenu()
      }
      showContextMenu(event, transaction)
    })
  }

  tbody.appendChild(row)
}

function markAsDeductedOrNot(transactions, deducted) {
  const promises = transactions.map(transaction => {
    transaction.deducted = deducted
    api(transactionEndpoint, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(transaction),
    }).then(response =>
      response.status === 200 || response.status === 201 ? response?.json() : null,
    )
  })

  return Promise.all(promises)
}

function getSpendCategories() {
  return api(spendCategoriesEndpoint, {
    method: 'GET',
    headers: headers,
  })
    .then(response => (response.status === 200 ? response?.json() : null))
    .then(addCategories)
}

function addCategories(categories) {
  if (!categories) {
    return
  }
  const categoryDropdown = document.getElementById('category')

  // Clear existing options
  categoryDropdown.innerHTML = ''

  // Add default option
  const defaultOption = document.createElement('option')
  defaultOption.value = ''
  defaultOption.textContent = 'Select Category'
  defaultOption.disabled = true
  defaultOption.selected = true
  categoryDropdown.appendChild(defaultOption)

  categories.forEach(function (category) {
    const option = document.createElement('option')
    option.value = category
    option.textContent = category
    categoryDropdown.appendChild(option)
  })
}

function addContextMenuListener() {
  contextMenu = document.getElementById('spendContextMenu')
  const deleteAction = document.getElementById('deleteAction')
  const changeCategoryAction = document.getElementById('changeCategoryAction')
  const changeAccountAction = document.getElementById('changeAccountAction')
  const changeAmountAction = document.getElementById('changeAmountAction')
  const changeDescriptionAction = document.getElementById('changeDescriptionAction')
  const createRefundAction = document.getElementById('createRefundAction')

  deleteAction.addEventListener('click', function () {
    deleteTransaction(selectedSpend)
    selectedSpend = null
    hideContextMenu()
  })

  changeCategoryAction.addEventListener('click', function () {
    const spend = selectedSpend
    const category = prompt('Enter the new category:')
    if (!!category) {
      spend.category = category
      updateTransaction(spend)
    }
    selectedSpend = null
    hideContextMenu()
  })

  changeDescriptionAction.addEventListener('click', function () {
    const spend = selectedSpend
    const description = prompt('Enter the new description:', spend.description)
    if (!!description) {
      spend.description = description
      updateTransaction(spend)
    }
    selectedSpend = null
    hideContextMenu()
  })

  changeAmountAction.addEventListener('click', function () {
    const spend = selectedSpend
    const amount = prompt('Enter the new amount:')
    if (!!amount) {
      spend.amount = amount
      updateTransaction(spend)
    }
    selectedSpend = null
    hideContextMenu()
  })

  createRefundAction.addEventListener('click', function () {
    const spend = selectedSpend
    spend.id = null
    const amount = prompt('If partial refund enter negative amount')
    if (!!amount) {
      spend.amount = amount
      spend.description = `PARTIAL REFUND: ${spend.description}`
    } else {
      spend.description = `REFUND: ${spend.description}`
      spend.amount = -spend.amount
    }
    createTransaction(spend)
    selectedSpend = null
    hideContextMenu()
  })

  changeAccountAction.addEventListener('click', function () {
    const spend = selectedSpend
    const accountAlias = prompt('Enter the new account alias:')
    if (!!accountAlias) {
      spend.accountAlias = accountAlias
      updateTransaction(spend)
    }
    selectedSpend = null
    hideContextMenu()
  })

  // Event listener to hide context menu on window click
  window.addEventListener('click', function () {
    hideContextMenu()
  })
}

function showContextMenu(event, spend) {
  // Check if the right-click occurred outside of an 'a' tag
  if (event.target.tagName.toLowerCase() === 'a') {
    return
  }
  event.preventDefault()
  selectedSpend = spend
  const contextMenuId = 'spendContextMenu'
  contextMenu = document.getElementById(contextMenuId)

  // Ensure the context menu is visible before retrieving dimensions
  contextMenu.style.display = 'block'

  const contextMenuWidth = contextMenu.offsetWidth
  const contextMenuHeight = contextMenu.offsetHeight
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let left = event.clientX
  let top = event.clientY

  // Adjust left position if the context menu goes off the right edge
  if (left + contextMenuWidth > viewportWidth) {
    left = viewportWidth - contextMenuWidth
  }

  // Adjust top position if the context menu goes off the bottom edge
  if (top + contextMenuHeight > viewportHeight) {
    top = viewportHeight - contextMenuHeight
  }

  // Ensure the top position is never negative
  top = Math.max(top, 0)

  contextMenu.style.left = `${left}px`
  contextMenu.style.top = `${top}px`

  event.stopPropagation()
}

function hideContextMenu() {
  if (!!contextMenu) {
    contextMenu.style.display = 'none'
    contextMenu = null
  }
}

window.addEventListener('load', addTransactionFormListener)
window.addEventListener('load', getTransactions)
window.addEventListener('load', getSpendCategories)
window.onload = function () {
  addContextMenuListener()
}
