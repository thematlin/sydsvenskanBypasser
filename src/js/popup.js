(function() {
	var getSydsvenskanCookieCallback = function(cookie) {
		if (cookie !== null) {
			resetArticlesCookieAndShowSuccess(cookie);
		}
	};

	var showResult = function(containerName) {
		var errorContainer = document.getElementById(containerName);
		console.log(errorContainer);
		errorContainer.removeAttribute('style');
	};

	var resetArticlesCookieAndShowSuccess = function(cookie) {
		chrome.cookies.remove({ url: sydsvenskanUrl, name: cookieName }, function(details) {
			if (details !== null) {
				showResult('success');
			} else {
				showResult('error');
			}
		});
	};

	var sydsvenskanUrl = 'http://www.sydsvenskan.se';
	var cookieName = '.visitedPages';

	chrome.cookies.get({ url: sydsvenskanUrl, name: cookieName }, getSydsvenskanCookieCallback);
})();