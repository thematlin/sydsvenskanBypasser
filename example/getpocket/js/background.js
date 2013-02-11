/*globals ril, webkitNotifications */

$(function () {
  var VERSION = "1.1.5";

  var usePageAction = false,
      authentication;


  // Utility functions
  function isValidURL(s) {
    return (/^https?\:/i).test(s);
  }

  // Notification functions
  function showNotification(tabId, title) {
    showNotificationWithStatus(tabId, title, "normal");
  }

  function showNotificationWithStatus(tabId, title, status) {
    if(isChrome()){
      var showNotifications = (getSetting("notifications") != "false"),
          notificationURL = chrome.extension.getURL('html/notification.html');

      notificationURL += '?' + 'title=' + encodeURIComponent(title);
      notificationURL += '&' + 'status=' + status;

      if (!showNotifications || showNotifications === "true") {
  //      webkitNotifications.createHTMLNotification(notificationURL).show();
      }
    }
  }

  function showInvalidURLNotification(tabId) {
    showNotification(tabId, "Sorry, you can only save valid web pages to Pocket.");
  }

  function showErrorNotification(tabId, message) {
    showNotificationWithStatus(tabId, (message || "Sorry, we can't save this item right now."), "error");
  }

  function showSaveNotification(tabId, title) {
    showNotification(tabId, 'Saved: "' + title.substring(0, 40) + '..."');
  }

  function loadNotificationUIIntoPage(tab, url){
    if(getSetting("notifications") != "false"){
      if(url){
        executeScriptInTab(tab, "window.___PKT__URL_TO_SAVE = '" + url + "'");
      }
      executeScriptFromURLInTab(tab, "js/r.js");
    }
  };

  // Context menu
  (function setupContextMenu() {
    function handler(info, tab) {
      // Create login window if the user is not logged in
      if (!ril.isAuthorized()) {
        return authentication.showLoginWindow();
      }

      var url = info.linkUrl,
          title = info.selectionText || url;
          
      if (!url) {
        url = tab.url;
        title = tab.title;
      }

      if (!isValidURL(url)) {
        showInvalidURLNotification();
        return;
      }

      var tabId = tab && tab.id ? tab.id : null;
      loadNotificationUIIntoPage(tab, url);
      ril.add(title, url, {
        success: function () {
          sendMessageToTab(tab, {status: "success"});
          executeScriptInTab(tab, "window.___PKT__URL_SAVED = '" + url + "'");
          showSaveNotification(tab.id, title);
        },
        error: function (status, xhr) {
          if (status === 401) {
            sendMessageToTab(tab, {status: "unauthorized"});
            return authentication.showLoginWindow();
          }
          sendMessageToTab(tab, {status: "error", error: xhr.getResponseHeader("X-Error")});
          showErrorNotification(tab.id, xhr.getResponseHeader("X-Error"));
        }
      });
    }

    // Add a context menu entry for links to add it to the queue
    if(isChrome()){
      chrome.contextMenus.create({
        "title": "Save to Pocket",
        "contexts": ["page", "frame", "editable", "image", "video", "audio", "link", "selection"],
        "onclick": handler
      });
    }
  }());

  // Authentication
  authentication = (function authentication() {
    function showLoginWindow(targetTab, afterLogin) {
      ril.afterLogin = afterLogin;
      if(isChrome()){
        var width = 428,
            height = 385;

        chrome.windows.create({
          'url': '../html/login.html',
          'type': 'popup',
          'width': width,
          'height': height,
          'left': (screen.width / 2) - ((width+1) / 2),
          'top': (screen.height / 2) - (height / 2)
        }, function () {});
      }else if(isSafari()){
        var targetWindow = (targetTab && targetTab.browserWindow ? targetTab.browserWindow : safari.application.activeBrowserWindow);
        var toolbarItem = undefined;

        if(targetWindow){
          for(var idx = 0; idx < safari.extension.toolbarItems.length; idx++){
            if(targetWindow == safari.extension.toolbarItems[idx].browserWindow){
              toolbarItem = safari.extension.toolbarItems[idx];
              break;
            }
          }
        }

        if(!toolbarItem){
          toolbarItem = safari.extension.toolbarItems[0];
        }
        if(toolbarItem && toolbarItem.popover && toolbarItem.popover.contentWindow && toolbarItem.popover.contentWindow.reset){
          toolbarItem.popover.contentWindow.reset();
        }
        toolbarItem.showPopover();      
      }
    }

    if(isSafari()){
      var changeHandler = function(event){
        var key = event.key;
        if(key == "username" || key == "password"){
          setSetting("token", undefined);
        }

        var username = getSetting('username');
        var password = getSetting('password');
        if(username && password){
          ril.login(username, password, {
            success: function(){
              if(ril.afterLogin){
                ril.afterLogin();
                ril.afterLogin = undefined;
              }
            },
            error: function(){
              alert("There was a problem logging in to your account. Check your username and password, and try again.");
            }
          })
        }
      }

      safari.extension.settings.addEventListener("change", changeHandler);
      safari.extension.secureSettings.addEventListener("change", changeHandler);
    }

    addMessageListener(function (request, sender, sendResponse) {
      if (request.action === "login") {
        ril.login(request.username, request.password, {
          success: function () {
            // dissappear popup
            if(isChrome() && request.tabId){
              chrome.tabs.update(request.tabId, {
                selected: true
              });
            }

            // remove login popup for all tabs
            getAllTabs(function (tabs) {
              $.each(tabs, function (index, tab) {
                if (usePageAction) {
                  chrome.pageAction.setPopup({
                    tabId: tab.id,
                    popup: ''
                  });
                } else {
                  chrome.browserAction.setPopup({
                    tabId: tab.id,
                    popup: ''
                  });
                }
              });
            });

            if(isChrome()){
              chrome.extension.sendMessage({
                action: "updateOptions"
              });
            }
            
            sendResponse({
              status: "success"
            });

            if(ril.afterLogin){
              ril.afterLogin();
              ril.afterLogin = undefined;
            }
          },
          error: function (xhr) {
            sendResponse({
              status: "error",
              error: xhr.getResponseHeader("X-Error")
            });
          }
        });
        return true;
      } else if (request.action === "logout") {
        ril.logout();

        // set login popup for all tabs
        getAllTabs(function (tabs) {
          $.each(tabs, function (index, tab) {
            if (usePageAction) {
              chrome.pageAction.setPopup({
                tabId: tab.id,
                popup: '../html/login.html'
              });
            } else {
              chrome.browserAction.setPopup({
                tabId: tab.id,
                popup: "../html/login.html"
              });
            }
          });
        });
        sendResponse({});
      } else if (request.action === "showLoginWindow") {
        showLoginWindow();
        sendResponse({});
      } else if (request.action === "keyboardShortcutEnabled") {
        sendResponse({keyboardShortcutEnabled: (getSetting("keyboard-shortcut") === "true" ? true : false)});
      }
    });

    return {
      showLoginWindow: showLoginWindow
    };
  }());

  // Listener for fetching options & adding URLs
  addMessageListener(function (request, sender, sendResponse) {
    if (request.action === "localStorage") {
      sendResponse({
        "value": getSetting(request.key)
      });
      return false;
    } else if (request.action === "addURL") {
      var tabId = (sender && sender.tab && sender.tab.id ? sender.tab.id : null);

      // Create login window if the user is not logged in
      if (!ril.isAuthorized()) {
        authentication.showLoginWindow();
        return false;
      }

      loadNotificationUIIntoPage(sender.tab, request.url);
      ril.add(request.title, request.url, {
        ref_id: request.ref_id,
        success: function () {
//          sendMessageToTab(sender.tab, {status: "success"});
          showSaveNotification(tabId, request.title);
          executeScriptInTab(sender.tab, "window.___PKT__URL_SAVED = '" + request.url + "'");
          sendResponse({
            status: "success"
          });
        },
        error: function (status, xhr) {
          if (status === 401) {
            sendResponse(tabId, {status: "unauthorized"});
            return authentication.showLoginWindow();
          }
          sendResponse(tabId, {status: "error", error: xhr.getResponseHeader("X-Error")});
          showErrorNotification(sender.tab.id, xhr.getResponseHeader("X-Error"));
        }
      });
      return true;
    }else if(request.action == "addTags"){
      var tabId = (sender && sender.tab && sender.tab.id ? sender.tab.id : null);

      // Create login window if the user is not logged in
      if (!ril.isAuthorized()) {
        return authentication.showLoginWindow();
      }

      loadNotificationUIIntoPage(sender.tab, request.url);

      var url = request.url;
      var tags = request.tags;
      var action = {
        action: "tags_add",
        tags: tags,
        url: url
      };

      ril.sendAction(action, {
        success: function () {
          sendResponse({
            status: "success"
          });
        },
        error: function (status, xhr) {
          if (status === 401) {
            return authentication.showLoginWindow();
          }
          sendResponse({
            status: "error",
            error: xhr.getResponseHeader("X-Error")
          });
        }
      });
      return true;
    }
  });

  // Listen for clicks on the page action
  function handleSaveToPocket(tab, inUrl){
    var tabId = tab.id,
        title = tab.title,
        url = inUrl || tab.url;

      var self = this;

        console.log("Saving url " + url)

    // check if URL is valid
    if (!isValidURL(url)) {
      showInvalidURLNotification();
      return;
    }

    if(!ril.isAuthorized()){
      authentication.showLoginWindow(tab, function(){
        handleSaveToPocket(tab, inUrl);
      });
      return;
    }

    loadNotificationUIIntoPage(tab, url);

    if(isChrome()){
      chrome.pageAction.setIcon({
        tabId: tabId,
        path: "../img/page-action-icon-added.png"
      });
    }

    ril.add(title, url, {
      success: function () {
        sendMessageToTab(tab, {"status": "success"});
        executeScriptInTab(tab, "window.___PKT__URL_SAVED = '" + url + "'");
        showSaveNotification(tabId, title);
      },
      error: function (status) {
        if (status === 401) {
          sendMessageToTab(tab, {"status": "unauthorized"});
          return authentication.showLoginWindow(tab, function(){
            handleSaveToPocket(tab, inUrl);
          });
        }
        sendMessageToTab(tab, {status: "error", error: xhr.getResponseHeader("X-Error")});
        chrome.pageAction.setIcon({
          tabId: tabId,
          path: "../img/page-action-icon.png"
        });
        showErrorNotification(tabId, xhr.getResponseHeader("X-Error"));
      }
    });
  };


  if(isSafari()){
    safari.application.addEventListener("command", function(event){
      if(event.command == "handleSaveToPocket"){
        handleSaveToPocket(safari.application.activeBrowserWindow.activeTab, event.userInfo);
      }
    }, false);
  }

  if(isChrome()){
    chrome.pageAction.onClicked.addListener(handleSaveToPocket);
    chrome.browserAction.onClicked.addListener(handleSaveToPocket);

    // Called when the url of a tab changes.
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
      if (usePageAction) {
        chrome.pageAction.show(tabId);
      }
      if (!ril.isAuthorized()) {
        if (usePageAction) {
          chrome.pageAction.setPopup({
            tabId: tabId,
            popup: "../html/login.html"
          });
        } else {
          chrome.browserAction.setPopup({
            tabId: tabId,
            popup: "../html/login.html"
          });
        }
      }
    });
  }

  // Initialization code
  (function initialize() {
    // Set the default options
    $.each({
      twitter: "true",
      greader: "true",
      notifications: "true",
      "keyboard-shortcut": "true"
    }, function (key, value) {
      if (!getSetting(key)) {
        setSetting(key, value);
      }
    });

    // Check for first time installation
    if (getSetting("installed") !== "true") {
      setSetting("installed", "true");
      openTabWithURL("http://getpocket.com/installed/")
    }

    // Check for upgrade from 1.0
    else if (getSetting("installed") === "true" && (!getSetting("lastInstalledVersion") || getSetting("lastInstalledVersion") != VERSION)) {
      var browser = isChrome() ? "chrome" : "safari";
      openTabWithURL("http://getpocket.com/" + browser + "/updated?v=" + VERSION + "&vo=" + getSetting("lastInstalledVersion"));
    }

    setSetting("lastInstalledVersion", VERSION);

    if(isSafari()){
      safari.extension.addContentScriptFromURL(safari.extension.baseURI + "sites/twitter/twitter.ril.js", ["http://twitter.com/*", "https://twitter.com/*"], [], true);
      safari.extension.addContentStyleSheetFromURL(safari.extension.baseURI + "sites/twitter/twitter.ril.css", ["http://twitter.com/*", "https://twitter.com/*"], []);

      safari.extension.addContentScriptFromURL(safari.extension.baseURI + "sites/google-reader/google-reader.ril.js", ["https://www.google.*/reader/view/*", "http://www.google.*/reader/view/*", "https://google.*/reader/view/*", "http://google.*/reader/view/*"], [], false);
      safari.extension.addContentStyleSheetFromURL(safari.extension.baseURI + "sites/google-reader/google-reader.ril.css", ["https://www.google.*/reader/view/*", "http://www.google.*/reader/view/*", "https://google.*/reader/view/*", "http://google.*/reader/view/*"], []);
    }
  }());
});
