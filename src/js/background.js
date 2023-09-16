const host = 'http://localhost:8080'
const webTrackerEndpoint = `${host}/tracking/web`
const stopEndpoint = `${host}/tracking/web/stop`
const webTrackingEnabled = true
const tempUserId = 'bd11dcc2-77f6-430f-8e87-5839d31ab0e3'

const headers = {
  'Content-Type': 'application/json',
  'tempUserId': tempUserId
}

let previousTab = null;

if (webTrackingEnabled) {
	chrome.tabs.onActivated.addListener(activeInfo => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      if (tab.url.startsWith("chrome://") || tab.incognito) {
        if (previousTab) {
          endTracking(previousTab);
        }
        return
      }

      chrome.scripting.executeScript({
        target: {tabId: activeInfo.tabId},
        function: getTabURL,
      }, (results) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }

        const currentURL = new URL(results[0].result)?.hostname;
        
        
        if (previousTab?.url === currentURL) {
          // We haven't changed pages
          return
        }
        
        startTracking(currentURL);
      });
    })
  });
}

function getLocation(href) {
    const location = document.createElement("a");
    location.href = href;
    if (location.host === '') {
      location.href = location.href;
    }
    return location;
};

function getTabURL() {
  return window.location.href;
}

function startTracking(url) {
  fetch(webTrackerEndpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ url: url }),
  })
  .then(response => response.json())
  .then(data => {
    if (data && previousTab) {
      endTracking(data);
    }
    if (data) {
      previousTab = data;
    }
    return data
  })
  .catch((error) => {
    console.error('Error:', error);
  });
}

function endTracking(previous) {
  fetch(stopEndpoint, {
    method: 'PATCH',
    headers: headers,
    body: JSON.stringify(previous),
  });
}
