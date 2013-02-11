function isChrome(){
	return window["chrome"] !== undefined;
}

function isSafari(){
	return window["safari"] !== undefined;
}

function getAllTabs(cb){
	if(isChrome()){
		chrome.tabs.query({}, cb);
	}else if(isSafari()){
		var windows = safari.application.browserWindows;
		var tabs = [];
		for(var windowIdx = 0; windowIdx < windows.length; windowIdx++){
			var windowTabs = windows[windowIdx].tabs;
			for(var idx in windowTabs){
				tabs.push(windowTabs[idx]);
			}
		}
		
		cb(tabs);
	}else{
		cb([]);
	}
};

function executeScriptInTab(tab, script){
	if(isChrome()){
		chrome.tabs.executeScript(tab.id, {code: script});
	}else if(isSafari()){
		tab.page.dispatchMessage("executeScript", script);
	}
}

function executeScriptFromURLInTab(tab, scriptURL){
	if(isChrome()){
		chrome.tabs.executeScript(tab.id, {file: scriptURL});
	}else if(isSafari()){
		var script = $.ajax({
			type: "GET",
			url: "../" + scriptURL,
			async: false
		});
		executeScriptInTab(tab, script.responseText);
	}
}

function openTabWithURL(url){
	if(isChrome()){
		chrome.tabs.create({
			url: url
		});
	}else if(isSafari()){
		var tab = safari.application.activeBrowserWindow.openTab();
		tab.url = url;
	}
}

function getSetting(key){
	return settingContainerForKey(key)[key];
}

function setSetting(key, value){
	var location = settingContainerForKey(key);
	if(!value && location == localStorage){
		localStorage.removeItem(key);
	}else{
		location[key] = value;
	}
}

function settingContainerForKey(key){
	if(isSafari()){
		var location = undefined;
		if(key == "twitter" || key == "greader"){
			location = safari.extension.settings;
		}else if(key == "username" || key == "password"){
			location = safari.extension.secureSettings;
		}else{
			location = localStorage;
		}
		return location;
	}else{
		return localStorage;
	}
}

function addMessageListener(handler){
	if(isChrome()){
		if(window.chrome.extension.onMessage){
			chrome.extension.onMessage.addListener(handler);
		}else{
			chrome.extension.onRequest.addListener(handler);
		}
	}else if(isSafari()){
		var listenable = undefined;
		if(safari.self && safari.self.addEventListener){
			listenable = safari.self;
		}else if(safari.application && safari.application.addEventListener){
			listenable = safari.application;
		}
	
		if(listenable){
			listenable.addEventListener("message", function(message){
				message.tab = message.target;
				var cb = undefined;

				if(message.message.__cbId){
					var tab = message.tab;
					var cbId = message.message.__cbId;
					cb = function(data){
						if(tab && tab.page && tab.page.dispatchMessage){
							tab.page.dispatchMessage("__performCb", {
								cbId: cbId,
								data: data
							});
						}
					};
					message.__cbId = undefined;
				}

				handler(message.message, message, cb);
			}, false);
		}
	}
}

function sendMessageToTab(tab, message){
	if(isChrome()){
        chrome.tabs.sendMessage(tab.id, message);
	}else if(isSafari()){
		tab.page.dispatchMessage("message", message);
	}
}
