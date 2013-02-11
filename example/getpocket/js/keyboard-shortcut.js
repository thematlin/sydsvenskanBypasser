(function(){
function isChrome(){
	return window["chrome"] != undefined;
}

function isSafari(){
	return window["safari"] != undefined;
}

function addRequestListener(listener){
	if(this.isChrome()){
		window.chrome.extension.onMessage.addListener(listener);
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
function handleKeyDown(e) {
	e = e || window.event;
	var k = e.which || e.charCode || e.keyCode;

	if(
		(!e.ctrlKey && e.metaKey && !e.altKey && e.shiftKey && k === 80) || // Mac: Command Key + Shift key + no Option key + no Control key
		(e.ctrlKey && !e.metaKey && !e.altKey && e.shiftKey && k === 83)   // Windows: Control key + Shift key + no Alt key + no Windows key
		){
		sendRequest({action: "keyboardShortcutEnabled"}, function(response){
			if(response.keyboardShortcutEnabled){
				sendRequest({action: "addURL", title: document.title, url: window.location.toString()}, function (response) {
					window.thePKT_BM.handleResponse(response);
				});
			}
		});
		e.preventDefault();
		return false;
	}

	return true;
};

if(window.addEventListener){
	window.addEventListener("keydown", handleKeyDown);
}else{
	document.onkeydown = handleKeyDown;
}
})();