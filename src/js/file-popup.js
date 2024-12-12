const form = document.getElementById('saveForm')
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
    el.style.color = 'var(--background-color)'
    el.style.border = 'none'
    el.style.padding = '10px 20px'
    el.style.cursor = 'pointer'
    el.style.marginTop = '10px'
  } else {
    el.style.padding = '10px'
    el.style.marginBottom = '10px'
    el.style.border = '1px solid var(--text-color)'
    el.style.backgroundColor = 'var(--dark-grey)'
    el.style.color = 'var(--link-color)'
    el.style.width = '100%'
  }
})

document.getElementById('saveForm').addEventListener('submit', async function (event) {
  event.preventDefault()

  const bucket = document.getElementById('bucket').value
  const category = document.getElementById('category').value
  const notes = document.getElementById('notes').value
  const fileUrl = document.getElementById('fileUrl').value

  try {
    await browser.storage.local.set({ bucket, category, notes, fileUrl })

    await browser.runtime.sendMessage({ action: 'saveFile' })

    window.close()
  } catch (error) {
    console.error('Error during save operation:', error)
  }
})

browser.storage.local.get(['fileUrl'], function (data) {
  if (data.fileUrl) {
    document.getElementById('fileUrl').value = data.fileUrl
  }
})
