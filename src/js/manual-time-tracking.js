function submitTaskForm() {
  const taskElement = document.getElementById('manual-task-input')
  const task = taskElement.value
  if (!task) {
    return
  }
  const projectElement = document.getElementById('manual-project-input')
  const categoryElement = document.getElementById('manual-task-category-input')
  const timeElement = document.getElementById('manual-time-input')
  const project = projectElement.value
  const category = categoryElement.value
  const time = timeElement.value

  const formData = {
    task: task,
    category: category,
    project: project,
    manualTime: time,
  }
  submitManual(formData)
}

function submitManual(task) {
  fetch(manualTimeTrackingEndpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(task),
  })
    .then(response => (response?.status === 201 ? response : null))
    .then(response => response?.json())
    .then(val => {
      if (!!val) {
        clearFormInput()
      }
    })
}

function clearFormInput() {
  const taskInput = document.getElementById('manual-task-input')
  const projectInput = document.getElementById('manual-project-input')
  const categoryInput = document.getElementById('manual-task-category-input')
  const timeInput = document.getElementById('manual-time-input')
  taskInput.value = ''
  projectInput.value = ''
  categoryInput.value = ''
  timeInput.value = ''
}

window.onload = function () {
  const form = document.getElementById('manual-tracking-form')
  form.addEventListener('submit', function (event) {
    event.preventDefault()
    submitTaskForm()
  })
}
