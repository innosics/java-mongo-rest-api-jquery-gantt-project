var login_dialog_initialized = false;

var access_token='';
var refresh_token='';

var username = "";
var password = "";
var rememberme = false;
function logoutFramework(){
	username = "";
	password = "";
	access_token='';
	refresh_token='';
	rememberme = false;
	saveLocalStorage();
	window.location.reload();
}

function loadLocalStorage() {
	if (localStorage) {
		var meaopusLocalStorageStr = localStorage.getItem("meaopusLocalStorage");
		if (meaopusLocalStorageStr){
			var meaopusLocalStorage = JSON.parse(meaopusLocalStorageStr);
			access_token=meaopusLocalStorage.access_token;
			refresh_token=meaopusLocalStorage.refresh_token;
			rememberme=meaopusLocalStorage.rememberme;
		}
	}
}

function saveLocalStorage() {
	if (localStorage) {
		var meaopusLocalStorage = {};
		meaopusLocalStorage.rememberme = rememberme;
		if (rememberme){
			meaopusLocalStorage.access_token = access_token;
			meaopusLocalStorage.refresh_token = refresh_token;
		}else{
			meaopusLocalStorage.access_token = '';
			meaopusLocalStorage.refresh_token = '';
		}

		localStorage.setItem('meaopusLocalStorage', JSON.stringify(meaopusLocalStorage));
	}
}
function resetPassword(){
	$( '#loginFormMsg' ).empty();
	username = $( '#username' ).val();
	if (username == '') {
		$( '#loginFormMsg' ).append("Enter your email!");
		$( '#username' ).focus();
		return;
	}
	var url = "/api/reqreset?email=" + username + "&origin=" + window.location.href;
	//alert("resetPassword url=" + url);
	//window.location.href = url;
	jQuery.get(url, function (reply){
		//alert(JSON.stringify(reply));
		if (reply.success){
			$('#loginDialog').empty();
			$('#loginDialog').append("An email has been sent to your email address, please check your email and follow the instruction to reset your password!");
			$('#loginButton').button('option', 'label', 'Ok');
			$('#loginButton').click(function(){
				$("#loginDialog").dialog( "close" );
			});
		}
	});
}
function requestNewLogin(callBackFun){
	//alert(callBackFun);
	if (! login_dialog_initialized){
		var dialogStr =
		'<div id="loginDialog" title="Login">' +
			'<div id="loginFormMsg" class="12u 12u$(xsmall)" style="color:red"></div>' +
			'<div class="12u 12u$(xsmall)">Email:</div>' +
			'<div class="12u 12u$(xsmall)">' +
				'<input type="text" name="username" id="username" value="a@a.aa" placeholder="Email"/>' +
			'</div>' +
			'<div class="12u 12u$(xsmall)">Password:</div>' +
			'<div class="12u$ 12u$(xsmall)">' +
				'<input type="password" name="password" id="password" value="aaaaaa" placeholder="Password"/>' +
			'</div>' +
			'<div class="12u 12u$(xsmall)">&nbsp;</div>' +
			'<div class="12u 12u$(medium)">' +
				'<input type="checkbox" id="rememberme" name="rememberme" checked />' +
				'<label for="rememberme">Remember me</label>' +
			'</div>' +
			'<div class="12u 12u$(xsmall)"><a href="javascript:resetPassword();">I forget my password</a></div>' +
		'</div>';
		$("body").append(dialogStr);
		login_dialog_initialized = true;
	}

	$("#loginDialog").dialog({
		resizable: false,
		//width:480,
		modal: true,
		buttons: [{
			id: "loginButton",
			click: function() {
				username = $( '#username' ).val();
				password = $( '#password' ).val();
				rememberme = $( '#rememberme' ).is(':checked');
				//alert(rememberme);
				if (username == '') {
					$( '#loginFormMsg' ).append("Enter your email!");
					$( '#username' ).focus();
				}else if (password == '') {
					$( '#loginFormMsg' ).append("Enter your password!");
					$( '#password' ).focus();
				}else{
					authenticate(callBackFun);
					//$( this ).dialog( "close" );
				}
			}
		}],
		close: function( event, ui ) {
			removeLoginDialog();
		}
	});
	$('#loginButton').button('option', 'label', 'Login');
}
function removeLoginDialog(){
	$("#loginDialog").remove();
	login_dialog_initialized = false;
}
function authenticate(callBackFunc) {
	//alert("authenticate... ");
	var authURL = '/auth/token';
	var authData;
	var authRefresh = true;

	if (refresh_token){
		//alert("Trying to refreshed the exisitng token...");
		authRefresh = true;
		authData = 'grant_type=refresh_token&refresh_token=' + refresh_token;
	}else if (username != '' && password != ''){
		//alert("Trying to re login...");
		authRefresh = false;
		authData = 'grant_type=password&username=' + username + '&password=' + password;
	}else{
		//alert("Trying to newly login...");
		requestNewLogin(callBackFunc);
		return;
	}
	//alert("authURL: " + authURL + "  authData: " + authData);
	var headers = {
		'Accept' : 'application/json'
	};
	$.ajaxSetup({
		'headers' : headers,
		'dataType' : 'json'
	});

	$.post(authURL, authData, function(data){
		//alert("authenticate success");
		//alert(JSON.stringify(data));
		if (data.value){
			access_token = data.value;//data.access_token;
			refresh_token = data.refreshToken.value;

			saveLocalStorage();

			//alert("access_token: " + access_token);
			//alert("refresh_token: " + refresh_token);
			if (login_dialog_initialized){
				$("#loginDialog").dialog( "close" );
			}
			callBackFunc();
		}else{
			authRefresh = false;

			access_token='';
			refresh_token='';
			requestNewLogin(callBackFunc);
		}
	})
	.done(function() {
	})
	.fail(function(jqXHR, textStatus, errorThrown) {
		//alert('authenticate fail: ' + textStatus + ' Response: ' + jqXHR.responseText);
		authRefresh = false;

		access_token='';
		refresh_token='';
		requestNewLogin(callBackFunc);
	})
	.always(function() {
		//alert("authenticate always");
	})
	;
}
