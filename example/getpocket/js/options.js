(function () {
  // Helper function becuase localStorage can't save booleans -.-
  function toBool(str) {
    return "false" === str ? false : str;
  }

  function initializeCheckboxes() {
    var twitterCheckbox = document.getElementById('twitter-checkbox'),
        greaderCheckbox = document.getElementById('greader-checkbox'),
        notificationsCheckbox = document.getElementById('notifications-checkbox');

    twitterCheckbox.onclick = function () {
      localStorage.twitter = twitterCheckbox.checked;
    };

    greaderCheckbox.onclick = function () {
      localStorage.greader = greaderCheckbox.checked;
    };

    notificationsCheckbox.onclick = function () {
      localStorage.show_notifications = notificationsCheckbox.checked;
    };
  }

  function writeUiStateFromStorage() {
    var twitterCheckbox = document.getElementById('twitter-checkbox'),
        greaderCheckbox = document.getElementById('greader-checkbox'),
        notificationsCheckbox = document.getElementById('notifications-checkbox');

    twitterCheckbox.checked = toBool(localStorage.twitter);
    greaderCheckbox.checked = toBool(localStorage.greader);
    notificationsCheckbox.checked = toBool(localStorage.show_notifications);
  }


  function initialize() {
    var usernameField = document.getElementById("username-field"),
        logoutLinkWrapper = document.getElementById("logout-link-wrapper"),
        loginLinkWrapper = document.getElementById("login-link-wrapper"),
        logoutLink = document.getElementById("logout-link"),
        loginLink = document.getElementById("login-link"),
        username = localStorage.username;
    
    if (username) {
      usernameField.innerHTML = username;
      logoutLinkWrapper.style.display = "inline";
      usernameField.style.display = "inline";
      loginLinkWrapper.style.display = "none";
    } else {
      usernameField.style.display = "none";
      logoutLinkWrapper.style.display = "none";
      loginLinkWrapper.style.display = "inline";
    }

    logoutLink.onclick = function () {
      // Inform background.js to logout
      chrome.extension.sendMessage({
        action: "logout"
      }, function () {
        initialize();
      });
    };

    loginLink.onclick = function () {
      chrome.extension.sendMessage({
        action: "showLoginWindow"
      }, function () {});
    };

    writeUiStateFromStorage();
    initializeCheckboxes();
  }

  window.onload = initialize;

  chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
    if (request.action === "updateOptions") {
      initialize();
    }
  });
}());





