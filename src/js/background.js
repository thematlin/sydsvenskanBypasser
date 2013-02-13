var checkForValidUrl = function(tabId, changeInfo, tab) {
	if (tab.url.indexOf('sydsvenskan.se') > -1) {
		chrome.cookies.get({ url: sydsvenskanUrl, name: cookieName }, getSydsvenskanCookieCallback);
	}
};

var getSydsvenskanCookieCallback = function(cookie) {
	if (cookie !== null) {
		resetArticlesCookieAndShowSuccess(cookie);
	}
};

var resetArticlesCookieAndShowSuccess = function(cookie) {
	chrome.cookies.remove({ url: sydsvenskanUrl, name: cookieName });
};

var sydsvenskanUrl = 'http://www.sydsvenskan.se';
var cookieName = '.visitedPages';

chrome.tabs.onUpdated.addListener(checkForValidUrl);