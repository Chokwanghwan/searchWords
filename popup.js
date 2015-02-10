function xhrGet(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (this.readyState == 4) {
            callback(this)
        }
    };
    xhr.send()
}

chrome.extension.onMessage.addListener(function(request, sender) {
  if (request.action == "getSource") {
    var sampleText = strip_tags(request.source);
    var rawWordData = extractWords(sampleText);
    var wordDictionary = makeWordDictionary(rawWordData);
    var keys = Object.keys(wordDictionary);
    var index = parseInt(Math.random()*keys.length);

    dictList = [];
    for(var i =0; i<keys.length; i++){
      var url = "http://tooltip.dic.naver.com/tooltip.nhn?wordString=" + keys[i] + "&languageCode=4&nlp=false";
      xhrGet(url, function(xhr) {
        var obj = JSON.parse(xhr.responseText);
        if(obj.hasOwnProperty('entryName')){
          console.log(obj['entryName']+":"+obj['mean']);
          dictList.push(obj['entryName']);
        }
      });
    }
  }
});

function makeWordDictionary(rawData) {
  var wordList = rawData;
  var wordDict = {}
  for(var i=0; i<wordList.length; i++){
      var word = wordList[i];
      if (wordDict.hasOwnProperty(word)) {
        wordDict[word]++;
      } else {
        wordDict[word] = 1;
      }
  }
  return wordDict;
}


function extractWords(sampleText) {
  //return sampleText.replace(/^\s/gm, '');
  sampleText = sampleText.replace(/[&nbsp,\d*];/g, '');
  sampleText = sampleText.replace(/[\d]/g, '');
  sampleText = sampleText.match(/\b\w+\b/g);

  return sampleText;
}

function strip_tags (input, allowed) {
    allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
    var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
        commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
    return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {        
      return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
    });
}

function onWindowLoad() {

  var message = document.querySelector('#message');

  chrome.tabs.executeScript(null, {
    file: "getPagesSource.js"
  }, function() {
    // If you try and inject into an extensions page or the webstore/NTP you'll get an error
    if (chrome.extension.lastError) {
      message.innerText = 'There was an error injecting script : \n' + chrome.extension.lastError.message;
    }
  });

}

window.onload = onWindowLoad;