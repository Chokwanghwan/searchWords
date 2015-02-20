function xhrGet(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (this.readyState == 4) {
          callback(this);
        }
    };
    xhr.send()
};

chrome.extension.onMessage.addListener(function(request, sender) {
  if (request.action == "getSource") {
    var sampleText = strip_tags(request.source);
    var rawWordData = extractWords(sampleText);
    console.log("testtesttest"+rawWordData);

    var wordDictionary = makeWordDictionary(rawWordData);
    var translateData = translateWords(wordDictionary);

    message.innerHTML = "";
  }
});

function printOnDiv(word) {
    var div = document.createElement('div');
    div.setAttribute('class', 'half tile');
    document.body.appendChild(div); 

    div.innerHTML=word;
}

//번역, 검색 불가능 단어 제거
function translateWords(wordDictionary) {
  var keys = Object.keys(wordDictionary);
    var index = parseInt(Math.random()*keys.length);
    var dictList = [];

    for(var i =0; i<keys.length; i++){
      var url = "http://tooltip.dic.naver.com/tooltip.nhn?wordString=" + keys[i] + "&languageCode=4&nlp=false";
      xhrGet(url, function(xhr) {
        var obj = JSON.parse(xhr.responseText);
        if(obj.hasOwnProperty('entryName')){
          dictList.push(obj['entryName']);
          printOnDiv(obj['entryName']);
        }
      });
    }
};

//중복 단어 제거, Dictionary형태로 재구성
function makeWordDictionary(rawData) {
  var wordList = rawData;
  var wordDict = {}
  for(var i=0; i<wordList.length; i++){
      var word = wordList[i];
      console.log("test["+i+"] = "+word);
      if (wordDict.hasOwnProperty(word)) {
        wordDict[word]++;
      } else {
        wordDict[word] = 1;
      }
  }

  return wordDict;
};

//단어 단위로 분류, 공백과 불필요 문자, 숫자 제거 + 알파벳 한개짜리 단어, return(특정 에러 유발) 제거
function extractWords(sampleText) {
  //return sampleText.replace(/^\s/gm, '');
  sampleText = sampleText.replace(/[return]/g, '');
  sampleText = sampleText.replace(/[&nbsp,\d*];/g, '');
  sampleText = sampleText.replace(/[\d]/g, '');
  sampleText = sampleText.replace(/\b\w\b/g, '');
  sampleText = sampleText.match(/\b\w+\b/g);


  return sampleText;
};

//HTML태그 제거
function strip_tags (input, allowed) {
    allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
    var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
        commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
    return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {        
      return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
    });
};

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

};

window.onload = onWindowLoad;