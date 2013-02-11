var ril = (function () {
  var baseURL = "https://readitlaterlist.com/v3",
      apiKey = (window.safari ? "135gbu4epq447VX194TjSfto95A0jbz0" : "801p7PR9A5b78x11f4ghRD8CVFdrA689"),
      cookieAuthAttempted = false;
      
  function isAuthorized() {
    return getSetting("username") && getSetting("token");
  }

  function logout() {
    setSetting("username", undefined);
    setSetting("password", undefined);
    setSetting("token",    undefined);
  }

  /* Attempt to get a token from the API by looking at what cookies the client
   * is sending. Callbacks is an optional hash with "success" and "failure".
   */
  function attemptToGetExistingToken(callbacks) {
    callbacks = callbacks || {};

    if (cookieAuthAttempted === false) {
      $.ajax({
        url: baseURL + "/token",
        type: "POST",
        data: {
          apikey: apiKey
        },
        success: function (data) {
          cookieAuthAttempted = 1;
          localStorage.username = data.username;
          localStorage.token = data.token;
          if (callbacks.success) {
            callbacks.success();
          }
        },
        error: function () {
          cookieAuthAttempted = 2;
          if (callbacks.failure) {
            callbacks.failure();
          }
        }
      });
    } else if (cookieAuthAttempted === 1) {
      if (callbacks.success()) {
        callbacks.success();
      }
    } else if (cookieAuthAttempted === 2) {
      if (callbacks.failure()) {
        callbacks.failure();
      }
    }
  }

  var isLoggingIn = false;
  function login(user, pass, callbacks) {
    if(isLoggingIn) return;
    isLoggingIn = true;

    try{
    var authURL = baseURL + "/auth"

    var self = this;
    $.ajax({
      url: authURL,
      type: "POST",
      data: {
        getToken: 1,
        username: user,
        password: pass,
        apikey: apiKey
      },
      success: function (data) {
        // Save login information
        setSetting("username", user);
        setSetting("password", pass);
        setSetting("token", data.token);
        isLoggingIn = false;
        callbacks.success();

        if(self.afterLogin){
          self.afterLogin();
          self.afterLogin = undefined;
        }
      },
      error: function(){
        isLoggingIn = false;
        callbacks.error.apply(callbacks, Array.apply(null, arguments));
      }
    });
    }catch(e){}
  }

  function add(title, url, options) {
    var action = {
      action: "add",
      url: url,
      title: title
    };
    this.sendAction(action, options);
  }

  function sendAction(action, options){
    var sendURL = baseURL + "/send";

    if (options.ref_id) {
      action.ref_id = options.ref_id;
    }

    $.ajax({
      url: sendURL,
      type: "POST",
      data: {
        token: localStorage.token,
        apikey: apiKey,
        actions: JSON.stringify([action])
      },
      success: function () {
        options.success();
      },
      error: function (xhr) {
        if (xhr.status === 401) {
          logout();
        }
        options.error(xhr.status, xhr);
      }
    });
  }

  if (!isAuthorized()) {
    attemptToGetExistingToken({
      success: function () {
        console.log('Authorized via cookie.');
      },
      failure: function () {
        console.log('Could not authorize.');
      }
    });
  } else {
    console.log('Already authorized.');
  }

  return {
    isAuthorized: isAuthorized,
    attemptToGetExistingToken: attemptToGetExistingToken,
    login: login,
    logout: logout,
    add: add,
    sendAction: sendAction
  };
}());