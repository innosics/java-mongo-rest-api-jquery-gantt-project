var register_dialog_initialized = false;

function initRegisterDialog(){
	if (! register_dialog_initialized){
		var dialogStr =
		'<div id="registerDialog" title="Sign up">' +
			'<div id="registerFormMsg" class="12u 12u$(xsmall)" style="color: #e33"></div>' +
			'<div class="12u 12u$(xsmall)">Email:</div>' +
			'<div class="12u 12u$(xsmall)">' +
				'<input type="text" name="email" id="email" value="" placeholder="Email"/>' +
			'</div>' +
			'<div class="12u 12u$(xsmall)">Name:</div>' +
			'<div class="12u 12u$(xsmall)">' +
				'<input type="text" name="screenname" id="screenname" value="" placeholder="Name"/>' +
			'</div>' +
			'<div class="12u 12u$(xsmall)">Password:</div>' +
			'<div class="12u$ 12u$(xsmall)">' +
				'<input type="password" name="password" id="password" value="" placeholder="Password"/>' +
			'</div>' +
			'<div class="12u 12u$(xsmall)">Re-enter Password:</div>' +
			'<div class="12u$ 12u$(xsmall)">' +
				'<input type="password" name="password2" id="password2" value="" placeholder="Password"/>' +
			'</div>' +
			'<div class="12u 12u$(xsmall)">&nbsp;</div>' +
		'</div>';
		$("body").append(dialogStr);
		register_dialog_initialized = true;
	}

	$("#registerDialog").dialog({
		resizable: false,
		//width:480,
		modal: true,
		buttons: [{
			id: "userRegistrationButton",
			click: function() {
				var e = $( '#email' ).val();
				var n = $( '#screenname' ).val();
				var p = $( '#password' ).val();
				var p2 = $( '#password2' ).val();
				if (e == '' || validateEmail(e) == false) {
					setErrorMsg("Email is not valid!");
					$( '#email' ).focus();
				} else if (n == ''){
					setErrorMsg("Name is required!");
					$( '#screenname' ).focus();
				}else if (p == '' || p.length < 6) {
					setErrorMsg("Password required at least 6 charaters!");
					$( '#password' ).focus();
				}else if (p != p2) {
					setErrorMsg("Password re-entered is not matached!");
					$( '#password2' ).focus();
				}else{
					cleanErrorMsg();
					registerFromServer(e, n, p);

				}
			}
		}],
		close: function( event, ui ) {
			removeLoginDialog();
		}
	});
	$('#userRegistrationButton').button('option', 'label', 'Submit');
}
function setErrorMsg(msg){
	cleanErrorMsg();
	$( '#registerFormMsg' ).append(msg);
}
function cleanErrorMsg(){
	$( '#registerFormMsg' ).empty();
}
function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}
function removeRegisterDialog(){
	$("#registerDialog").remove();
	register_dialog_initialized = false;
}
function registerFromServer(e, n, p) {
	var data =
	{
		"name":n,
		"password":p,
		"email":e,
		"accountNonExpired":true,
		"credentialsNonExpired":true,
		"accountNonLocked":true,
		"enabled":false,
		authorities:[
			"ROLE_APP"
		],
		"origin":window.location.href
	};
	//in production, here should clena the screen to wait
	$("#registerDialog").empty();
	$("#registerDialog").append("Please wait ...");
	$('#userRegistrationButton').button('option', 'label', 'Wait ...');
	$('#userRegistrationButton').button('option', 'disabled', true);
	$.post(DOMAIN_PREFIX + '/api/register', JSON.stringify(data), function(reply, textStatus) {
		//alert("Registered successfully!");
		//alert(JSON.stringify(reply));
		if (reply.success){
			//in production, here should just tell user to check email and confirm account, then comeback to login
			$("#registerDialog").empty();
			$("#registerDialog").append("An email has been sent to your email address, please check your email to confirm your registration!");
			$('#userRegistrationButton').button('option', 'label', 'Ok');
			$('#userRegistrationButton').button('option', 'disabled', false);
			$('#userRegistrationButton').click(function(){
			    $("#registerDialog").dialog( "close" );
			});
			/*$("#registerDialog").dialog( "close" );
			username = e;
			password = p;
			authenticate(initMainFramework);*/
		}else if (reply.code == 'USER_EXISTS') {
			setErrorMsg("Error: email already signed up!");
			$( '#email' ).focus();
		}
	}, "json")
	.done(function() {
	})
	.fail(function(jqXHR, textStatus, errorThrown) {
		alert('register fail: ' + textStatus + ' Response: ' + jqXHR.responseText);
	})
	.always(function() {
	})
	;
}
