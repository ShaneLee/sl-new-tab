function loadNote() {
  fetch(notesEndpoint, {
      method: 'GET',
      headers: headers
      })
  .then(response => response.status === 200 ? response?.json() : null)
  .then(val => {
    if (!!val) {
      populateNote(val)
    }
  });
}

function populateNote(note) {
  const editor = document.getElementById('editor')
  editor.value = note.note
}

window.addEventListener("load", loadNote);
