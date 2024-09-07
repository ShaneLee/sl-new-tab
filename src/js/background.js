host = 'http://localhost:8080'
host='http://192.168.0.46:8080'
const webTrackerEndpoint = `${host}/tracking/web`
const readingListEndpoint = `${host}/reading-list`
const stopEndpoint = `${host}/tracking/web/stop`
const podcastSubscribeEndpoint = `${host}/podcast/subscribe`
const fileUploadEndpoint = `${host}/files/upload`
const podcastListenLater = `${host}/podcast/listenLater`
const webTrackingEnabled = false
const tempUserId = 'bd11dcc2-77f6-430f-8e87-5839d31ab0e3'

const browserAPI = typeof browser !== "undefined" ? browser : chrome;

const headers = {
  'Content-Type': 'application/json',
  'tempUserId': tempUserId
}

const noContentTypeHeaders = {
  'tempUserId': tempUserId
}

let previousTab = null;

function getHighlightedLinks() {
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const fragment = range.cloneContents();
  const links = fragment.querySelectorAll('a');
  return Array.from(links).map(link => ({ href: link.href, textContent: link.textContent }));
}

function basename(path) {
   return path.split('/').reverse()[0];
}

function saveFile(file, metadata) {
  const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', metadataBlob);

  return fetch(fileUploadEndpoint, {
    method: 'POST',
    headers: noContentTypeHeaders,
    body: formData
  })
}

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

  browserAPI.downloads.download({
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

function addToListenLater(listenLater) {
  return fetch(podcastListenLater, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(listenLater)
  })
}

if (webTrackingEnabled) {
	browserAPI.tabs.onActivated.addListener(activeInfo => {
    browserAPI.tabs.get(activeInfo.tabId, (tab) => {
      if (tab.url.startsWith("browserAPI://") || isShoppingForGiftsForWife(tab)) {
        if (previousTab) {
          endTracking(previousTab);
        }
        return
      }

      browserAPI.scripting.executeScript({
        target: {tabId: activeInfo.tabId},
        function: getTabURL,
      }, (results) => {
        if (browserAPI.runtime.lastError) {
          console.error(browserAPI.runtime.lastError);
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

browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'saveFile') {
    browserAPI.storage.local.get(['fileUrl', 'bucket', 'category', 'notes'], function(data) {
      const { fileUrl, bucket, category, notes } = data;
      fetch(fileUrl)
        .then(response => response.blob())
        .then(blob => {
          const file = new File([blob], basename(fileUrl), { type: blob.type });
          const metadata = {
            category: bucket,
            fileName: `${category}/${basename(file.name)}`,
            notes
          };
          saveFile(file, metadata);
        })
        .catch(error => {
          console.error('Error fetching file:', error);
        });
    });
  }
});


browserAPI.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "saveToReadingList") {
    addToReadingList({
      'url': info.pageUrl,
      'title': info.title || tab.title,
      'text': info.selectionText
    })
  } 
  else if (info.menuItemId === "saveAllLinksToReadingList") {
    browserAPI.scripting.executeScript({
      target: { tabId: tab.id },
      func: getHighlightedLinks
    }, (results) => {
      const links = results[0].result;
      if (links && links.length > 0) {
        links.forEach(link => {
          addToReadingList({
            url: link.href,
            title: link.textContent || tab.title,
            text: info.selectionText
          });
        });
      }
    });
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

  else if (info.menuItemId === "saveFile") {
    browserAPI.storage.local.set({ fileUrl: info.srcUrl }, function() {
          browserAPI.windows.create({
            url: browserAPI.runtime.getURL("template/file-popup.html"),
            type: "popup",
            width: 800,
            height: 800
          });
        });
  }
   else if (info.menuItemId === "saveMeme") {
    const imageUrl = info.srcUrl;

        fetch(imageUrl)
          .then(response => response.blob())
          .then(blob => {
            const file = new File([blob], basename(info.srcUrl), { type: blob.type });
            const metadata = {
              category: 'itemsofinterest',
              fileName: `memes/${basename(file.name)}`,
              notes: `Source: ${info.pageUrl}`
            };
            saveFile(file, metadata);
          })
          .catch(error => {
            console.error('Error fetching image:', error);
          });
   }
});

browserAPI.commands.onCommand.addListener((command) => {
    if (command === "ideaBucketPopup") {
        browserAPI.tabs.query({active: true, currentWindow: true}, (tabs) => {
            let activeTab = tabs[0];
            browserAPI.scripting.executeScript({
                target: {tabId: activeTab.id},
                files: ["js/show-popup.js"]
            });
        });
    }
});

browserAPI.runtime.onInstalled.addListener(() => {
  browserAPI.contextMenus.create({
    id: "saveToReadingList",
    title: "Save to Reading List",
    contexts: ["page", "selection"]
  });

  browserAPI.contextMenus.create({
    id: "saveAllLinksToReadingList",
    title: "Save All Highlighted Links to Reading List",
    contexts: ["selection"]
  });

  browserAPI.contextMenus.create({
    id: "subscribeToPodcast",
    title: "Subscribe to podcast",
    contexts: ["link"]
  });

  browserAPI.contextMenus.create({
    id: "addToListenLater",
    title: "Add to Podcast Listen Later",
    contexts: ["link"]
  });

  browserAPI.contextMenus.create({
    id: "createNote",
    title: "Create Note",
    contexts: ["page", "selection"]
  });

  browserAPI.contextMenus.create({
    id: "saveFile",
    title: "Save",
    contexts: ["image", "audio", "video"]
  });

  browserAPI.contextMenus.create({
    id: "saveMeme",
    title: "Save Meme",
    contexts: ["image", "audio", "video"]
  });
});

browserAPI.runtime.onInstalled.addListener((details) => {
    if(details.reason === 'install') {
      // OAuth2 goes here at some point
      browserAPI.tabs.create({url: 'template/settings.html'});
    }
});
