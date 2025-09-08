document.getElementById('file-upload-form').addEventListener('submit', function (event) {
  event.preventDefault()

  const file = document.getElementById('file').files[0]
  const category = document.getElementById('category').value
  const subcategory = document.getElementById('subcategory').value
  const notes = document.getElementById('notes').value

  if (file) {
    const metadata = {
      category: category ? category : 'itemsofinterest',
      fileName: `${subcategory}/${file.name}`,
      notes: notes,
    }

    const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    const formData = new FormData()
    formData.append('file', file)
    formData.append('metadata', metadataBlob)

    fetch(fileUploadEndpoint, {
      method: 'POST',
      headers: noContentTypeHeaders,
      body: formData,
    })
      .then(response => {
        if (response.ok) {
          alert('File uploaded successfully!')
          window.location.href = 'index.html'
        } else {
          alert('File upload failed.')
        }
      })
      .catch(error => {
        console.error('Error uploading file:', error)
        alert('An error occurred during file upload.')
      })
  }
})
