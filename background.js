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

var XHR_TYPE_FORM = "xhr_type_form";
var XHR_TYPE_JSON = "xhr_type_json";
function xhrPost(url, params, req_type, callback) {
    var xhr = new XMLHttpRequest();
    var params = params;
    xhr.open('POST', url, true);
    //params format  :  "email=email&url=url&word=word"
    
    // xhr.setRequestHeader("Content-type", params.length);
    // xhr.setRequestHeader("Connection", "close");

    xhr.onreadystatechange = function() {
        if (this.readyState == 4) {
          callback(this);
        }
    };
    console.log(params);

    if (req_type === XHR_TYPE_FORM) {
      xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xhr.send(params);
    } else if (req_type === XHR_TYPE_JSON) {
      xhr.setRequestHeader("Content-type", "application/json", "charset=utf-8");
      xhr.send(JSON.stringify(params));
    } else {
      console.log("고려되지 않은 경우입니다.");
      return;
    }
};

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    var url = tab.url; // url type : string 

    if (url !== undefined && changeInfo.status == "complete") {
      chrome.tabs.executeScript(null, {
        file: "getPagesSource.js"
      }, function() {
        // If you try and inject into an extensions page or the webstore/NTP you'll get an error
        if (chrome.extension.lastError) {

        }
      });
    }
});


chrome.extension.onMessage.addListener(function(request, sender) {
  if (request.action == "getSource") {
    var url = sender.url;
    var email = 'email@email.email';
    var removeHtmlTag = strip_tags(request.source); //HTML tag 제거
    var afterExtract = extractWords(removeHtmlTag); //정규표현식 본문추출
    var afterMakeDict = makeWordDictionary(afterExtract); //Dictionary 
    translateWords(afterMakeDict, function(wordDict){
      insertDataToServer(email, url, wordDict);
    });
  }
});

//HTML태그 제거
function strip_tags (input, allowed) {
    allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
    var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
        commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
    return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {        
      return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
    });
};

//단어 단위로 분류, 공백과 불필요 문자, 숫자 제거 + 알파벳 한개짜리 단어, hasOwnProperty(특정 에러 유발) 제거
function extractWords(sampleText) {
  sampleText = sampleText.replace(/hasOwnProperty/g, ''); //hasOwnProperty 제거
  sampleText = sampleText.replace(/&nbsp/g, ''); //&nbsp 제거
  sampleText = sampleText.replace(/[\d]/g, ''); //숫자 제거
  sampleText = sampleText.replace(/\b\w\b/g, ''); //알파벳 한개짜리 단어 제거
  sampleText = sampleText.match(/\b\w+\b/g); //단어 단위로 추출 
  return sampleText;
};

//중복 단어 제거, Dictionary형태로 재구성
function makeWordDictionary(rawData) {
  var wordList = rawData;
  var wordDict = {}
  for(var i=0; i<wordList.length; i++){
      var word = wordList[i];
      //console.log('log='+i +':'+wordList[i]);
      if (wordDict.hasOwnProperty(word)) {
        wordDict[word]++;
      } else {
        wordDict[word] = 1;
      }
  }
  return wordDict;
};

//번역, 검색 불가능 단어 제거
function translateWords(wordDictionary, callback) {
  var keys = Object.keys(wordDictionary);

    // var index = parseInt(Math.random()*keys.length);
    var keyCount=0;
    var wordDict = {};
    for(var i =0; i<keys.length; i++){
      var url = "http://tooltip.dic.naver.com/tooltip.nhn?wordString=" + keys[i] + "&languageCode=4&nlp=false";
      xhrGet(url, function(xhr) {
        var obj = JSON.parse(xhr.responseText);
        keyCount++;
        if(obj.hasOwnProperty('entryName')){
          var word = obj['entryName'];
          var mean = obj['mean'];
          if(!wordDict.hasOwnProperty(word))
            wordDict[word] = {'english':word,'mean':mean};
        }

        if(keyCount==keys.length){
          callback(wordDict);
        }
      });
    }
};

var apiHost = "http://localhost:5000"
// var apiHost = "http://54.92.37.26"

function insertDataToServer(email, url, wordDict) {
  var param = {"email":email, "url":url, "words":wordDict};
  xhrPost(apiHost + "/searchWords/insertData", param, XHR_TYPE_JSON ,function(xhr) {});
}