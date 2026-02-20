function showReminderModal() {
  const modal = document.getElementById('reminderModal')
  if (modal) {
    modal.style.display = 'block'
    // Set reasonable default time (2 hours from now)
    const now = new Date()
    now.setHours(now.getHours() + 2)
    const isoString = now.toISOString().slice(0, 16)
    document.getElementById('reminderAlertTime').value = isoString
  }
}

function closeReminderModal() {
  const modal = document.getElementById('reminderModal')
  if (modal) {
    modal.style.display = 'none'
  }
}

function convertToLocalDateTime(dateTimeString) {
  // Convert datetime-local input to ISO 8601 format for backend
  // Format: "2026-02-20T15:30" -> "2026-02-20T15:30:00"
  return dateTimeString + ':00'
}

function initializeReminderModal() {
  const modal = document.getElementById('reminderModal')
  if (!modal) {
    console.warn('Reminder modal not found in DOM')
    return
  }

  const form = document.getElementById('reminderForm')
  const cancelBtn = document.getElementById('cancelBtn')

  if (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault()

      const description = document.getElementById('reminderDescription').value
      const alertTimeInput = document.getElementById('reminderAlertTime').value

      if (!description || !alertTimeInput) {
        withFeedbackMessage('error', '⚠️ Please fill in all fields')
        return
      }

      const alertTime = convertToLocalDateTime(alertTimeInput)

      try {
        const response = await api(reminderEndpoint, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            description: description,
            alertTime: alertTime,
          }),
          successMessage: '✅ Reminder created successfully',
          failureMessage: '❌ Failed to create reminder',
        })

        if (response.ok) {
          closeReminderModal()
          form.reset()
        }
      } catch (error) {
        console.error('Error creating reminder:', error)
        withFeedbackMessage('error', '❌ Error creating reminder')
      }
    })
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeReminderModal)
  }

  // Close modal when clicking outside of it
  window.addEventListener('click', function (event) {
    if (event.target === modal) {
      closeReminderModal()
    }
  })
}

// Initialize when document is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeReminderModal)
} else {
  initializeReminderModal()
}
