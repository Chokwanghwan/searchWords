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
    var wordDictionary = makeWordDictionary(rawWordData);
    var translateData = translateWords(wordDictionary);

    message.innerHTML = "";
  }
});

//모듈하나 만들건데 그 모듈은 translateWords내부의 xhrGet의 콜백함수로 사용이 될것이며 xhrGet이 완료가되면 그 모듈 내부에 모든
//단어들이 쌓이고 이 단어는 웹서버에 던지는 용도로 사용될 것이다.
//최종적으로 분류된 단어들 외에 크롬 사용자 정보(식별자), 해당 페이지 url이 저장될 것이다.
//이 모듈이 완성되면 기존에 xhrGet 내부에서 printOnDiv를 호출하던 방식에서 이 모듈에서 printOnDiv를 호출하는 방식으로 변경
//그렇게되면 이 모듈와 printOnDiv사이에 우선순위 알고리즘 등 부가기능을 추가할때 용이할 것으로 판단됨.

//번역, 검색 불가능 단어 제거
function translateWords(wordDictionary) {
  var keys = Object.keys(wordDictionary);
    // var index = parseInt(Math.random()*keys.length);
    var wordList = [];
    var keyCount=0;
    
    for(var i =0; i<keys.length; i++){
      var url = "http://tooltip.dic.naver.com/tooltip.nhn?wordString=" + keys[i] + "&languageCode=4&nlp=false";
      xhrGet(url, function(xhr, callback) {
        var obj = JSON.parse(xhr.responseText);
        keyCount++;
        if(obj.hasOwnProperty('entryName')){
          var word = obj['entryName'];
          var mean = obj['mean'];

          wordList.push({'key':word,'mean':mean});

          // printOnDiv(obj['entryName'], obj['mean']);
          // console.log(obj['entryName'] + "   " + obj['mean']);
        }
        // console.log('keyCount='+keyCount+"/"+keys.length );
        if(keyCount==keys.length){
          saveWord(wordList);
        }
      });
    }
};

//Div를 클릭시 여러 이벤트를 연계해서 발생할 수 있다.
//ex) delete 연산, 추후 라벨기능 등 여러 기능 추가할 수 있음.
// function divClickEvent(event, wordObject) { //여기에 왜 인자로 event 넘기는지 모르겠다.
//   console.log("correct click + "+wordObject.key);
// };

//웹 출력 함수 // 처음에는 베이직한 div 보내고 나중에 처리 다 끝나고 우선순위 추출알고리즘 다 돌리면 특정 색상으로 변환하는
//혹은 현재 화면에 보일만한 예를들면 한 7~10줄정도의 데이터만 후딱 우선순위 알고리즘 돌려서 처리하고 나머지는 비동기로 천천히 처리해도 괜찮을듯.
function printOnDiv(wordObject) {
    //div 생성
    var div = document.createElement('div');
    div.setAttribute('class', 'tile');
    div.setAttribute('id', wordObject.key);
    document.body.appendChild(div);

    // 버튼 리스너
    var searchBtn = document.getElementById(wordObject.key);
    searchBtn.addEventListener('click', function(event) {
      // console.log(wordObject.key);
      deleteWord(wordObject.key);
      //클릭시 div가 사라지고 데이터가 내 db에서 삭제되고 삭제된 단어들이 모이는 리스트에 해당 단어가 추가된다.
      //익스텐션 실행시
    });
    div.innerHTML=wordObject.key+"<br>"+wordObject.mean[0]+", "+wordObject.mean[1];
};

function deleteWord(id) {
  // console.log("id : "+id);
  var removeDiv = document.getElementById(id);
  removeDiv.remove(removeDiv);
};

//
// var parent = document.getElementById("div1");
// var child = document.getElementById("p1");
// parent.removeChild(child);
//

function searchWord() {
  
};

//클라이언트에서 처리할 수 있는 모든 처리를 끝마친 최종데이터, 출력과 서버전송에 사용한다.
function saveWord(wordList){
  for (var i in wordList){ 
    console.log("dictList."+wordList[i].key+" = "+wordList[i].mean)

    printOnDiv(wordList[i]);
  }
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

//단어 단위로 분류, 공백과 불필요 문자, 숫자 제거 + 알파벳 한개짜리 단어, hasOwnProperty(특정 에러 유발) 제거
function extractWords(sampleText) {
  sampleText = sampleText.replace(/hasOwnProperty/g, ''); //hasOwnProperty 제거
  sampleText = sampleText.replace(/&nbsp/g, ''); //&nbsp 제거
  sampleText = sampleText.replace(/[\d]/g, ''); //숫자 제거
  sampleText = sampleText.replace(/\b\w\b/g, ''); //알파벳 한개짜리 단어 제거
  sampleText = sampleText.match(/\b\w+\b/g); //단어 단위로 추출

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