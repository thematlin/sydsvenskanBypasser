$(function () {
  if(window.top != window) return;

  function isChrome(){
    return window["chrome"] != undefined && window.chrome.app;
  }

  function isSafari(){
    return window["safari"] != undefined;
  }

  function addRequestListener(listener){
    if(this.isChrome()){
      window.chrome.extension.onRequest.addListener(listener);
    }else if(this.isSafari()){
      window.safari.self.addEventListener("message", function(thingy){
        listener(thingy.message, thingy);
      });
    }
  }

  function sendRequest(message, cb){
    if(isChrome()){
      window.chrome.extension.sendMessage(message, cb);
    }else if(isSafari()){
      if(cb){
        message["__cbId"] = Callbacker.addCb(cb);
      }

      safari.self.tab.dispatchMessage("message", message);
    }
  }

  var debug = false;

  function iconClickEventHandler(eventObject) {
    toggleGoogleReaderEntry($(eventObject.target));
  }

  function toggleGoogleReaderEntry(icon) {
    var main = icon.parents('.entry'),
        url = icon.attr('href'),
        title = main.find('.entry-title').text(),
        isUnread = icon.hasClass('unread');

    // Only allow not unread items (read or not added) to add to the Queue
    if (!isUnread) {
      sendRequest({
        action: "addURL",
        url: url,
        title: title
      }, function (response) {
        // TODO: check for error
        if (response.status === "success") {
          icon.addClass('unread');
        }
        window.thePKT_BM.handleResponse(response);
      });
    }
  }

  function listenForEntryInserts() {
    $('#entries').bind('DOMNodeInserted', function (evtObj) {
      handleNewlyInsertedNode(evtObj);
    }).find('.entry').each(function (index, value) {
      insertIconInNewlyInsertedEntry($(value), true);
    });
  }

  function insertIconInNewlyInsertedEntry(entry, usejQuery) {
    var entryLink, url, i, insertInsideElement, icon,
        insertionSearchList = ['.entry-icons'];

    if (entry.hasClass('ril_marked')) {
      if (debug) {
        console.log("Entry has already been marked as inserted with icon.");
      }
      return;
    } else if (entry[0].firstChild === null) {
      if (debug) {
        console.log("Entry has no children and will be ignored." + " Probably an .entry in the expanded display mode.");
      }
      return;
    } else {
      if (debug) {
        console.log("Inserting icon into newly inserted entry...");
      }
    }

    // Try finding the element with an 'href' attribute that has the URL of the page.
    entryLink = entry.find('.entry-title-link');
    if (entryLink.length === 0) {
      entryLink = entry.find('.entry-original');
    }

    if (debug) {
      console.log("find('.entry-title-link') = " + entryLink.html());
    }

    if (entryLink.length > 0) {
      url = entryLink[0].href;

      if (debug) {
        console.log("Found URL=" + url);
      }
    } else {
      if (debug) {
        console.log("Could not find entryLink with an href, in the entry: '" + entry.html() + "'");
      }
    }

    for (i = 0; i < insertionSearchList.length; ++i) {
      insertInsideElement = entry.find(insertionSearchList[i]);

      // Only considered the right item if it exists and it's displayed
      if (insertInsideElement.length === 1 && insertInsideElement.css("display") !== "none") {
        break;
      } else {
        insertInsideElement = null;
      }
    }

    if (debug) {
      console.log("insertInsideElement = " + insertInsideElement.html());
    }

    if (!insertInsideElement) {
      return;
    }

    icon = $('<div class="ril-icon">').attr('href', url).appendTo(insertInsideElement);

    // Add a click-event to the icon, that will add it to ril
    if (!icon.hasClass('clickable')) {
      icon.bind('click', function (evtObj) {
        iconClickEventHandler(evtObj);

        evtObj.preventDefault();
        evtObj.stopPropagation();
        evtObj.cancelBubble = true;
      });
      icon.addClass('clickable');
    }
    entry.addClass('ril_marked');

  }

  function handleNewlyInsertedNode(evtObj) {
    if (debug) {
      console.log("DOMNodeInserted fired");
    }

    var target = $(evtObj.target);
    if (target.hasClass('entry')) {
      if (debug) {
        console.log("Inserted node has class 'entry'");
      }

      insertIconInNewlyInsertedEntry(target);
    } else if (target.hasClass('entry-container')) {
      if (debug) {
        console.log("Inserted node has class 'entry-container'");
      }

      insertIconInNewlyInsertedEntry(target);
    }
  }

  function init() {
    document.body.className = document.body.className + " PKT_ENABLED";
    listenForEntryInserts();
  }

  sendRequest({
    action: "localStorage",
    key: "greader"
  }, function (response) {
    if (response.value === "true" || response.value === true) {
      init();
    }
  });
});