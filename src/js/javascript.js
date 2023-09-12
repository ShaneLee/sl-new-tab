host='http://localhost:8080'
quotesEnabled=false
timerEnabled=true
// Should we default to all todos or the current week number
defaultToAll=false

const CATEGORIES_SET = new Set();
const LAST = new Array();

let runningTask;
let timerInterval;

document.addEventListener('keydown', (event) => {
  if (event.key === '~') {
    document.getElementById('main').style.display = 'none'
  }

  // undo
  if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
      const last = LAST.pop()
      if (!!last) {
        uncomplete(last)
      }
  }
})

function loadJSon() {
	const request = new XMLHttpRequest()
	const requestURL = '../data/quotes.json'
	request.open('GET', requestURL)
	request.responseType = 'json'
	request.send()
	request.onload = () => {
		const quotes = request.response
		getQuote(quotes)
	}
}

function getQuote(jsonObj) {
  const randomQuote = pickRandom(jsonObj) 
  printQuote(randomQuote.author, randomQuote.quote)
}

function pickRandom(quotes) {
	return quotes[Math.floor(Math.random() * quotes.length - 1) + 0]
}

function printQuote(quoteAuthor, quote) {
  document.getElementById('quote').innerHTML = quote
  document.getElementById('author').innerHTML = quoteAuthor
}


/***************************************************
 *
 * TIMER
 *
 ***************************************************/

function getRunningTask() {
  fetch(runningTaskEndpoint, {
      method: 'GET',
      headers: headers
      })
  .then(response => response.status === 200 ? response?.json() : null)
  .then(val => {
    if (!!val) {
      runningTask = val;
      updateTask(val)
    }
    else {
      updateTaskButton(false)
    }
  });
}

const stopButton = {
  iconFn: ic => {
    ic.classList.remove("stopped")
    ic.innerHTML = "&#9632;"; // Stop icon (square)"
  },
  btFn: button => {
      button.classList.add("stop");
      button.classList.remove("play");
  }
  
}

const playButton = {
  iconFn: ic => {
    ic.classList.add("stopped")
    ic.innerHTML = "&#9654;"; // Play icon (right-pointing triangle)
  },
  btFn: button => {
      button.classList.add("play");
      button.classList.remove("stop");
  }
}

function updateTaskButton(isPlaying) {
  const button = document.getElementById("task-button");
  const icon = document.getElementById("task-button-icon");

  if (isPlaying) {
    stopButton.iconFn(icon)
    stopButton.btFn(button)
  }
  else {
    playButton.iconFn(icon)
    playButton.btFn(button)
  }

  button.addEventListener("click", function() {
  if (button.classList.contains("play")) {
    stopButton.iconFn(icon)
    stopButton.btFn(button)
    playTask()
  } else if (button.classList.contains("stop")) {
    playButton.iconFn(icon)
    playButton.btFn(button)
    stopTask(runningTask)
  }
  });
}

function playTask() {
  submitTaskForm()
}

function stopTask(task) {
  if (!!task) {
    fetch(stopTaskEndpoint, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(task)
    })
  }
  clearInterval(timerInterval)
  updateTimer(0, 0, 0)
  showTaskInput()
  clearTask()
}

function startNewTask(task) {
  fetch(timeTrackingEndpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(task)
  })
  .then(response => response?.status === 201 ? response : null)
  .then(response => response?.json())
  .then(val => {
    if (!!val) {
      runningTask = val
      updateTask(val)
    }
  })
}

function clearTask() {
  document.getElementById('task-name').innerHTML = ''
}

function showTaskInput() {
  const taskInput = document.getElementById('task-input')
  const projectInput = document.getElementById('project-input')
  const categoryInput = document.getElementById('task-category-input')
  taskInput.style = 'display:""'
  projectInput.style = 'display:""'
  categoryInput.style = 'display:""'
}

function hideTaskInput() {
  const taskInput = document.getElementById('task-input')
  const projectInput = document.getElementById('project-input')
  const categoryInput = document.getElementById('task-category-input')
  taskInput.value = '';
  taskInput.style = 'display:none'
  projectInput.value = '';
  projectInput.style = 'display:none'
  categoryInput.value = '';
  categoryInput.style = 'display:none'
}

function updateTask(task) {
  updateTaskName(task.action)
  hideTaskInput()
  startTimerFromInstant(task.startTime)
  updateTaskButton(true)
}

function updateTaskName(name) {
  const element = document.getElementById("task-name");
  element.textContent = name;
}

function updateTimer(hours, minutes, seconds) {
  const hoursElement = document.getElementById("hours");
  const minutesElement = document.getElementById("minutes");
  const secondsElement = document.getElementById("seconds");

  hoursElement.textContent = typeof hours === 'number' ? hours.toString().padStart(2, "0") : "00";
  minutesElement.textContent = typeof minutes === 'number' ? minutes.toString().padStart(2, "0") : "00";
  secondsElement.textContent = typeof seconds === 'number' ? seconds.toString().padStart(2, "0") : "00";
}

function startTimerFromInstant(instant) {
  const startTime = new Date(instant);

  timerInterval = setInterval(function () {
    const currentTime = new Date();
    const timeDifference = currentTime - startTime;

    const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
    const seconds = Math.floor((timeDifference / 1000) % 60);

    updateTimer(hours, minutes, seconds);
  }, 1000);
}

function submitTaskForm() {
  const taskElement = document.getElementById('task-input');
  const task = taskElement.value
  if (!task) { return; }
  const projectElement = document.getElementById('project-input');
  const categoryElement = document.getElementById('task-category-input');
  const project = projectElement.value;
  const category = categoryElement.value;

  const formData = {
    'action': task,
    'category': category,
    'project': project
  }
  startNewTask(formData)
}


/******************END TIMER ************************/



function deathCountdown() {
  const deathDate = moment('2075-03-28')
  const today = moment()
  const days = deathDate.diff(today, 'days').toLocaleString('en')
  document.getElementById('deathCountdown').innerHTML =
  'You have '.toUpperCase() + days + ' days remaining.'.toUpperCase()
  document.getElementById('title').innerHTML = days + ' Days Left'
  document.title = days
  return Math.abs(today.diff(moment('1994-03-28'), 'weeks'))
}

const todosEndpoint = `${host}/todos`
const completeEndpoint = `${host}/todos/complete`
const uncompleteEndpoint = `${host}/todos/uncomplete`
const categoriesEndpoint = `${host}/todos/categories`
const tempUserId = 'bd11dcc2-77f6-430f-8e87-5839d31ab0e3'

const runningTaskEndpoint = `${host}/tracking/running`
const timeTrackingEndpoint = `${host}/tracking`
const stopTaskEndpoint = `${host}/tracking/stop`

const headers = {
  'Content-Type': 'application/json',
  'tempUserId': tempUserId
}

function uncomplete(todo) {
  fetch(uncompleteEndpoint, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(todo)
  }).then(_ => refreshTodos())
}

function complete(todo) {
  fetch(completeEndpoint, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(todo)
  }).then(_ => refreshTodos())
}

function currentWeekNumber() {
  const currentDate = new Date();
  const startDate = new Date(currentDate.getFullYear(), 0, 1);
  const  days = Math.floor((currentDate - startDate) / (24 * 60 * 60 * 1000));

  const weekNumber = Math.ceil(days / 7);

  return weekNumber
}

function playAudio() {
    new Audio('../sounds/great-success.ogg').play();
}


function refreshTodos() {
  const list = document.getElementById('todos');        
  [... list.children].forEach(val => list.removeChild(val))
  todos()
}

function categories() {
  const categories = document.getElementById('category-input');
  categories.onchange = refreshTodos
  fetch(categoriesEndpoint, {
      method: 'GET',
      headers: headers
      })
  .then(response => response?.json())
  .then(val => {
    const defaultCategory = document.createElement('option');  
    const all = document.createElement('option');  
    defaultCategory.className = 'categories-item';
    all.className = 'categories-item';
      all.innerHTML = 'all'
    const week = `Week ${currentWeekNumber()}`
    if (defaultToAll) {
      categories.appendChild(all)
    }
    else {
      defaultCategory.innerHTML = `Week ${currentWeekNumber()}`
      categories.appendChild(defaultCategory)
      categories.appendChild(all)
    }
    if (!!val) {
      val.filter(category => category !== week)
        .forEach(category => {
          CATEGORIES_SET.add(category)
          const item = document.createElement('option');  
          item.className = 'categories-item';
          item.value = category
          item.innerHTML = category

          categories.style = null
          categories.appendChild(item)
        })
    }
    else {
      categories.style = 'display:none;'
    }

    return ''
  })
  .finally(() => todos());
}

function todoForm() {
  const todoElement = document.getElementById('todo-input');
  const form = document.getElementById('todo-form');
  form.addEventListener('submit', function(event){
      event.preventDefault();
    
      let todo = todoElement.value
      let category = document.getElementById('category-input').value;
      if (todo.startsWith('@')) {
        const split = todo.split('@')
        category = split[1]
        todo = split[2]
        if (!CATEGORIES_SET.has(category)) {
          fetch(categoriesEndpoint, {
              method: 'POST',
              headers: headers,
              body: JSON.stringify({ 'category': category })
          })
        }
      }

      const formData = JSON.stringify({ 'todo': todo, 'category': category === 'all' ? null : category })
      fetch(todosEndpoint, {
          method: 'POST',
          headers: headers,
          body: formData
      })
      .then(response => response?.json())
      .then(val => {
        if (!!val) {
          const list = document.getElementById('todos');        
          addTodo(list, val)
        }
        return ''
      })
      .then(_ => todoElement.value = null)
  });
}


function todos() {
  const category = document.getElementById('category-input').value;

  const endpoint = !!category && category !== 'all' ? `${todosEndpoint}?category=${category}` : todosEndpoint
  fetch(endpoint, {
    method: 'GET', 
    headers: headers
  })
  .then(response => response.json())
  .then(todos => {
      const list = document.getElementById('todos');        
      todos?.forEach(todo => addTodo(list, todo))
  });
}

function addTodo(uL, todo) {
  const xhr = new XMLHttpRequest();
  xhr.open('PATCH', completeEndpoint, false);
  xhr.setRequestHeader('Content-Type', 'application/json')
  xhr.setRequestHeader('tempUserId', tempUserId)

  const listItem = document.createElement('li');  
  listItem.className = 'todo-item';
  listItem.innerHTML = todo.todo;
  listItem.id = todo.id
  listItem.addEventListener('click', () => {
    LAST.push(todo)
    xhr.send(JSON.stringify(todo))
    listItem.style = 'display: none;'
    playAudio()
    return false
  });
  uL.appendChild(listItem);
}

function createGrid(width, height, numToColor) {
  const gridContainer = document.getElementById("grid-container");

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const square = document.createElement("div");
      square.classList.add("square");

      if (numToColor > 0) {
        square.style.backgroundColor = "#8d8271";
        numToColor--;
      }

      gridContainer.appendChild(square);
    }
  }
}




window.onload = function() {
  if (quotesEnabled) {
    loadJSon()
  }
  if (timerEnabled) {
    updateTaskButton(false)
    getRunningTask()
  }
  categories()
  const weeksUsed = deathCountdown()
  let clicked = false
  document.getElementById('deathCountdown').addEventListener('click', () => {
    if (!clicked) {
      createGrid(52, 81, weeksUsed);
      document.getElementById("grid-container").style = 'display: grid';
      clicked = true
    } else {
      // This is noddy
      document.getElementById("grid-container").style = 'display: none';
    }
  });
  todoForm()
}
