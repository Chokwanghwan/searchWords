var testEmail = "kwanggoo@gmail.com"
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

    }
};
var wordDict = {};
// var apiHost = "http://localhost:5000";
var apiHost = "http://54.92.37.26"
function requsetWordToServer(url) {
  // console.log("currentUrl in requsetWordToServer : " +currentUrl);
  var param = {"email":testEmail, "url":url};
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
    addCardDOM(word);

    // 버튼 리스너
    var div = document.getElementById(word.english);
    var clickBtn = div.childNodes[2];
    clickBtn.addEventListener('click', function(event) {
      var selectId = event.target.parentElement.getAttribute('id');

      //서버의 DB에 해당 데이터 삭제를 요청하는 로직
      var param = "email="+testEmail+"&english="+selectId.toString()+"&is_deleted=true";
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

function addCardDOM(word) {
  var english = word.english;
  var mean = word.mean;
  var urlCount = word.urls;

  var div = document.createElement('div');
  div.setAttribute('id', english);

  var str = "";
  // str += "<h1>"+english+"<p>"+urlCount+" urls</p></h1>";
  str += "<h1>"+english+"</h1>";
  str += "<ul>";
  for (var i in mean) {
    str += "<li>"+mean[i]+"</li>"; 
  }
  str += "</ul>";
  str += "<input type='button' value='I know' style='float: right;'>";
  str += "<div id='url-counter'>"+urlCount+" urls</div>";
  str += "<hr>"

  div.innerHTML = str;
  var container = document.getElementById('container');
  container.appendChild(div);
}


function removeData(selectId) {
  for(var i = wordDict.length - 1; i >= 0; i--) {
    if(wordDict[i].english === selectId) {
       wordDict.splice(i, 1);
    }
  }
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
      originString = originString.toLowerCase();
      displaySearchResult(originString);
    } else if (event.keyCode == 8) {
      //text = text.substring(0, text.length-1);
      originString = originString.substring(0, originString.length-1);
      displaySearchResult(originString);
    }
  });
};

chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
  var activeTab = arrayOfTabs[0];
  var url = activeTab.url;
  requsetWordToServer(url);
  searchWord();
});