function variables() {
  const host = 'http://localhost:8080'
  const bucketEndpoint = `${host}/bucket`
  const tempUserId = 'bd11dcc2-77f6-430f-8e87-5839d31ab0e3'
  const headers = {
    'Content-Type': 'application/json',
    'tempUserId': tempUserId
  }
  return {
    'host': host,
    'bucketEndpoint': bucketEndpoint,
    'headers': headers
  }
}


showPopupForm()

function showPopupForm() {
	let form = document.getElementById('idea-bucket-popup');
	if (form) {
		form.style.display = 'block';
		return;
	}

	form = document.createElement('div');
	form.id = 'idea-bucket-popup';
  form.innerHTML = `
    <form>
      <h4>Create Idea</h4>
      <input type="text" id="idea-popup-input" name="idea" placeholder="Idea">
      <input type="text" id="category-popup-input" name="category" placeholder="Category">
      <textarea id="notes-popup-input" name="notes" placeholder="Notes"></textarea>
      <input type="submit" value="Submit">
      <button type="button" onclick="closeForm()">Close</button>
    </form>
  `;

  // Stylings based on provided CSS
  form.style.position = 'fixed';
  form.style.top = '5%';  // Adjusted to keep it centered after increasing size
  form.style.left = '25%';  // Adjusted to keep it centered after increasing size
  form.style.zIndex = '10000'; 
  form.style.backgroundColor = '#272725';
  form.style.color = '#8d8271';
  form.style.padding = '30px'; // Increased padding for a larger appearance
  form.style.boxShadow = '0px 0px 15px rgba(0,0,0,0.2)';
  form.style.fontFamily = "'Helvetica Neue', sans-serif";
  form.style.fontWeight = 'bold';
  form.style.textAlign = 'center';
  form.style.width = '50%'; // Increased for a larger appearance
  form.style.borderRadius = '15px'; // Optional: added for rounded corners

  const formInputs = form.querySelectorAll('input, button, textarea');
  formInputs.forEach(el => {
    if (el.type === 'submit' || el.type === 'button') {
      el.style.backgroundColor = '#e7b91b';
      el.style.color = '#272725';
      el.style.border = 'none';
      el.style.padding = '10px 20px';
      el.style.cursor = 'pointer';
      el.style.marginTop = '10px';
    } else {
      el.style.padding = '10px';
      el.style.marginBottom = '10px';
      el.style.border = '1px solid #8d8271';
      el.style.backgroundColor = '#2C2C2C';
      el.style.color = '#8d8271';
      el.style.width = '100%'; // Make the input elements take the full width
    }
  });

	document.body.appendChild(form);
  form.querySelector('form').addEventListener('submit', function(e) {
    e.preventDefault();

    const ideaElement = document.getElementById('idea-popup-input');
    const categoryElement = document.getElementById('category-popup-input');
    const notesElement = document.getElementById('notes-popup-input');
    const idea = ideaElement.value;
    const category = categoryElement.value;
    const notes = notesElement.value;

  const formData = {
    'idea': idea,
    'category': category,
    'notes': notes
  }
  const vars = variables()
  fetch(vars.bucketEndpoint, {
    method: 'POST',
    headers: vars.headers,
    body: JSON.stringify(formData),
  })
  .then(closeForm)
  });
}

function closeForm() {
  let form = document.getElementById('idea-bucket-popup');
  if (form) {
    form.style.display = 'none';
  }
}
