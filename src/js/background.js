host = 'http://localhost:8080'
host='http://192.168.0.46:8080'
const webTrackerEndpoint = `${host}/tracking/web`
const readingListEndpoint = `${host}/reading-list`
const stopEndpoint = `${host}/tracking/web/stop`
const podcastSubscribeEndpoint = `${host}/podcast/subscribe`
const podcastListenLater = `${host}/podcast/listenLater`
const webTrackingEnabled = false
const tempUserId = 'bd11dcc2-77f6-430f-8e87-5839d31ab0e3'

const headers = {
  'Content-Type': 'application/json',
  'tempUserId': tempUserId
}

let previousTab = null;

function santiseString(val) {
  return val
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
}

function createNote(item) {
  const blob = new Blob([[
  `---`,
  `tags:`,
  `  -`,
  `---`,
  '',
  `${item.url}`].join('\n')], {type: "text/plain"});
  const url = URL.createObjectURL(blob);

  browser.downloads.download({
      url: url,
      filename: `${santiseString(item.title)}.md`,
      saveAs: true
  });
}

function addToReadingList(payload) {
  fetch(readingListEndpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload),
  })

}

function addToListenLater(url) {
  return fetch(podcastListenLater, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({'url':url})
  })
}

if (webTrackingEnabled) {
	chrome.tabs.onActivated.addListener(activeInfo => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      if (tab.url.startsWith("chrome://") || isShoppingForGiftsForWife(tab)) {
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

function isShoppingForGiftsForWife(tab) {
  return tab.incognito;
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

function subscribeToPodcast(rss) {
  return fetch(podcastSubscribeEndpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(rss)
      })
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "saveToReadingList") {
    addToReadingList({
      'url': info.pageUrl,
      'title': info.title || tab.title,
      'text': info.selectionText
    })
  } 
  else if (info.menuItemId === "subscribeToPodcast") {
    subscribeToPodcast({
      url: info.linkUrl,
    });
  }

  else if (info.menuItemId === "addToListenLater") {
    addToListenLater({
      url: info.linkUrl,
      episodeTitle: info.selectionText
    });
  }
  else if (info.menuItemId === "createNote") {
    createNote({
      'url': info.pageUrl,
      'title': info.title || tab.title
    })

  }
});

chrome.commands.onCommand.addListener((command) => {
    if (command === "ideaBucketPopup") {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            let activeTab = tabs[0];
            chrome.scripting.executeScript({
                target: {tabId: activeTab.id},
                files: ["js/show-popup.js"]
            });
        });
    }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveToReadingList",
    title: "Save to Reading List",
    contexts: ["page", "selection"]
  });

  chrome.contextMenus.create({
    id: "subscribeToPodcast",
    title: "Subscribe to podcast",
    contexts: ["link"]
  });

  chrome.contextMenus.create({
    id: "addToListenLater",
    title: "Add to Podcast Listen Later",
    contexts: ["link"]
  });

  chrome.contextMenus.create({
    id: "createNote",
    title: "Create Note",
    contexts: ["page", "selection"]
  });
});

chrome.runtime.onInstalled.addListener((details) => {
    if(details.reason === 'install') {
      // OAuth2 goes here at some point
      chrome.tabs.create({url: 'settings.html'});
    }
});
