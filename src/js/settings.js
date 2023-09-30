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
