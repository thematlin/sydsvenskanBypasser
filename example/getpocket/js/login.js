(function () {
  var createAccountLinkURL = "http://getpocket.com/signup/",
      forgotLinkURL = "http://getpocket.com/forgot/";

  function openLinkInNewTab(tabId, url) {
    chrome.tabs.create({
      'url': url
    }, function (tab) {
      chrome.tabs.update(tab.id, {
        selected: true
      });
    });
  }

  function startLogin(tabId) {
    var error_field = document.getElementById("subtext-field");
    error_field.setAttribute("class", "error");
    error_field.innerHTML = "Logging in...";

    chrome.extension.sendMessage({
      tabId: tabId,
      action: "login",
      username: document.getElementById("username-field").value,
      password: document.getElementById("password-field").value
    }, function (response) {
      if (response.status === "error") {
        alert("ERROR " + response.error);
        error_field.setAttribute("class", "error");
        error_field.innerHTML = "The username and or password you entered was incorrect.";
      } else if (response.status === "success") {
        this.close();
      }
    });
  }

  function initialize() {
    // Get the tabId to close the popup after the login
    chrome.tabs.getSelected(null, function (tab) {
      document.getElementById("login-button-link").onclick = function () {
        startLogin(tab.id);
        return false;
      };

      // Signup and Forgot Password links
      document.getElementById("create-account-link").onclick = function () {
        openLinkInNewTab(tab.id, createAccountLinkURL);
      };

      document.getElementById("forgot-password-link").onclick = function () {
        openLinkInNewTab(tab.id, forgotLinkURL);
      };
    });


    // We need to set a timer here because the username-field will not be selected if we don't have a delay
    setTimeout(function () {
      document.getElementById("username-field").focus();
    }, 200);
  }


  window.onkeyup = function () {
    // Hitting enter should submit login form
    if (event.keyCode === 13) {
      chrome.tabs.getSelected(null, function (tab) {
        startLogin(tab.id);
      });
    }
  };

  window.onload = initialize;
}());