host='http://localhost:8080'

const tempUserId = 'bd11dcc2-77f6-430f-8e87-5839d31ab0e3'

const moodEndpoint = `${host}/mood?rangeType=`
const reviewEndpoint = `${host}/review`
const reviewEndpointFn = date => `${host}/review?reviewDate=${date}`
const tempFormId = '91f2994f-2446-459c-806d-f99387fd2f1c'
const formEndpoint = `${host}/review/form?formId=${tempFormId}`
const todoReviewEndpoint = (type, category) => `${host}/todos/review?type=${type}${category && `&category=${category}`}`

const reviewLink = date => `chrome-extension://gplimlhmjfiokbijcgiokhjofgdhlplj/template/review.html?date=${date}`

const headers = {
  'Content-Type': 'application/json',
  'tempUserId': tempUserId
}

let weekNumber
let formReviewId = getFormId();
let formIdTitle = `Review ${formReviewId.replace('-week-', ' Week ')}`

let todoReviewSummary
let timeTrackingSummary

function getQueryParam(paramName) {
    const params = new URLSearchParams(window.location.search);
    return params.get(paramName);
}



function loadPage() {
  const dateParam = getQueryParam("date");
  const typeParam = getQueryParam("type") || "WEEK";
  if (dateParam) {
      new Date(dateParam)
      getCompletedReviewForWeek(dateParam)
  } else {
      getReviewForm(typeParam)
  }
}

function getCompletedReviewForWeek(dateParam) {
  return fetch(reviewEndpointFn(dateParam), {
      method: 'GET',
      headers: headers,
  })
  .then(response => response?.json())
  .then(val => {
    if (!!val) {
      renderMoodForType("WEEK")
      const todoListsElement = getTodoListsElement()
      renderTodos(val.responses.todoReviewSummary, todoListsElement)
      renderTimeTrackingSummaryFromData(val.responses.timeTrackingSummary, todoListsElement)
      renderReponses(val.responses, todoListsElement)
    }
  })

}

function renderReponses(responses, containerElement) {
  for (let key in responses) {
    if (key.includes('-')) {
        const h2Element = document.createElement('h2');
        h2Element.textContent = formatSection(key);

        const pElement = document.createElement('p');
        pElement.textContent = responses[key];

        containerElement.appendChild(h2Element);
        containerElement.appendChild(pElement);
    }
  }
}

function getFormConfig() {
  return fetch(formEndpoint, {
      method: 'GET',
      headers: headers,
  })
  .then(response => response?.json())
}

function renderTimeTrackingSummary(type) {
  const todoListsElement = getTodoListsElement()
  getSummary(type, todoListsElement) 
    .then(val => {
      timeTrackingSummary = val
    })
}

function getReviewForm(typeParam) {
  getFormConfig()
    .then(renderForm)
    .then(val => renderMoodForType(typeParam))
    .then(val => renderTodosForType(typeParam))
    .then(val => renderTimeTrackingSummary(typeParam))
}

function renderMoodForType(type) {
   getMoodRatingsForType(type)
}

function renderTodosForType(type) {
  const todoListsElement = getTodoListsElement()
  fetch(todoReviewEndpoint(type, `Week ${weekNumber}`), {
      method: 'GET',
      headers: headers,
  })
  .then(response => response?.json())
  .then(val => renderTodos(val, todoListsElement))
}


function renderTodos(todos, todoListsElement) {
  renderTodoSummary(todos, todoListsElement)
  const sections = ["createdBeforePeriodStart", "createdDuringPeriod", "completed", "uncomplete"];
  sections.forEach(val => renderTodoLists(val, todos, todoListsElement));
  todoReviewSummary = todos
}

function renderTodoSummary(todos, todoListsElement) {
  const totalTodos = todos.createdDuringPeriod.length;
  const totalCompleted = todos.completed.length;
  const totalUncompleted = todos.uncomplete.length;
  let percentageCompleteOfPlanned = 0;
  let percentageComplete = Math.round((totalCompleted  / totalTodos) * 100);

  if (todos.createdBeforePeriodStart.length > 0) {
    const completedBeforePeriodStart = todos.createdBeforePeriodStart.filter(todo => todo.complete).length;
    percentageCompleteOfPlanned = Math.round((completedBeforePeriodStart / todos.createdBeforePeriodStart.length) * 100);
  }


  const flexContainer = document.createElement('div');
  flexContainer.style.display = 'flex';
  flexContainer.style.justifyContent = 'space-between'; // separates children
  flexContainer.style.alignItems = 'center'; // vertically aligns children in the center


  const statsDiv = document.createElement('div');
  statsDiv.innerHTML = `
    <strong>Total Todos:</strong> ${totalTodos} <br>
    <strong>Completed Todos:</strong> ${totalCompleted} <br>
    <strong>Uncompleted Todos:</strong> ${totalUncompleted} <br>
    <strong>Percentage Complete:</strong> ${percentageComplete}% <br>
    <strong>Planned Complete / Uncomplete:</strong> ${percentageCompleteOfPlanned}%
  `;

  flexContainer.appendChild(statsDiv)

  const canvasContainer = document.createElement('div');
  canvasContainer.style.width = '200px';
  canvasContainer.style.height = '200px';
  const canvas = document.createElement('canvas');
  canvas.id = 'todosPieChart';
  canvasContainer.appendChild(canvas);
  flexContainer.appendChild(canvasContainer);
  const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Completed', 'Uncompleted'],
        datasets: [{
          data: [totalCompleted, totalUncompleted],
          backgroundColor: ['#4CAF50', '#eb1c4c'],  // Example colors: green for completed, amber for uncompleted
        }]
      },
      options: {
        title: {
          display: true,
          text: 'Todos Distribution'
        }
      }
    });

    todoListsElement.appendChild(flexContainer)
}

function formatSection(str) {
  return str
    .replaceAll('-', ' ')
    // Insert a space before all caps
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Uppercase the first character of each word
    .replace(/\b[a-z]/g, char => char.toUpperCase());

}

function renderTodoLists(section, todos, todoListsElement) {
    const sectionTitleElement = document.createElement('h2');

    sectionTitleElement.innerHTML = `${formatSection(section)}`;

    const ulElement = document.createElement('ul');
    ulElement.id = section;

    // Hide the lists for "createdBeforePeriodStart" and "createdDuringPeriod" by default
    if (["createdBeforePeriodStart", "createdDuringPeriod"].includes(section)) {
      // Prefix the header with ► by default
        sectionTitleElement.innerHTML = `&rtrif; ${formatSection(section)}`;
        ulElement.style.display = 'none';
    }

    todos[section].forEach(item => {
        const li = document.createElement('li');

        // Prepend status emoji
        let status = " "; // Default to no emoji
        if (item.complete) {
            status = "✅ ";
        } else {
            status = "❌ ";
        }

        li.textContent = `${status}${item.todo} `;

        // Create and append category element
        const categorySpan = document.createElement('span');
        categorySpan.className = "review-category";
        categorySpan.setAttribute('data-category', item.category);
        categorySpan.textContent = item.category;
        li.appendChild(categorySpan);

        ulElement.appendChild(li);
    });

    if (["createdBeforePeriodStart", "createdDuringPeriod"].includes(section)) {
        sectionTitleElement.addEventListener('click', function() {
            if (ulElement.style.display === 'none') {
                ulElement.style.display = 'block';
                sectionTitleElement.innerHTML = `&dtrif; ${formatSection(section)}`; // Update arrow to ▼
            } else {
                ulElement.style.display = 'none';
                sectionTitleElement.innerHTML = `&rtrif; ${formatSection(section)}`; // Update arrow to ►
            }
        });
    }

    todoListsElement.appendChild(sectionTitleElement);
    todoListsElement.appendChild(ulElement);
}


function getFormId() {
  const now = new Date();
  let year = now.getFullYear();

  const start = new Date(year, 0, 1);
  const dayOfYear = Math.floor((now - start + 86400000) / 86400000);

  // Get the ISO week day: 1 (Mon) to 7 (Sun)
  const dayOfWeek = (now.getDay() || 7);

  // Compute the ISO week number
  weekNumber = Math.floor((dayOfYear - dayOfWeek + 10) / 7);

  if (weekNumber === 0) {
      // This means the date belongs to the last week of the previous year.
      year -= 1;
      weekNumber = 52 + ((new Date(year, 0, 1).getDay() || 7) > 4);
  } else if (weekNumber === 53 && new Date(year, 0, 1).getDay() > 1) {
      // This means the date belongs to the first week of the next year.
      weekNumber = 1;
      year += 1;
  }

  return `${year}-week-${weekNumber}`;
}

function renderForm(formConfig) {
    const form = document.createElement('form');
    form.id = 'reviewForm';

    formConfig.fields.forEach(field => {
        const labelElement = document.createElement('label');
        labelElement.innerText = field.label;

        let inputElement;
        switch(field.type) {
            case 'textarea':
                inputElement = document.createElement('textarea');
                inputElement.name = field.name;
                break;
            case 'rating':
                inputElement = createRatingElement(field.name);
                break;
            default:
                inputElement = document.createElement('input');
                inputElement.type = field.type;
                inputElement.name = field.name;
                break;
        }

        form.appendChild(labelElement);
        form.appendChild(inputElement);
    });

    const submitButton = document.createElement('button');
    submitButton.type = "submit";
    submitButton.innerText = "Submit";
    form.appendChild(submitButton);


    const container = document.getElementById('review-container');
    const formTitle = document.getElementById('review-page-title')
    const lastReviewLink = document.getElementById('previous-review-link')
    lastReviewLink.href = reviewLink(lastReviewDate())
    const formStatus = document.createElement('H3')
    formStatus.id = 'reviewFormStatus'
    formTitle.innerHTML = formIdTitle

    container.appendChild(formStatus); 
    container.appendChild(form); 

    form.addEventListener('submit', event => reviewFormSubmit(event, formConfig));
}

function lastReviewDate() {
  // It might just be simpler to have a type LAST and let the backend find it
  let today = new Date();
  let sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7)
  return sevenDaysAgo.toISOString().split('T')[0];
}

function getFormValues(formId) {
  const form = document.getElementById(formId);
  const formData = new FormData(form);
  const result = {};

  for (let [name, value] of formData.entries()) {
      result[name] = value;
  }

  return result;
}

function reviewFormSubmit(event, formConfig) {
  event.preventDefault();

  const formValues = getFormValues('reviewForm')
  const formData = JSON.stringify({
    'responses': {...formValues, todoReviewSummary, timeTrackingSummary},
    'formConfigId': formConfig.id,
    'id': formReviewId
  })
  fetch(reviewEndpoint, {
      method: 'POST',
      headers: headers,
      body: formData
  })
  .then(val => {
    if (val.status === 201) {
      updateFormStatus('Submitted successfully')

    }
    else {
      updateFormStatus('Failed to submit')
    }
  })

}

function updateFormStatus(result) {
  const formStatus = document.getElementById('reviewFormStatus')
  formStatus.innerHTML = result
}

function getTodoListsElement() {
  return document.getElementById('todoReview');
}

function createRatingElement(name) {
    const ratingDiv = document.createElement('div');
    ratingDiv.className = 'rating-group';

    for (let i = 1; i <= 5; i++) {
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.value = i.toString();
        radio.name = name;
        radio.id = `rating-${name}-${i}`;

        const label = document.createElement('label');
        label.setAttribute('for', `rating-${name}-${i}`);
        label.innerText = i.toString();

        ratingDiv.appendChild(radio);
        ratingDiv.appendChild(label);
    }

    return ratingDiv;
}

window.addEventListener("load", loadPage);
