document.addEventListener('keydown', (event) => {
  if (event.key === '~') {
    document.getElementById('main').style.display = 'none'
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
		deathCountdown()
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
}

const todosEndpoint = 'http://localhost:8080/todos'
const completeEndpoint = 'http://localhost:8080/todos/complete'



function todoForm() {
  const form = document.getElementById('todo-form');
  form.addEventListener('submit', function(event){
      event.preventDefault();
    
      const todo = document.getElementById('todo-input').value;
      const category = document.getElementById('category-input').value;
      const formData = JSON.stringify({ 'todo': todo, 'category': category })
      fetch(todosEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: formData
      })
      .then(response => response?.json())
      .then(val => {
        if (!!val) {
          const list = document.getElementById('todos');        
          addTodo(list, val)
        }
      });
  });
}


function todos() {
  fetch(todosEndpoint, {method: 'GET'})
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

  const listItem = document.createElement('li');  
  listItem.className = 'todo-item';
  listItem.innerHTML = todo.todo;
  listItem.id = todo.id
  listItem.addEventListener('click', () => {
    xhr.send(JSON.stringify(todo))
    listItem.style = 'display: none;'
    return false
  });
  uL.appendChild(listItem);
}


window.onload = function() {
  loadJSon()
  todos()
  todoForm()
}
