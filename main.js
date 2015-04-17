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

function xhrPost(url, params ,callback) {
    var xhr = new XMLHttpRequest();
    var params = params;
    xhr.open('POST', url, true);
    //params format  :  "email=email&url=url&word=word"
    
    xhr.setRequestHeader("Content-type", "application/json", "charset=utf-8");
    // xhr.setRequestHeader("Content-type", params.length);
    // xhr.setRequestHeader("Connection", "close");

    xhr.onreadystatechange = function() {
        if (this.readyState == 4) {
          alert(xhr.responseText);
          callback(this);
        }
    };
    xhr.send(JSON.stringify(params));
};

function onWindowLoad() {

  var message = document.querySelector('#message');

  chrome.tabs.executeScript(null, {
    file: "getPagesSource.js"
  }, function() {
    // If you try and inject into an extensions page or 보the webstore/NTP you'll get an error
    if (chrome.extension.lastError) {
      message.innerText = 'There was an error injecting script : \n' + chrome.extension.lastError.message;
    }
  });

};

chrome.extension.onMessage.addListener(function(request, sender) {
  //url정 : sender.url
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
    var wordDict = {};
    for(var i =0; i<keys.length; i++){
      var url = "http://tooltip.dic.naver.com/tooltip.nhn?wordString=" + keys[i] + "&languageCode=4&nlp=false";
      xhrGet(url, function(xhr, callback) {
        var obj = JSON.parse(xhr.responseText);
        keyCount++;
        if(obj.hasOwnProperty('entryName')){
          var word = obj['entryName'];
          var mean = obj['mean'];
          if(!wordDict.hasOwnProperty(word))          
            wordDict[word] = {'english':word,'mean':mean};
        }

        if(keyCount==keys.length){
          dataProvider(wordDict);
        }
      });
    }
};

//클라이언트에서 처리할 수 있는 모든 처리를 끝마친 최종데이터, 출력과 서버전송에 사용한다.
var awordDict={};
function dataProvider(wordDict){
  debugger;
  var param = {"email":"choBro@gmail.com", "url":"http://kwanggoo.com", "words":wordDict};
  xhrPost("http://localhost:5000/searchWords/insertData", param, function(xhr, callback) {
    console.log(" ");
  });
  //현재 단어를 UI로 구성하는 로직
  printOnDiv(wordDict);
  awordDict = wordDict
  //데이터를 검색하기 위한 로직
  search();
};

//검색어를 입력받는 keydown eventListener
function search() {
  document.getElementById("inputString").addEventListener('keydown',function(event){
    var inputString = String.fromCharCode(event.keyCode);
    var originString = document.getElementById("inputString").value; 

    // console.log("***"+inputString.toLowerCase()+document.getElementById("inputString").value);

    if(event.keyCode == 13) {
      //엔터부분
    } else if (65<=event.keyCode && event.keyCode <= 90) {
      originString += inputString.toLowerCase();
      displaySearchResult(originString);
      console.log("complete input = " +originString);
    } else if (event.keyCode == 8) {
      //text = text.substring(0, text.length-1);
      originString = originString.substring(0, originString.length-1);
      console.log("press backspace = " +originString);
      displaySearchResult(originString);
    }
  });
};

//textbox에 입력된 데이터와 wordDict의 데이터를 비교후 div 제어
function displaySearchResult(findWord) {
  console.log("findWord out of loop = "+findWord);
  for(var key in awordDict){
    if(key.indexOf(findWord)==0){
      console.log("findWord = "+findWord);
      document.getElementById(key).style.display="block";
    }else{
      document.getElementById(key).style.display="none";
    }
  }
};

function printOnDiv(wordDict) {
  //웹 출력 함수 // 처음에는 베이직한 div 보내고 나중에 처리 다 끝나고 우선순위 추출알고리즘 다 돌리면 특정 색상으로 변환하는
  //혹은 현재 화면에 보일만한 예를들면 한 7~10줄정도의 데이터만 후딱 우선순위 알고리즘 돌려서 처리하고 나머지는 비동기로 천천히 처리해도 괜찮을듯.

  for (var i in wordDict){
    //div 생성
    var div = document.createElement('div');
    div.setAttribute('class', 'tile');
    div.setAttribute('id', i);
    document.body.appendChild(div);

    // console.log("wordDict["+i+"].key = "+wordDict[i].key+"   :   wordDict["+i+"].mean = "+wordDict[i].mean);
    div.innerHTML=wordDict[i].english+"<br>"+wordDict[i].mean[0]+", "+wordDict[i].mean[1];

    // 버튼 리스너
    var clickBtn = document.getElementById(wordDict[i].english);
    clickBtn.addEventListener('click', function(event) {
      var selectId = event.target.id;
      
      //현재페이지의 단어를 담은 Div 삭제 로직
      var removeDiv = document.getElementById(selectId);
      removeDiv.remove(selectId);

      //현재페이지의 단어를 모아놓는 Dictionary에서 해당 단어 제거 로직
      removeData(wordDict, selectId);

      //서버의 DB에 해당 데이터 삭제를 요청하는 로직
      console.log("We need Server");
    });
  }
};

function removeData(wordDict, selectId) {
  //현재 페이지의 단어를 모아놓는 Dictionary에서 해당 단어 제거 로직
  console.log("selectId = "+selectId);
  delete wordDict[selectId];
  console.log(selectId+':'+wordDict.hasOwnProperty(selectId));
  
};

window.onload = onWindowLoad;