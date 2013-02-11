(function () {
  var viewQueueLinkURL = 'http://getpocket.com/a/queue/',
      viewMobileLinkURL = 'http://getpocket.com/apps/mobile',
      closeTimer;

  function openLinkInNewTab(url) {
    chrome.tabs.create({
      'url': url
    }, function (tab) {
      clearTimeout(closeTimer);
      window.close();
    });
  }

  // function to get selected text from notification's querystring and parse for it's components
  // for further information on notification controlling look at:
  // http://www.fienipa.com/blog/controlling-desktop-notifications-chrome-extensions
  function getURLComponents() {
    var locationString = window.location.search,
        components = {},
        urlComponentsString = locationString.split('?')[1],
        urlComponents = urlComponentsString.split('&'),
        component, i;
    for (i = 0; i < urlComponents.length; i++) {
      component = urlComponents[i].split('=');
      components[component[0]] = decodeURIComponent(component[1]);
    }
    return components;
  }

  function initialize() {
    var urlComponents = getURLComponents(),
        status = urlComponents.status,
        viewLeftLink = document.getElementById("view-left-link"),
        viewRightLink = document.getElementById("view-right-link");

    document.body.onmouseover = function () {
      clearTimeout(closeTimer);
    };
    document.body.onmouseout = function () {
      closeTimer = setTimeout(function () {
        window.close();
      }, 2500);
    };

    document.getElementById('title-text').innerHTML = urlComponents.title;

    // Set left and right link dependent on the notification status givin in the URL components
    if (status === "normal") {
      viewLeftLink.innerHTML = "Go to Pocket";
      viewLeftLink.onclick = function () {
        openLinkInNewTab(viewQueueLinkURL);
      };

      viewRightLink.innerHTML = "View on mobile";
      viewRightLink.onclick = function () {
        openLinkInNewTab(viewMobileLinkURL);
      };
    } else if (status === "serviceURL") {
      viewLeftLink.innerHTML = "Learn how";
      viewRightLink.onclick = function () {
        openLinkInNewTab(viewMobileLinkURL);
      };

      viewRightLink.innerHTML = "Go to Pocket";
      viewRightLink.onclick = function () {
        openLinkInNewTab(viewQueueLinkURL);
      };
    }

    closeTimer = setTimeout(function () {
      window.close();
    }, 2500);
  }

  window.onload = initialize;
}());