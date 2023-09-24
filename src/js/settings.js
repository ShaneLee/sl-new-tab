const host='http://localhost:8080'
const tempUserId = 'bd11dcc2-77f6-430f-8e87-5839d31ab0e3'

const userPreferences = `${host}/preferences`

const headers = {
  'Content-Type': 'application/json',
  'tempUserId': tempUserId
}

window.onload = function() {
  document.getElementById('settingsForm').addEventListener('submit', function(e) {
      e.preventDefault();
      saveSettings()
  });
    loadSettings();
};

function saveSettings() {
    const name = document.getElementById('name').value;
    chrome.storage.local.set({'name': name}, function() {
    });

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    chrome.storage.local.set({'timezone': timezone}, function() {
    });

    const prefs = { 'name': name, 'timezone': timezone }

    fetch(userPreferences, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(prefs)
    })
    .then(response => response?.status === 201 ? response : null)

}

function loadSettings() {
    chrome.storage.local.get(['name'], function(result) {
    });
}
