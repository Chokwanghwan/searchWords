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

chrome.extension.onMessage.addListener(function(request, sender) {
  if (request.action == "getSource") {
    var sampleText = strip_tags(request.source);
    sampleText = extractWords(sampleText);
    sampleText = makeWordDictionary(sampleText);
    translateWords(sampleText);

    message.innerHTML = "";
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
function translateWords(wordDictionary) {
  var keys = Object.keys(wordDictionary);
    // var index = parseInt(Math.random()*keys.length);
    var keyCount=0;
    var wordList = {};
    for(var i =0; i<keys.length; i++){
      var url = "http://tooltip.dic.naver.com/tooltip.nhn?wordString=" + keys[i] + "&languageCode=4&nlp=false";
      xhrGet(url, function(xhr, callback) {
        var obj = JSON.parse(xhr.responseText);
        keyCount++;
        if(obj.hasOwnProperty('entryName')){
          var word = obj['entryName'];
          var mean = obj['mean'];
          if(!wordList.hasOwnProperty(word))          
            wordList[word] = {'key':word,'mean':mean};
        }

        if(keyCount==keys.length){
          dataProvider(wordList);
        }
      });
    }
};

//클라이언트에서 처리할 수 있는 모든 처리를 끝마친 최종데이터, 출력과 서버전송에 사용한다.
function dataProvider(wordList){
  //현재 단어를 UI로 구성하는 로직
  printOnDiv(wordList);

  //데이터를 검색하기 위한 로직
  searchWord(wordList);
};

function printOnDiv(wordList) {
  //웹 출력 함수 // 처음에는 베이직한 div 보내고 나중에 처리 다 끝나고 우선순위 추출알고리즘 다 돌리면 특정 색상으로 변환하는
  //혹은 현재 화면에 보일만한 예를들면 한 7~10줄정도의 데이터만 후딱 우선순위 알고리즘 돌려서 처리하고 나머지는 비동기로 천천히 처리해도 괜찮을듯.

  for (var i in wordList){ 
    //div 생성
    var div = document.createElement('div');
    div.setAttribute('class', 'tile');
    div.setAttribute('id', wordList[i].key);
    document.body.appendChild(div);

    // console.log("wordList["+i+"].key = "+wordList[i].key+"   :   wordList["+i+"].mean = "+wordList[i].mean);
    div.innerHTML=wordList[i].key+"<br>"+wordList[i].mean[0]+", "+wordList[i].mean[1];

    // 버튼 리스너
    var clickBtn = document.getElementById(wordList[i].key);
    clickBtn.addEventListener('click', function(event) {
      var selectId = event.target.id;
      
      //현재페이지의 단어를 담은 Div 삭제 로직
      var removeDiv = document.getElementById(selectId);
      removeDiv.remove(selectId);

      //현재페이지의 단어를 모아놓는 Dictionary에서 해당 단어 제거 로직
      removeData(wordList, selectId);

      //서버의 DB에 해당 데이터 삭제를 요청하는 로직
      console.log("We need Server");
    });
  }
};

function removeData(wordList, selectId) {
  //현재 페이지의 단어를 모아놓는 Dictionary에서 해당 단어 제거 로직
  console.log("selectId = "+selectId);
  delete wordList[selectId];
  console.log(selectId+':'+wordList.hasOwnProperty(selectId));
  
};

function searchWord() {
  // 리스너가 호출되면
  // 
};

window.onload = onWindowLoad;