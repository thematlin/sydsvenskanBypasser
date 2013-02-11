$(function () {
  if(window.top != window) return;

  function isChrome(){
    return window["chrome"] !== undefined && window["chrome"] !== null && window.chrome.app;
  }

  function isSafari(){
    return window["safari"] !== undefined && window["safari"] !== null;
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

  var twitterBaseURL = "http://twitter.com";

  var pluginVersion;
  var detectCompatibility = function(){
    if($("div.tweet").length > 0){
      var className = "ril-plugin-v1";
      pluginVersion = 1;

      if($("div.tweet ul.tweet-actions").length > 0){
        className = "ril-plugin-v2";
        pluginVersion = 2;
      }

      $(document.body).addClass(className);

      detectCompatibility = function(){};
    }
  };

  function addTweet(action) {
    var tweetURL = twitterBaseURL + $(action).parent('ul').find('a.js-open-close-tweet').attr('href'),
        $tweet = $(action).parents('div.tweet'),
        twitter_username = $tweet.attr('data-screen-name'),
        tweetHTML = $tweet.find('p.js-tweet-text').html().replace(/\n/g, ' '),
        links = $tweet.find('p.js-tweet-text').find('a').not('.twitter-atreply').not('.twitter-hashtag');

    sendRequest({
      action: "addURL",
      url: links[0].href, // naively use the first link
      title: twitter_username + ": " + tweetHTML,
      ref_id: $(action).find('a').attr('data-tweet-id')
    }, function (response) {
      window.thePKT_BM.handleResponse(response);
    });

    return false;
  }

  function attachClickListener(action, isNew) {
    $(action).click(function (e) {
      e.preventDefault();
      e.stopPropagation();
      addTweet(this);
    });

    if (isNew) {
      $(action).hover(function (e) {
        e.preventDefault();
        action.find('i').css('background-color', action.find('b').css('color'));
      });
    }
  }

  function createRILAction(tweetId) {
    var action = $('<a href="#" class="read-later-action old" data-tweet-id="' + tweetId + '" title="Pocket"><span><i></i><b>Pocket</b></span></a>');
    attachClickListener(action);
    return action;
  }

  function createNewRILAction(tweetId) {
    var action = $('<li><a href="#" class="read-later-action new" data-tweet-id="' + tweetId + '" title="Pocket"><span><i></i><b>Pocket</b></span></a></li>');
    attachClickListener(action, true);
    return action;
  }

  function addRILToActionElement(action_element) {
    var links = $(action_element).parents('div.tweet').find('p.js-tweet-text').find('a').not('.twitter-atreply').not('.twitter-hashtag'),
        tweetId;
    if (links.length > 0) {
      var rilAction = createRILAction(tweetId);
      var bufferAction = action_element.find(".buffer-action");
      if(bufferAction.length > 0){
        rilAction.insertBefore(bufferAction);
      }else{
        $(action_element).append(rilAction);
      }
    }
  }

  function addRILToActionList(actionList) {
    // Only show Pocket in Tweets with links
    var links = $(actionList).parents('.tweet').find('p.js-tweet-text').find('a').not('.twitter-atreply').not('.twitter-hashtag'),
        tweetId, rilAction;

    if (links.length > 0) {
      tweetId = $(actionList).parents('.tweet').attr('data-item-id');
      rilAction = createNewRILAction(tweetId);

      var bufferAction = $(actionList).find(".buffer-action");
      if(bufferAction.length > 0){
        rilAction.insertBefore(bufferAction);
      }else{
        var target = $(actionList);
        if(pluginVersion == 1){
          target = target.find('.action-open-container');
          target.before(rilAction);
          $(actionList).prepend($('<li class="ril-fade-action"><span>&nbsp;</span></li>'));
        }else{
          rilAction.addClass("ril-fade-action");
          target.append(rilAction);
        }
      }

      if (pluginVersion > 1 || $(actionList).parents('.tweet').hasClass('permalink-tweet') || $(actionList).parent().hasClass('stream-item-header')) {
        rilAction.find('i').css('background-color', rilAction.find('b').css('color'));
      }
    }
  }

  function addRILToActionElementToOldTweets(tweets) {
    $(tweets).each(function () {
      addRILToActionElement(this);
    });
  }

  function addRILToActionElementToNewTweets(tweets) {
    $(tweets).each(function () {
      addRILToActionList(this);
    });
  }

  function getOldTweetsToAdjust() {
    return $('span.tweet-actions:not(:has(a.read-later-action))');
  }

  function getNewTweetsToAdjust() {
    if(pluginVersion == 1){
      return $('body.ril-plugin-v1 div.tweet ul.actions:not(:has(a.read-later-action)');
    }else{
      return $('body.ril-plugin-v2 div.tweet ul.tweet-actions:not(:has(a.read-later-action))');
    }
  }

  function initialize() {
    var detected = false;
    setInterval(function () {
      detectCompatibility();
      addRILToActionElementToOldTweets(getOldTweetsToAdjust());
      addRILToActionElementToNewTweets(getNewTweetsToAdjust());
    }, 1000);
  }

  sendRequest({
    action: "localStorage",
    key: "twitter"
  }, function (response) {
    if (response.value === "true" || response.value === true) {
      initialize();
    }
  });
});