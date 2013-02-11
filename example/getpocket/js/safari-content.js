(function(){
if(window.top != window) return;
if(!window.safari) return;

safari.self.addEventListener("message", function(msg){
	var name = msg.name;
	var message = msg.message;

	if(name == "executeScript"){
		eval(message);
	}else if(name == "__performCb"){
		var cbId = message.cbId;
		var data = message.data;
		Callbacker.performCbFromIdWithData(data, cbId);
	}
});

function isChrome(){
	return window["chrome"] != undefined;
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

document.addEventListener("contextmenu", function handleContextMenu(event) {
    safari.self.tab.setContextMenuEventUserInfo(event, event.target.href);
}, false);

var Callbacker = window.Callbacker = {
	addCb: function(cb){
		if(!this._cbsToIds){
			this._cbsToIds = {};
		}
		if(!this._cbCounter){
			this._cbCounter = 0;
		}

		var cbId = ++this._cbCounter;
		this._cbsToIds[cbId] = cb;
		return cbId;
	},
	performCbFromIdWithData: function(data, cbId){
		if(!this._cbsToIds) return;

		var cb = this._cbsToIds[cbId];
		if(!cb) return;

		this._cbsToIds[cbId] = undefined;

		cb(data);
	}
};
})();
