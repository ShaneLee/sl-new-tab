document.getElementById('file-upload-form').addEventListener('submit', function (event) {
  event.preventDefault()

  const files = document.getElementById('file').files
  const category = document.getElementById('category').value
  const subcategory = document.getElementById('subcategory').value
  const notes = document.getElementById('notes').value

  if (files.length > 0) {
    const uploadPromises = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const metadata = {
        category: category ? category : 'itemsofinterest',
        fileName: `${subcategory}/${file.name}`,
        tags: subcategory,
        notes: notes,
      }

      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      const formData = new FormData()
      formData.append('file', file)
      formData.append('metadata', metadataBlob)

      uploadPromises.push(
        fetch(fileUploadEndpoint, {
          method: 'POST',
          headers: noContentTypeHeaders,
          body: formData,
        }),
      )
    }

    Promise.all(uploadPromises)
      .then(responses => {
        const allSuccessful = responses.every(response => response.ok)
        if (allSuccessful) {
          alert('All files uploaded successfully!')
          window.location.href = 'index.html'
        } else {
          alert('Some files failed to upload.')
        }
      })
      .catch(error => {
        console.error('Error uploading files:', error)
        alert('An error occurred during file upload.')
      })
  }
})
