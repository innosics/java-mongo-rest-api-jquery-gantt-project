<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />
<title>Para Cases</title>
<link type="text/css" rel="stylesheet" href="bootstrap.min.css" />
<link type="text/css" rel="stylesheet" href="css/all.min.css" />

    <script src="//code.jquery.com/jquery-1.10.2.js"></script>

<script>
var access_token='602c9c9f-486a-450b-a4ec-df41308079ac';
var refresh_token='93afdb97-3f8f-4ea7-a9cc-4fcda9da140d';

function authenticate(callBackFunc) {

	//alert("trying to authenticate...");
	var refresh = false;
	var url = '';
	if (refresh_token != ''){
		alert("trying to refreshed the exisitng token...");
		refresh = true;
		url = 'http://localhost:8080/oauth/token?grant_type=refresh_token&client_id=restapp&client_secret=restapp&refresh_token=' + refresh_token;
	}else{
		alert("trying to newly login...");
		url = "http://localhost:8080/oauth/token?grant_type=password&client_id=restapp&client_secret=restapp&username=gulls@meaopus.com&password=octopus";
	}

	var headers = {
		'Accept' : 'application/json'
	};
	$.ajaxSetup({
		'headers' : headers,
		'dataType' : 'json'
	});

	$.getJSON(url, function(data){
		alert("authenticate success");
		alert(JSON.stringify(data));

		access_token = data.access_token;
		refresh_token = data.refresh_token;

		//alert("access_token: " + access_token);
		//alert("refresh_token: " + refresh_token);
		
		callBackFunc();
	})
	.done(function() {
	})
	.fail(function(jqXHR, textStatus, errorThrown) {
		alert('authenticate fail: ' + textStatus + ' Response: ' + jqXHR.responseText);
		if (refresh) {
			access_token='';
			refresh_token='';
			authenticate(callBackFunc);
		}
	})
	.always(function() {
	})
	;
}






	var testData = 
{"status":"ACTIVE","email":"paul@innosics.com","location":"","title":"PM","address":"","phone":"","mobile":"","principal":"marissa@innosics.com"}
	;

	$(function() {
		//saveData();
		verifyData();
	});
	function saveData() {
		saveDataOnServer('http://localhost:8080/api/save/people', testData, function(data, textStatus){
			var strData = JSON.stringify(data);
			alert(strData);
			alert("saveData done");
		});
	}

	function saveDataOnServer(saveUrl, dataToBeSaved, callBackFunc){
		alert("saveDataOnServer");

		var url = getUrlWithToken(saveUrl);
		var dataJsonStr = JSON.stringify(dataToBeSaved);
		alert(saveUrl);
		alert(dataJsonStr);

		var headers = {
			'Authorization' : 'Bearer ' + access_token,
			'Accept' : 'application/json'
		};
		$.ajaxSetup({
			'headers' : headers,
			'dataType' : 'json'
		});

		$.post(saveUrl, dataJsonStr, function(data, textStatus) {
			alert("post success");
			callBackFunc(data, textStatus);
		}, "json")
		.done(function() {
			//$('#statusMessageBox').val('Data save succeeded!');
		})
		.fail(function(jqXHR, textStatus, errorThrown) {
			alert("post fail");
			authenticate(function(){
				alert("Authenticated!");
				saveDataOnServer(saveUrl, dataToBeSaved, callBackFunc);
			});
		})
		.always(function() {
		});
	}

	function getUrlWithToken(originURL){
		var url = originURL;
		if (url.indexOf('?') > 0) {
			url += "&access_token=" + access_token;
		}else{
			url += "?access_token=" + access_token;
		}
		return url;
	}

	function loadDataFromServer(dataUrl, callBackFunc) {
/*
		$.ajax(
		  dataUrl,
		  {
		    type: 'GET',
		    dataType: 'json',
		    beforeSend: function (xhr) {
		      xhr.setRequestHeader("Authorization", "Bearer " + access_token);
		    },
		    complete: function (data) {
				alert("Data successfully loaded!");
				//alert(JSON.stringify(data));
				callBackFunc(data);
		    },
		    error: function (jqXHR,  textStatus,  errorThrown) {
				alert("loading data failed, re Authenticated!");
				authenticate(function(){
					//alert("Authenticated!");
					loadDataFromServer(dataUrl, callBackFunc);
				});
				//var ndo = createBlackPage(800, 500).append(jqXHR.responseText);
		    }
		  }
		);
*/
		//alert("loadDataFromServer---dataUrl: " + dataUrl);
		//var url = getUrlWithToken(dataUrl);
		//alert("loadDataFromServer---token added url: " + url);

		var headers = {
			"Authorization": "Bearer " + access_token,
			'Accept' : 'application/json'
		};
		$.ajaxSetup({
			'headers' : headers,
			'dataType' : 'json'
		});

		$.getJSON(dataUrl, function(data){
			alert("Data successfully loaded!");
			//alert(JSON.stringify(data));
			callBackFunc(data);
		})
		.done(function() {
		})
		.error(function(jqXHR, textStatus, errorThrown) {
		})
		.fail(function(jqXHR, textStatus, errorThrown) {
			alert("loading data failed, re Authenticated!");
			authenticate(function(){
				//alert("Authenticated!");
				loadDataFromServer(dataUrl, callBackFunc);
			});
			//var ndo = createBlackPage(800, 500).append(jqXHR.responseText);
		})
		.always(function() {
		})
		;
	}

	function verifyData() {
		alert("5");
		//$.getJSON('http://localhost:8080/api/list/projects?access_token=' + access_token, datareceived);
		loadDataFromServer('http://localhost:8080/api/list/people', datareceived);
	}

	function datareceived(data){
		alert("6");
		var strData = JSON.stringify(data);
		alert(strData);

		$("#messageFeedback").html(strData);
	}
</script>
</head>
<body>

		<div id="messageFeedback" class="block">

</body>
</html>
