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
          // alert(xhr.responseText);
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

function onWindowLoad() {
  requsetWordToServer();
};


// chrome.extension.onMessage.addListener(function(request, sender) {
//   //url정 : sender.url
  
// });


var apiHost = "http://localhost:5000"
// var apiHost = "http://54.92.37.26"
var wordDict = {};
function requsetWordToServer() {
  // console.log("currentUrl in requsetWordToServer : " +currentUrl);
    var param = {"email":"choBro@gmail.com", "url":"http://a.com"};
    xhrPost(apiHost + "/searchWords/selectDataForWeb", param, XHR_TYPE_JSON, function(xhr) {
      // var obj = JSON.parse(xhr.responseText);
      wordDict = JSON.parse(xhr.responseText);
      //만약 단어가 제대로 반환이 되었으면(즉, 단어 리스트가 null이 아니라면) 출력하고 
      //단어 리스트가 null이라면 출력 x 
      printOnDiv();
  });
}

// requsetWordToServer(); >> select 하는 메서드

function printOnDiv() {
  //웹 출력 함수 // 처음에는 베이직한 div 보내고 나중에 처리 다 끝나고 우선순위 추출알고리즘 다 돌리면 특정 색상으로 변환하는
  //혹은 현재 화면에 보일만한 예를들면 한 7~10줄정도의 데이터만 후딱 우선순위 알고리즘 돌려서 처리하고 나머지는 비동기로 천천히 처리해도 괜찮을듯.

  for (var index in wordDict){
    //div 생성
    var word = wordDict[index];
    var w = word.english;
    var m = word.mean;
    var div = document.createElement('div');
    div.setAttribute('class', 'tile');
    div.setAttribute('id', w);
    document.body.appendChild(div);

    // console.log("wordDict["+i+"].key = "+wordDict[i].key+"   :   wordDict["+i+"].mean = "+wordDict[i].mean);
    div.innerHTML=w+"<br>"+m[0]+", "+m[1];

    // 버튼 리스너
    var clickBtn = document.getElementById(word.english);
    clickBtn.addEventListener('click', function(event) {
      var selectId = event.target.id;

      //서버의 DB에 해당 데이터 삭제를 요청하는 로직
      console.log("&*(2" + selectId.toString());
      var param = "email=choBro@gmail.com&english="+selectId.toString()+"&is_deleted=true";
      xhrPost(apiHost + "/searchWords/updateData", param, XHR_TYPE_FORM, function(xhr) {

      });
      
      //현재페이지의 단어를 담은 Div 삭제 로직
      var removeDiv = document.getElementById(selectId);
      removeDiv.remove(selectId);

      //현재페이지의 단어를 모아놓는 Dictionary에서 해당 단어 제거 로직
      removeData(selectId);

    });
  }
};

function removeData(selectId) {
  //현재 페이지의 단어를 모아놓는 Dictionary에서 해당 단어 제거 로직
  // console.log("selectId = "+selectId);
  delete wordDict[selectId];
  // console.log(selectId+':'+wordDict.hasOwnProperty(selectId));
};

//textbox에 입력된 데이터와 wordDict의 데이터를 비교후 div 제어
function displaySearchResult(findWord) {
  var word;
  for(var key in wordDict){
    word = wordDict[key];
    if(word.english.indexOf(findWord)==0){
      document.getElementById(word.english).style.display="block";
    }else{
      document.getElementById(word.english).style.display="none";
    }
  }
};

//검색어를 입력받는 keydown eventListener
function searchWord() {
  document.getElementById("inputString").addEventListener('keydown',function(event){
    var inputString = String.fromCharCode(event.keyCode);
    var originString = document.getElementById("inputString").value;

    // console.log("***"+inputString.toLowerCase()+document.getElementById("inputString").value);

    if(event.keyCode == 13) {
      //엔터부분
    } else if (65<=event.keyCode && event.keyCode <= 90) {
      originString += inputString.toLowerCase();
      displaySearchResult(originString, wordDict);
    } else if (event.keyCode == 8) {
      //text = text.substring(0, text.length-1);
      originString = originString.substring(0, originString.length-1);
      displaySearchResult(originString, wordDict);
    }
  });
};
searchWord();
window.onload = onWindowLoad;