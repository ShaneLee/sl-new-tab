host='http://localhost:8080'
quotesEnabled=false

const CATEGORIES_SET = new Set();
const LAST = new Array();

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
    const all = document.createElement('option');  
    all.className = 'categories-item';
    all.innerHTML = 'all'
    categories.appendChild(all)
    if (!!val) {
      val.forEach(category => {
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
