function isChrome(){
	return window["chrome"] != undefined && window.chrome.app;
}

function isSafari(){
	return window["safari"] != undefined;
}

function reset(){
	var subtextField = document.getElementById("subtext-field");
	subtextField.setAttribute("class", "");
	subtextField.innerHTML = 'You can log into Pocket with your existing Read It Later account.';

	var usernameField = document.getElementById("username-field");
	var passwordField = document.getElementById("password-field");

	usernameField.value = "";
	passwordField.value = "";
}

function addRequestListener(listener){
	if(this.isChrome()){
		if(window.chrome.extension.onMessage){
			window.chrome.extension.onMessage.addListener(listener);
		}else{
			window.chrome.extension.onRequest.addListener(listener);
		}
	}else if(this.isSafari()){
	  window.safari.self.addEventListener("message", function(thingy){
	    listener(thingy.message, thingy);
	  });
	}
}

function sendRequest(message, cb){
	if(isChrome()){
		if(window.chrome.extension.sendMessage){
			window.chrome.extension.sendMessage(message, cb);
		}else{
			window.chrome.extension.sendRequest(message, cb);
		}
	}else if(isSafari()){
	  if(cb){
	    message["__cbId"] = Callbacker.addCb(cb);
	  }

	  safari.extension.globalPage.dispatchMessage("message", message);
	}
}

var createAccountLinkURL = "http://getpocket.com/signup/";
var forgotLinkURL = "http://getpocket.com/forgot/";

var openLinkInNewTab = function(tabId, url) {
	if(isSafari()){
		var tab = safari.application.activeBrowserWindow.openTab();
		tab.url = url;
		safari.extension.popovers[0].hide();
	}else{
		chrome.tabs.create({'url': url}, function(tab) {
			chrome.tabs.update(tab.id, { selected: true } )
			});
	}
};

var startLogin = function(tabId) {
	var error_field = document.getElementById("subtext-field");
	error_field.setAttribute("class", "");
	error_field.innerHTML = "Logging in...";

	var username = document.getElementById("username-field").value;
	var password = document.getElementById("password-field").value;

	var onSuccess = function(){
		if(isChrome()){
			this.close();
		}else if(isSafari()){
			safari.extension.popovers[0].hide();
		}
	}

	var onError = function(error){
		error_field.setAttribute("class", "error");
		error_field.innerHTML = "The username and or password you entered was incorrect.";
		error_field.style.display = "block";
	}

	if(isChrome()){
		sendRequest({tabId:tabId, action:"login", username:username, password:password}, function(response) {
			if (response.status == "error") {
				onError(response.error);
			} else if (response.status == "success") {
				onSuccess();
			};
		});
	}else if(isSafari()){
		safari.extension.globalPage.contentWindow.ril.login(username, password, {
			success: onSuccess,
			error: onError
		});
	}
};

var getTabID = function(cb){
	if(isChrome()){
		chrome.tabs.getSelected(null, function(tab) {
			var tabId = tab.id;
			cb(tabId);
		});
	}else if(isSafari()){
		cb("");
	}
};

var init = function () {
	// Get the tabId to close the popup after the login
	getTabID(function(tabId){
		var loginButton = document.getElementById("login-button-link");
		loginButton.onclick = function () {
			startLogin(tabId);
			return false;
		};
	
		// Signup and Forgot Password links	
		var createAccountLink = document.getElementById("create-account-link");
		createAccountLink.onclick = function() {
			openLinkInNewTab(tabId, createAccountLinkURL);
		};

		var forgotLink = document.getElementById("forgot-password-link");
		forgotLink.onclick = function () {
			openLinkInNewTab(tabId, forgotLinkURL);
		};
	});

	if(isSafari()){
		window.onkeydown = keypressed;
	}else{
		window.onkeyup = keypressed;
	}

	// We need to set a timer here because the username-field will not be selected if we don't have a delay
	setTimeout(function() {
		document.getElementById("username-field").focus();
	}, 200);

};

	var keypressed = function(){
		// Hitting enter should submit login form 
	if(event.keyCode == '13'){
		startLogin("");
//					chrome.tabs.getSelected(null, function(tab) {
//						startLogin(tab.id);
//					});
	}
};

window.onload = init;