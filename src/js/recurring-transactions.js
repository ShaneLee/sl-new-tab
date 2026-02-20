let contextMenu
let selectedRecurringTransaction

function getRecurringTransactions() {
  api(recurringTransactionEndpoint, {
    method: 'GET',
    headers: headers,
  })
    .then(response => (response.status === 200 ? response?.json() : null))
    .then(val => {
      if (!!val) {
        populateRecurringTransactionsTable(val)
      }
    })
    .catch(err => {
      console.error('Error fetching recurring transactions:', err)
      withFeedbackMessage('error', '❌ Failed to load recurring transactions')
    })
}

function populateRecurringTransactionsTable(transactions) {
  const tbody = document.getElementById('recurring-transactions-table')
  tbody.innerHTML = ''

  if (!transactions || transactions.length === 0) {
    const row = tbody.insertRow()
    const cell = row.insertCell(0)
    cell.colSpan = 8
    cell.textContent = 'No recurring transactions found'
    cell.style.textAlign = 'center'
    return
  }

  transactions.forEach(transaction => {
    addRowToRecurringTable(tbody, transaction)
  })
}

function addRowToRecurringTable(tbody, transaction) {
  const row = tbody.insertRow()

  const dayCell = row.insertCell(0)
  dayCell.textContent = transaction.day

  const descriptionCell = row.insertCell(1)
  descriptionCell.textContent = transaction.description

  const categoryCell = row.insertCell(2)
  categoryCell.textContent = transaction.category

  const accountCell = row.insertCell(3)
  accountCell.textContent = transaction.accountAlias

  const amountCell = row.insertCell(4)
  amountCell.textContent = `£${parseFloat(transaction.amount).toFixed(2)}`

  const notesCell = row.insertCell(5)
  notesCell.textContent = transaction.notes || ''

  const fromDateCell = row.insertCell(6)
  fromDateCell.textContent = transaction.fromDate

  const toDateCell = row.insertCell(7)
  toDateCell.textContent = transaction.toDate

  row.addEventListener('contextmenu', function (event) {
    if (!!contextMenu) {
      hideContextMenu()
    }
    showContextMenu(event, transaction)
  })
}

function splitRecurringTransaction(splitRequest) {
  return api(splitRecurringTransactionEndpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(splitRequest),
  })
}

function showContextMenu(event, transaction) {
  if (event.target.tagName.toLowerCase() === 'a') {
    return
  }
  event.preventDefault()
  selectedRecurringTransaction = transaction
  const contextMenuId = 'recurringContextMenu'
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

function showSplitModal() {
  const modal = document.getElementById('splitModal')
  if (modal) {
    modal.style.display = 'block'
    // Set default date to today
    const today = new Date().toISOString().split('T')[0]
    document.getElementById('splitDate').value = today
    // Set pre-filled amount to current amount
    if (selectedRecurringTransaction) {
      document.getElementById('newAmount').value = selectedRecurringTransaction.amount
    }
  }
}

function closeSplitModal() {
  const modal = document.getElementById('splitModal')
  if (modal) {
    modal.style.display = 'none'
  }
}

function addContextMenuListener() {
  contextMenu = document.getElementById('recurringContextMenu')
  const splitRecurringAction = document.getElementById('splitRecurringAction')

  if (splitRecurringAction) {
    splitRecurringAction.addEventListener('click', function () {
      showSplitModal()
      hideContextMenu()
    })
  }

  // Close context menu when clicking elsewhere
  document.addEventListener('click', function () {
    hideContextMenu()
  })
}

function initializeSplitModal() {
  const modal = document.getElementById('splitModal')
  if (!modal) {
    console.warn('Split modal not found in DOM')
    return
  }

  const form = document.getElementById('splitForm')
  const cancelBtn = document.getElementById('cancelSplitBtn')

  if (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault()

      const splitDate = document.getElementById('splitDate').value
      const newAmount = document.getElementById('newAmount').value

      if (!splitDate || !newAmount || !selectedRecurringTransaction) {
        withFeedbackMessage('error', '⚠️ Please fill in all fields')
        return
      }

      const splitRequest = {
        recurringTransactionId: selectedRecurringTransaction.id,
        splitDate: splitDate,
        newAmount: parseFloat(newAmount),
      }

      try {
        const response = await splitRecurringTransaction(splitRequest)

        if (response.ok) {
          withFeedbackMessage('success', '✅ Recurring transaction split successfully')
          closeSplitModal()
          form.reset()
          getRecurringTransactions() // Refresh the table
        } else {
          const errorData = await response.json()
          const message = errorData[0]?.message || 'Failed to split transaction'
          withFeedbackMessage('error', `❌ ${message}`)
        }
      } catch (error) {
        console.error('Error splitting recurring transaction:', error)
        withFeedbackMessage('error', '❌ Error splitting transaction')
      }
    })
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeSplitModal)
  }

  // Close modal when clicking outside of it
  window.addEventListener('click', function (event) {
    if (event.target === modal) {
      closeSplitModal()
    }
  })
}

window.addEventListener('load', function () {
  getRecurringTransactions()
  addContextMenuListener()
  initializeSplitModal()
})
