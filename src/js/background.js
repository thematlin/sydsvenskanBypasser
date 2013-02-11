var checkForValidUrl = function(tabId, changeInfo, tab) {
	if (tab.url.indexOf('sydsvenskan.se') > -1) {
		chrome.pageAction.show(tabId);
	}
};

chrome.tabs.onUpdated.addListener(checkForValidUrl);