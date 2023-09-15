const host = 'http://localhost:8080'
const webTrackerEndpoint = `${host}/web/track`
const webTrackingEnabled = false
const tempUserId = 'bd11dcc2-77f6-430f-8e87-5839d31ab0e3'

const headers = {
  'Content-Type': 'application/json',
  'tempUserId': tempUserId
}

let previousTabURL = null;

if (webTrackingEnabled) {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      if (tab.url.startsWith("chrome://")) return
      if (tab.incognito) return


      chrome.scripting.executeScript({
        target: {tabId: tabId},
        function: getTabURL,
      }, (results) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }

        const currentURL = new URL(results[0].result)?.hostname;
        
        sendToEndpoint(currentURL);
        
        if (previousTabURL === currentURL) {
          // We haven't changed pages
          return
        }
        
        if (previousTabURL) {
          sendToEndpoint(previousTabURL);
        }
        
        previousTabURL = currentURL;
      });
    }
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

function sendToEndpoint(url) {
	console.log(url)
	return 
	
  fetch(webtrackerEndpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ url: url }),
  })
  .then(response => response.json())
  .then(data => {
    console.log(data);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
}
