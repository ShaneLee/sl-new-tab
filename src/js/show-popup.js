function variables() {
  host = 'http://localhost:8080'
  host = 'http://192.168.0.46:8080'
  const bucketEndpoint = `${host}/bucket`
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }
  return {
    host: host,
    bucketEndpoint: bucketEndpoint,
    headers: headers,
  }
}

showPopupForm()

function showPopupForm() {
  let form = document.getElementById('idea-bucket-popup')
  if (form) {
    form.style.display = 'block'
    return
  }

  form = document.createElement('div')
  form.id = 'idea-bucket-popup'
  form.innerHTML = `
    <form>
      <h4>Create Idea</h4>
      <input type="text" id="idea-popup-input" name="idea" placeholder="Idea">
      <input type="text" id="category-popup-input" name="category" placeholder="Category">
      <textarea id="notes-popup-input" name="notes" placeholder="Notes"></textarea>
      <input type="submit" value="Submit">
      <button type="button" onclick="closePopupForm('idea-popup-form')">Close</button>
    </form>
  `

  form.style.position = 'fixed'
  form.style.top = '5%'
  form.style.left = '25%'
  form.style.zIndex = '10000'
  form.style.backgroundColor = 'var(--background-color)'
  form.style.color = 'var(--text-color)'
  form.style.padding = '30px'
  form.style.boxShadow = '0px 0px 15px rgba(0,0,0,0.2)'
  form.style.fontFamily = "'Helvetica Neue', sans-serif"
  form.style.fontWeight = 'bold'
  form.style.textAlign = 'center'
  form.style.width = '50%'
  form.style.borderRadius = '15px'

  const formInputs = form.querySelectorAll('input, button, textarea')
  formInputs.forEach(el => {
    if (el.type === 'submit' || el.type === 'button') {
      el.style.backgroundColor = 'var(--main-color)'
      el.style.color = 'var(--very-dark)'
      el.style.border = 'none'
      el.style.padding = '10px 20px'
      el.style.cursor = 'pointer'
      el.style.marginTop = '10px'
    } else {
      el.style.padding = '10px'
      el.style.marginBottom = '10px'
      el.style.border = '1px solid var(--link-color)'
      el.style.backgroundColor = 'var(--dark-grey)'
      el.style.color = 'var(--link-color)'
      el.style.width = '100%'
    }
  })

  document.body.appendChild(form)
  form.querySelector('form').addEventListener('submit', function (e) {
    e.preventDefault()

    const ideaElement = document.getElementById('idea-popup-input')
    const categoryElement = document.getElementById('category-popup-input')
    const notesElement = document.getElementById('notes-popup-input')
    const idea = ideaElement.value
    const category = categoryElement.value
    const notes = notesElement.value

    const formData = {
      idea: idea,
      category: category,
      notes: notes,
    }
    const vars = variables()
    fetch(vars.bucketEndpoint, {
      method: 'POST',
      headers: vars.headers,
      body: JSON.stringify(formData),
    }).then(closeForm)
  })
}

function closeForm() {
  let form = document.getElementById('idea-bucket-popup')
  if (form) {
    form.style.display = 'none'
  }
}
