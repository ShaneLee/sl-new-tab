function createTodo(todo) {
  return api(todosEndpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(todo),
  }).then(response =>
    response.status === 200 || response.status === 201 ? response?.json() : null,
  )
}

function shouldDisplayReadingGoalForm(readingGoals, weekNumber, year) {
  const hasThisYear = readingGoals.some(val => val.year === year)
  const nextYear = year + 1
  const hasNextYear = readingGoals.some(val => val.year === nextYear)

  if (hasThisYear && hasNextYear) {
    return null
  }

  if (!hasThisYear && weekNumber < 50) {
    return year
  }

  if (!hasNextYear) {
    return nextYear
  }
  return null
}

function addFormListener(readingGoals) {
  const weekNumber = currentWeekNumber()
  const year = shouldDisplayReadingGoalForm(readingGoals, weekNumber, currentYear())
  if (!year) {
    return
  }

  const title = document.getElementById('readingGoalFormTitle')
  title.innerText = `Set a Reading Goal for ${year}`

  const form = document.getElementById('readingGoalForm')
  const section = document.getElementById('readingGoalFormSection')
  section.classList.remove('hidden')

  form.addEventListener('submit', function (event) {
    event.preventDefault()

    const formData = new FormData(this)
    const jsonObject = {}
    formData.forEach(function (value, key) {
      jsonObject[key] = value
    })

    jsonObject.category = 'reading-goals'
    jsonObject.todo = `Reading Goal ${year}`
    jsonObject.year = year

    createTodo(jsonObject)
  })
}

function getReadingGoals() {
  fetch(todosForCategoryEndpointFn('reading-goals'), {
    method: 'GET',
    headers: headers,
  })
    .then(response => (response.status === 200 ? response?.json() : null))
    .then(val => {
      if (!!val) {
        const container = document.getElementById('grid-container')
        addReadingGoals(val, container)
        addFormListener(val)
      }
    })
}

function addReadingGoals(data, container) {
  data.sort((a, b) => b.year - a.year)

  data.forEach(goal => {
    const progress = (goal.count / goal.targetCount) * 100
    const isComplete = goal.count >= goal.targetCount

    const card = document.createElement('div')
    card.className = 'reading-goals-card'

    const badge = document.createElement('div')
    badge.className = `reading-goals-badge ${isComplete ? 'reading-goals-complete' : ''}`
    badge.innerText = isComplete ? '✓' : `${goal.year}`
    badge.style.background = `var(--complete-${goal.year}-color)`

    const title = document.createElement('h1')
    title.innerText = `Reading Goal ${goal.year}`

    const progressBar = document.createElement('div')
    progressBar.className = 'reading-goals-progress-bar'

    const progressInner = document.createElement('div')
    progressInner.className = 'reading-goals-progress'
    progressInner.style.width = `${(goal.count / goal.targetCount) * 100}%`

    const progressLabel = document.createElement('div')
    progressLabel.className = 'reading-goals-progress-label'
    progressLabel.innerText = `${goal.count}/${goal.targetCount} (${progress.toFixed(1)}%)`

    // if (isComplete) {
    //     const completeLabel = document.createElement('div');
    //     completeLabel.innerText = 'Goal Complete!';
    //     completeLabel.style.color = completeColor;
    //     card.appendChild(completeLabel);
    // }

    progressBar.appendChild(progressInner)
    card.appendChild(badge)
    card.appendChild(title)
    card.appendChild(progressBar)
    card.appendChild(progressLabel)
    container.appendChild(card)
  })
}

window.addEventListener('load', () => {
  getReadingGoals()
})
