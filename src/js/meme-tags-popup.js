const extensionAPI = typeof browser !== 'undefined' ? browser : chrome

let meme = {}

extensionAPI.storage.local.get(['memeUrl', 'memePageUrl'], function (data) {
  meme = data
  if (data.memeUrl) {
    document.getElementById('memePreview').src = data.memeUrl
  }
})

document.getElementById('memeTagsForm').addEventListener('submit', function (event) {
  event.preventDefault()

  const tags = document
    .getElementById('tags')
    .value.split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(Boolean)

  // The background script does the upload so that it isn't cut short by this window closing
  Promise.resolve(
    extensionAPI.runtime.sendMessage({
      action: 'saveMeme',
      memeUrl: meme.memeUrl,
      memePageUrl: meme.memePageUrl,
      tags,
    }),
  )
    .catch(error => console.error('Error saving meme:', error))
    .finally(() => window.close())
})
