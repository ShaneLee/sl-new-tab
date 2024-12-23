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
      }
    })
}

function addReadingGoals(data, container) {
  data.sort((a, b) => b.year - a.year)

  data.forEach(goal => {
    const progress = (goal.count / goal.targetCount) * 100
    const isComplete = goal.count >= goal.targetCount
    const completeColor = `var(--complete-${goal.year}-color)`

    const card = document.createElement('div')
    card.className = 'reading-goals-card'

    const badge = document.createElement('div')
    badge.className = `reading-goals-badge ${isComplete ? 'reading-goals-complete' : ''}`
    badge.innerText = isComplete ? '✓' : `${goal.year}`
    if (isComplete) badge.style.background = completeColor

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
