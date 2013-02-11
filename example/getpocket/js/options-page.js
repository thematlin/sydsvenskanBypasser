// Helper function becuase localStorage can't save booleans -.-
var toBool = function(str) {
		if ("false" === str) return false;
		else return str;
};

var updateUI = function() {
	document.getElementById('twitter-checkbox').checked = toBool(localStorage['twitter']);
	document.getElementById('greader-checkbox').checked = toBool(localStorage['greader']);
	document.getElementById('notifications-checkbox').checked = toBool(localStorage['notifications']);
	document.getElementById('keyboard-shortcut-checkbox').checked = toBool(localStorage['keyboard-shortcut']);
};

var initCheckboxes = function() {
	var twitter_checkbox = document.getElementById('twitter-checkbox');
	twitter_checkbox.onclick = function() {
		localStorage['twitter'] = twitter_checkbox.checked;
	}

	var greader_checkbox = document.getElementById('greader-checkbox');
	greader_checkbox.onclick = function() {
		localStorage['greader'] = greader_checkbox.checked;
	}

	var notifications_checkbox = document.getElementById('notifications-checkbox');
	notifications_checkbox.onclick = function() {
		localStorage['notifications'] = notifications_checkbox.checked;
	}

	var keyboard_shortcut_checkbox = document.getElementById('keyboard-shortcut-checkbox');
	keyboard_shortcut_checkbox.onclick = function() {
		localStorage['keyboard-shortcut'] = keyboard_shortcut_checkbox.checked;
	}
};

var init = function(){

	document.getElementById("platformSpecificKeyboardShortcutKey").innerHTML = (navigator.platform.match(/^Mac/) ? "&#8984;&#8679;P" : "Control-Shift-P");

	
	var usernameField = document.getElementById("username-field"); 

	var logoutLinkWrapper = document.getElementById("logout-link-wrapper");
	var loginLinkWrapper = document.getElementById("login-link-wrapper");
	var username = localStorage['username'];
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

	var logoutLink = document.getElementById("logout-link");
	logoutLink.onclick = function () {
		// Inform background.js to logout
		chrome.extension.sendMessage({action:"logout"}, function() {
			init();	
		});
	};

	loginLink =  document.getElementById("login-link");
	loginLink.onclick = function() {
		chrome.extension.sendMessage({action:"showLoginWindow"}, function() {});
	};

	updateUI();
	initCheckboxes();
};

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.action == "updateOptions") {
		init();
	};
});

window.onload = init;