quotesEnabled=false
timerEnabled=true
slideEnabled=false
spendTrackingEnabled=true
// Should we default to all todos or the current week number
defaultToAll=false
const withEmojis=true

const CATEGORIES_SET = new Set();
const LAST = new Array();

const DEFAULT_RANK = 1000

let runningTask;
let timerInterval;
let contextMenu;
let TODOS_SET = new Set()

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

function startOfMonthCurrentDatePair() {
  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const formattedStartOfMonth = `${startOfMonth.getFullYear()}-${(startOfMonth.getMonth() + 1).toString().padStart(2, '0')}-01`;
  const formattedCurrentDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;

  return { 'start': formattedStartOfMonth, 'end': formattedCurrentDate }
}

// TODO call
function getTotalMonthSpend() {
  const datePair = startOfMonthCurrentDatePair() 

  api(transactionsEndpointFn(datePair.start, datePair.end), {
      method: 'GET',
      headers: headers
      })
  .then(response => response.status === 200 ? response?.json() : null)
  .then(val => {
    if (!!val) {
      updateMonthSpend(val)
    }
  }).catch(err => {});
}

function updateMonthSpend(transactions) {
  // TODO maybe I should have an endpoint to get the month spend
  const monthSpend = transactions
    .map(val => val.amount)
    .reduce((a, b) => a + b);
  document.getElementById('totalMonthSpend').innerHTML = `Total Month Spend £${formatNumberToTwoDecimalPlaces(monthSpend)}`
}

function formatNumberToTwoDecimalPlaces(number) {
    if (typeof number !== 'number') {
        throw new Error('Input must be a number');
    }
    return number.toFixed(2);
}


/***************************************************
 *
 * TIMER
 *
 ***************************************************/

function getRunningTask() {
  api(runningTaskEndpoint, {
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
  }).catch(err => {});
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
   api(stopTaskEndpoint, {
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
  api(timeTrackingEndpoint, {
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
  updateTaskName(task.task)
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
    'task': task,
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

function uncomplete(todo) {
  api(uncompleteEndpoint, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(todo)
  }).then(_ => refreshTodos())
}

function update(todo, dontRefresh) {
  return api(todosEndpoint, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(todo)
  }).then(_ => {
    if (!dontRefresh) {
      refreshTodos()
    }
  })
}

function updateRanks(todos) {
  return api(rankEndpoint, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(todos)
  })
}

function complete(todo) {
  api(completeEndpoint, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(todo)
  }).then(_ => refreshTodos())
}

function deleteTodo(todo, thisInstance) {
  api(deleteTodosEndpointFn(thisInstance), {
      method: 'DELETE',
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
  TODOS_SET = new Set()
  const list = document.getElementById('todos');        
  [... list.children].forEach(val => list.removeChild(val))
  todos()
}

function categories() {
  const categories = document.getElementById('category-input');
  categories.onchange = refreshTodos
  api(categoriesEndpoint, {
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
  .catch(err => {})
  .finally(() => todos());
}

function stripSpanTags(str) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = str;
    return tempDiv.textContent || tempDiv.innerText || "";
}

function todoFormSubmitEvent(event) {
  const todoElement = document.getElementById('todo-input');
  const form = document.getElementById('todo-form');
  event.preventDefault();

  let todo = stripSpanTags(todoElement.innerHTML)
  let category = document.getElementById('category-input').value;
  let categoryChanged = false
  if (todo.startsWith('@')) {
    const split = todo.split('@')
    categoryChanged = split[1] !== category
    category = split[1]
    todo = split[2]
    if (!CATEGORIES_SET.has(category)) {
      api(categoriesEndpoint, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ 'category': category })
      })
    }
  }

  const formData = JSON.stringify({ 'todo': todo, 'category': category === 'all' ? null : category })
  api(todosEndpoint, {
      method: 'POST',
      headers: headers,
      body: formData
  })
  .then(response => response?.json())
  .then(val => {
    if (!!val) {
      const list = document.getElementById('todos');        
      if (!categoryChanged && category === val.category) {
        // If this is in a different category to the currently 
        // shown one, don't bother adding it to the list
        addTodo(list, val)
        todoElement.innerHTML = ''
      }
    }
    return ''
  })
  .then(_ => todoElement.innerHTML = '')
}

function todoForm() {
  const todoElement = document.getElementById('todo-input');
  const form = document.getElementById('todo-form');
  todoElement.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      todoFormSubmitEvent(event)
    }
  });
  form.addEventListener('submit', todoFormSubmitEvent);
}


function todos() {
  const category = document.getElementById('category-input').value;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endpoint = !!category && category !== 'all' ? `${todosEndpoint}?category=${category}` : todosEndpoint
  api(endpoint, {
    method: 'GET', 
    headers: headers
  })
  .then(response => response.json())
  .then(todos => {
      const list = document.getElementById('todos');        
      if (!!todos) {
        todos
          .filter(todo => !(todo.recurring && !isTodoDueToday(todo)))
          .forEach(todo => addTodo(list, todo))
      }
  })
  .catch(err => {});
}

function isTodoDueToday(todo) {
  const dueDate = new Date(todo.dueDate);
  // Get the current date
  const currentDate = new Date();
  // Compare year, month, and day parts of the due date with the current date
  return dueDate.getFullYear() === currentDate.getFullYear() &&
         dueDate.getMonth() === currentDate.getMonth() &&
         dueDate.getDate() === currentDate.getDate() || todo.due;
}

let selectedTodo = null;
function addTodo(uL, todo) {
  TODOS_SET.add(todo)
  const xhr = new XMLHttpRequest();
  xhr.open('PATCH', completeEndpoint, false);
  xhr.setRequestHeader('Content-Type', 'application/json')
  xhr.setRequestHeader('tempUserId', tempUserId)

  const listItem = document.createElement('li');  

  listItem.className = 'todo-item';
  // listItem.innerHTML = todo.todo;
  listItem.id = todo.id
  listItem.draggable = true;

  listItem.addEventListener('dragstart', (event) => {
    event.dataTransfer.setData('text/plain', event.target.id);
  });

  listItem.addEventListener('dragover', handleDragOver);
  listItem.addEventListener('drop', handleDrop);

  const categoryDiv = document.createElement('div');
  categoryDiv.className = 'slide-category';
  categoryDiv.innerHTML = 'Category';

  // Create a container for the todo content and delete section
  const contentDiv = document.createElement('div');
  contentDiv.className = 'content';
  contentDiv.innerHTML = todo.todo;

  const deleteDiv = document.createElement('div');
  deleteDiv.className = 'slide-delete';
  deleteDiv.innerHTML = 'Delete';

  // Append the content and delete divs to the listItem
  // Category has to go first
  listItem.appendChild(categoryDiv);
  listItem.appendChild(contentDiv);
  listItem.appendChild(deleteDiv);
  listItem.addEventListener('contextmenu', function(event) {
    if (!!contextMenu) {
      hideContextMenu()
    }
    showContextMenu(event, todo);
  });

  if (todo.targetCount != null) {
      const countElement = document.createElement('span');
      countElement.innerHTML = `${todo.count}/${!!todo.incrementTarget ? todo.incrementTarget : todo.targetCount}`;
      // TODO different class?
      countElement.className = 'due-date-box';
      contentDiv.appendChild(countElement);
  }

  if (todo.dueDate) {
      const dueDateElement = document.createElement('span');
      const currentDate = new Date();
      const date = new Date(todo.dueDate);

      // Set both dates to midnight for a day-to-day comparison
      currentDate.setHours(0, 0, 0, 0);
      const midnightDueDate = new Date(todo.dueDate);
      midnightDueDate.setHours(0, 0, 0, 0);

      // Formatting the time portion
      const timeString = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      // Checking if the date is today, tomorrow, another day in the current week, or more than a week away
      const daysDifference = (midnightDueDate - currentDate) / (1000 * 60 * 60 * 24); // Difference in days
      let dateString;

      if (daysDifference === 0) {
          dateString = timeString; // e.g., "6:00pm"
      } else if (daysDifference === 1) {
          dateString = `Tomorrow ${timeString}`; // e.g., "Tomorrow 6:00pm"
      } else if (daysDifference > 1 && daysDifference < 7) {
          dateString = `${date.toLocaleDateString('en-US', { weekday: 'short' })} ${timeString}`; // e.g., "Mon 6:00pm"
      } else {
          dateString = date.toISOString().split('T')[0]; // e.g., "2023-09-29"
      }

      dueDateElement.innerHTML = dateString;

      dueDateElement.className = 'due-date-box';
      if (todo.due) {
          dueDateElement.classList.add('highlighted-due');
      }

      contentDiv.appendChild(dueDateElement);  
  }


  if (slideEnabled) {
    let startX, currentTranslate = 0, isDragging = false;
    listItem.addEventListener('mousedown', (event) => {
      startX = event.clientX;
      isDragging = false;

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(event) {
        // Calculate how far the mouse has been moved
        const distanceMoved = event.clientX - startX;

        if (distanceMoved < 0) { // Only slide to left
            currentTranslate = Math.max(-100, distanceMoved);  // Cap the maximum slide to -100px (width of delete div)
            contentDiv.style.transform = `translateX(${currentTranslate}px)`;
        }
        else if (distanceMoved > 0) { // Only slide to right
            currentTranslate = Math.min(100, distanceMoved);
            contentDiv.style.transform = `translateX(${currentTranslate}px)`;
        }

        isDragging = true;
    }

    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        // If the user has dragged more than half the width of the delete div, complete the slide
        if (currentTranslate <= -50) { // slide to the left
            contentDiv.style.transform = `translateX(-100px)`;
            deleteTodo(todo, true)
        }
        else if (currentTranslate >= 50) { // slide to the right
          const category = todo?.category.replace(/\d+/, (match) => parseInt(match, 10) + 1);
          if (!!category) {
            todo.category = category
            update(todo)
          }
        } else {
            contentDiv.style.transform = `translateX(0)`;
        }

        if (!isDragging) {
            // TODO: Handle the scenario where the user just clicked without dragging
        }
    }
  }


  listItem.addEventListener('click', () => {
    if (todo.targetCount != null) {
      const existingCountInput = document.getElementById('countInput');
        if (existingCountInput) {
            // If an input already exists, focus on it and return
            existingCountInput.focus();
            return;
        }
      const countInput = document.createElement('input');
      countInput.type = 'number';
      // Make this not unique for todos, 
      // this means that we can't have two of this open at once, which is a simple
      // way to prevent the nonsense that would occur if I allowed that
      countInput.id = 'countInput'
      countInput.className = 'countInput'
      countInput.value = todo.count;  // Prepopulate with the current count
      countInput.addEventListener('keypress', (event) => {
          if (event.key === 'Enter') {
              const newCount = parseInt(countInput.value, 10);
              todo.count = newCount
              // TODO make the backend handle updating this particular case
              update(todo, true)
                .then(val => {
                  if (newCount >= todo.targetCount || newCount >= todo.incrementTarget) {
                      // Continue with the normal click function
                      LAST.push(todo);
                      xhr.send(JSON.stringify(todo));
                      listItem.style = 'display: none;';
                      playAudio();
                }
              })
              contentDiv.removeChild(countInput);
          }
      });

      contentDiv.appendChild(countInput);

      countInput.focus();

      // Return to prevent further execution of the click event
      return;


    }

    LAST.push(todo)
    xhr.send(JSON.stringify(todo))
    listItem.style = 'display: none;'
    playAudio()
    return false
  });
  uL.appendChild(listItem);
}

function handleDragOver(event) {
  event.preventDefault();
}

function handleDrop(event) {
  event.preventDefault();

  // Get the dragged data (e.g., todo ID)
  const draggedItemId = event.dataTransfer.getData('text/plain');

  // Get the drop target (the new position for the todo)
  const dropTarget = event.target.closest('li');

  // Reorder the todos based on the drop position
  reorderTodos(draggedItemId, dropTarget);
}

function reorderTodos(draggedItemId, dropTarget) {
  // Get the parent list (ul)
  const todosList = dropTarget.parentElement;

  // Get all todo items in the list
  const todoItems = Array.from(todosList.children);

  // Find the index of the dragged item
  const draggedIndex = todoItems.findIndex(item => item.id === draggedItemId);

  // Find the index of the drop target
  const dropIndex = todoItems.findIndex(item => item === dropTarget);

  // Remove the dragged item from the list
  const [draggedItem] = todoItems.splice(draggedIndex, 1);

  // Insert the dragged item at the new position
  todoItems.splice(dropIndex, 0, draggedItem);

  // Update the DOM with the new order
  todosList.innerHTML = '';
  todoItems.forEach(item => todosList.appendChild(item));

  const adjacentItems = getAdjacentItems(todoItems, draggedItem)
  setRankOrderBetween(adjacentItems, draggedItem, todoItems)
}

function getAdjacentItems(array, element) {
  const index = array.indexOf(element);

  if (index === -1) {
    // Element not found in the array
    return null;
  }

  const previousIndex = index - 1;
  const nextIndex = index + 1;

  const previousListItem = previousIndex >= 0 ? array[previousIndex] : null;
  const nextListItem = nextIndex < array.length ? array[nextIndex] : null;

  return { previousListItem, nextListItem };
}

function setRankOrderBetween(adjacentItems, todoObject, todos) {
  const todosMap = Array.from(TODOS_SET).reduce((map, item) => {
    map.set(item.id, item);
    return map;
  }, new Map())
  const { previousListItem, nextListItem } = adjacentItems;
  const previousItem = todosMap.get(previousListItem?.id)
  const nextItem = todosMap.get(nextListItem?.id)

  if (previousItem === null && nextItem === null) {
    // Handle the case when both adjacent items are null
    return updateIndividualTodoRank(todoObject, todosMap, DEFAULT_RANK);
  }

  const previousRank = previousItem ? previousItem.rankOrder : 0;
  const nextRank = nextItem ? nextItem.rankOrder : 30000000;

  // Calculate a rank order value between the two items
  const newRankOrder = Math.floor((previousRank + nextRank) / 2);

  // Check if there are no integers between the two items
  // If this happens, the simplest thing to do is completely 
  // rerank the whole list based on the current order
  if (newRankOrder === previousRank || newRankOrder === nextRank) {
    rerank(todos, todosMap);
    return
  }

  return updateIndividualTodoRank(todoObject, todosMap, newRankOrder);
}

function updateIndividualTodoRank(todoObject, todosMap, rankOrder) {
  const todo = todosMap.get(todoObject.id)
  todo.rankOrder = rankOrder
  // Call the backend to persist the new order
  update(todo, true)
}

/** 
 * We need to come up with a new rank for each of these elements
 * then call the backend up update the ranks
 *
 * The ranks have an arbitary gap between the ranks that prevents the 
 * need to rerank all the items every single time we reorder the elements. 
 * In most cases, it will be update a single item's rank in the bank end
 */ 
function rerank(todoElements, todosMaps) {

  const updated = todoElements.map((element, index) => {
    const todo = todosMap.get(element.id)
    return {
      ...todo,
      rankOrder: (index + 1) * DEFAULT_RANK, // default rank is the arbitary gap
    };
  })

	updateRanks(updated)
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

function addLinks() {
  updateTimeTrackingSummaryLink() 
  updateRatingsLink()
  updateIdeaBucketLink()
  updateReviewLink()
  updateReadingListLink()
}

function updateTimeTrackingSummaryLink() {
  const link = document.getElementById('time-tracking-summary-link');
  link.href = `chrome-extension://${chrome.runtime.id}/template/time-tracking-summary.html`
  link.innerHTML = `Time tracking summary`
  if (withEmojis) {
    link.innerHTML = `🕰️ Time tracking summary`
  }
}

function updateReadingListLink() {
  const link = document.getElementById('reading-list-link');
  link.href = `chrome-extension://${chrome.runtime.id}/template/reading-list.html`
  link.innerHTML = `Reading List`
  if (withEmojis) {
    link.innerHTML = `📚 Reading List`
  }
}

function updateRatingsLink() {
  const link = document.getElementById('ratings-link');
  link.href = `chrome-extension://${chrome.runtime.id}/template/ratings.html`
  link.innerHTML = `Mood Ratings`
  if (withEmojis) {
    link.innerHTML = `🌺 Mood Ratings`
  }
}

function updateIdeaBucketLink() {
  const link = document.getElementById('idea-bucket-link');
  link.href = `chrome-extension://${chrome.runtime.id}/template/idea-bucket.html`
    link.innerHTML = `Idea Bucket`
  if (withEmojis) {
    link.innerHTML = `💡 Idea Bucket`
  }
}

function updateReviewLink() {
  const link = document.getElementById('review-link');
  link.href = `chrome-extension://${chrome.runtime.id}/template/review.html`
    link.innerHTML = `Review`
  if (withEmojis) {
    link.innerHTML = `🌱 Review`
  }
}

function parseFrequencyString(val) {
    const everyPattern = /every (\d+(?:st|nd|rd|th)?)?\s?(days?|weeks?|months?|quarters?|years?|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)?/i;
    const dayTimePattern = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Today|Tomorrow)\s*(@|at)\s*(\d{1,2}[ap]m)/ig;
    const categoryPattern = /@([^@]+)@/g;


    // Replaces matched patterns with highlighted version
    val = val.replace(everyPattern, '<span style="background-color: yellow;">$&</span>');
    val = val.replace(dayTimePattern, '<span style="background-color: yellow;">$&</span>');
    val = val.replace(categoryPattern, '<span style="background-color: yellow;">$&</span>');
    
    return val;
}

function highlightMatches() {
    const div = document.getElementById('todo-input');
    const content = div.innerHTML;
    div.innerHTML = parseFrequencyString(content);
}

function showContextMenu(event, todo) {
  // Check if the right-click occurred outside of an 'a' tag
  if (event.target.tagName.toLowerCase() === 'a') {
    return;
  }
  event.preventDefault();
  const isTodoContextMenu = !!todo;
  const contextMenuId = isTodoContextMenu ? 'todoContextMenu' : 'contextMenu';
  contextMenu = document.getElementById(contextMenuId);
  
  // Ensure the context menu is visible before retrieving dimensions
  contextMenu.style.display = 'block';
  
  const contextMenuWidth = contextMenu.offsetWidth;
  const contextMenuHeight = contextMenu.offsetHeight;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let left = event.clientX;
  let top = event.clientY;
  
  // Adjust left position if the context menu goes off the right edge
  if (left + contextMenuWidth > viewportWidth) {
    left = viewportWidth - contextMenuWidth;
  }
  
  // Adjust top position if the context menu goes off the bottom edge
  if (top + contextMenuHeight > viewportHeight) {
    top = viewportHeight - contextMenuHeight;
  }
  
  // Ensure the top position is never negative
  top = Math.max(top, 0);
  
  contextMenu.style.left = `${left}px`;
  contextMenu.style.top = `${top}px`;
  
  event.stopPropagation();
}

function hideContextMenu() {
    if (!!contextMenu) {
      contextMenu.style.display = 'none';
      contextMenu = null
    }
}

function addTodoListener() {
  document.getElementById('todo-input').addEventListener('input', function() {
      if (this.innerHTML === '<br>') {
        this.innerHTML = '';  // Ensure the div is truly empty
      }
      // To avoid cursor jumping, we'll only replace content if it has changed
      const newContent = parseFrequencyString(this.innerText);
      if (newContent !== this.innerHTML) {
          this.innerHTML = newContent;

          // Set cursor to the end after change
          const range = document.createRange();
          const sel = window.getSelection();
          range.setStart(this, this.childNodes.length);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
      }
  });

  contextMenu = document.getElementById('contextMenu');
  const deleteThisInstanceAction = document.getElementById('deleteThisInstanceAction');
  const deleteAllInstancesAction = document.getElementById('deleteAllInstancesAction');
  const editAction = document.getElementById('editAction');
  const moveNextAction = document.getElementById('moveNextAction');
  const changeCategoryAction = document.getElementById('changeCategoryAction');
  const changeAllCategoryAction = document.getElementById('changeAllCategoryAction');
  const moveAllNextAction = document.getElementById('moveAllNextAction');

  document.addEventListener('contextmenu', function(event) {
    hideContextMenu()
    showContextMenu(event)
  });


  deleteThisInstanceAction.addEventListener('click', function() {
    deleteTodo(selectedTodo, true)
    selectedTodo = null
    hideContextMenu();
  });

  deleteAllInstancesAction.addEventListener('click', function() {
    deleteTodo(selectedTodo, false)
    selectedTodo = null
    hideContextMenu();
  });

  moveNextAction.addEventListener('click', function() {
    const todo = selectedTodo
    const category = todo?.category.replace(/\d+/, (match) => parseInt(match, 10) + 1);
    if (!!category) {
      todo.category = category
      update(todo)
    }
    selectedTodo = null
    hideContextMenu();
  });

  changeCategoryAction.addEventListener('click', function() {
    const todo = selectedTodo
    const category = prompt('Enter the new category:');
    if (!!category) {
      todo.category = category
      update(todo)
    }
    selectedTodo = null
    hideContextMenu();
  });

  moveAllNextAction.addEventListener('click', function() {
    // TODO update the backend to have a list edit endpoint
    // will need to validate that all are for the same user
    TODOS_SET.forEach(todo => {
      const category = todo?.category.replace(/\d+/, (match) => parseInt(match, 10) + 1);
      if (!!category) {
        todo.category = category
        update(todo)
      }
    })
    hideContextMenu();
  });

  changeAllCategoryAction.addEventListener('click', function() {
    // TODO update the backend to have a list edit endpoint
    // will need to validate that all are for the same user
    const category = prompt('Enter the new category:');
    TODOS_SET.forEach(todo => {
      if (!!category) {
        todo.category = category
        update(todo)
      }
    })
    hideContextMenu();
  });

  editAction.addEventListener('click', function() {
    const todo = selectedTodo
    const task = prompt('Edit todo:', todo.todo);
    if (!!task && todo.todo !== task) {
      todo.todo = task
      update(todo)
    }
    selectedTodo = null
    hideContextMenu();
  });

  // Event listener to hide context menu on window click
  window.addEventListener('click', function() {
    hideContextMenu();
  });
}

function getDaysUntilTargetDate(targetDate) {
    const currentDate = new Date();
    const daysUntil = Math.ceil((targetDate - currentDate) / (1000 * 60 * 60 * 24));
    const day = targetDate.getDate();
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const monthName = monthNames[targetDate.getMonth()];
    const formattedDate = `${day} ${monthName}`;

    return `${daysUntil} day${daysUntil !== 1 ? 's' : ''} until ${formattedDate}`;
}

function targetNote() {
  const note = document.getElementById('note')

  const targets = [
    { "name": "Cleopatra", "target": new Date('December 8, 2023') },
    { "name": "Charles Darwin", "target": new Date('December 22, 2023') },
    { "name": "Florence Nightingale", "target": new Date('January 5, 2024') },
    { "name": "Vincent van Gogh", "target": new Date('January 19, 2024') },
  ]

  const internal = targets.map(val => `${val.name} ${getDaysUntilTargetDate(val.target)}</br>`).join('');
  note.innerHTML = internal
}


window.onload = function() {
  addTodoListener()
  targetNote()
  if (spendTrackingEnabled) {
    getTotalMonthSpend()
  }
  if (quotesEnabled) {
    loadJSon()
  }
  if (timerEnabled) {
    updateTaskButton(false)
    getRunningTask()
    addLinks()
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
