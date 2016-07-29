
//var DOMAIN_PREFIX = 'http://212.1.213.153:8080';
var DOMAIN_PREFIX = 'http://localhost:8080';
var helpTips;
var helpTopic;

$(function() {
	$(document).ready(function () {
		loadLocalStorage();
		jQuery.get("templates/innosics-template-1.0.html", function (templateData){
			$(templateData).loadTemplates();
			jQuery.get("data/help.json", function (data){
				helpTips = data;
				helpTopic = helpTips.nolog;
			});
			if (rememberme){
				//initMainFramework();
				loginFirst();
			}
		});
	});
});
function loginFirst(){
	authenticate(function(){
		initMainFramework();
	});
}
function initMainFramework(){
	loadDataFromServer(DOMAIN_PREFIX + '/api/fetch/accounts/workspaces/default', function(workspaceData){
		//alert(JSON.stringify(workspaceData));
		initFramework(workspaceData);
		initGlobalNav();
		initWorkspace();
	});
}
var optimizedDialogWidth = $(window).width();
var optimizedDialogHeight = $(window).height() - 98;

function initWorkspace(workspaceData){
	//here to decide what home screen will be
	initProjectsView();
}
function initHomeView(){
	initMyTasksView();
}

function refreshGlebalViews(){
	refreshDeadlineData();
	refreshPeopleData();
}

function loadDataFromServer(dataUrl, callBackFunc) {
	//alert("dataUrl: " + dataUrl);
	if (access_token){
		var url = getUrlWithToken(dataUrl);
		//alert("url: " + url);
		$.getJSON(url, function(json){
			//alert("Data successfully loaded: " + JSON.stringify(json));
			callBackFunc(json.data);
		})
		.done(function() {
		})
		.error(function(jqXHR, textStatus, errorThrown) {
		})
		.fail(function(jqXHR, textStatus, errorThrown) {
			//alert("loading data failed, re authentication needed!");
			authenticate(function(){
				loadDataFromServer(dataUrl, callBackFunc);
			});
		})
		.always(function() {
		})
		;
	}else{
		//alert("loading data failed, re authentication needed!");
		authenticate(function(){
			loadDataFromServer(dataUrl, callBackFunc);
		});
	}
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

function saveDataOnServer(saveUrl, dataToBeSaved, callBackFunc){

	$.post(saveUrl, "access_token=" + access_token + "&data=" + escape(JSON.stringify(dataToBeSaved)), function(data, textStatus) {
		//alert("Data post success!");
		callBackFunc(data, textStatus);
	}, "json")
	.done(function() {
	})
	.error(function(jqXHR, textStatus, errorThrown) {
	})
	.fail(function(jqXHR, textStatus, errorThrown) {
		//alert("Data post fail, re authentication needed!");
		authenticate(function(){
			saveDataOnServer(saveUrl, dataToBeSaved, callBackFunc);
		});
	})
	.always(function() {
	});
}

jQuery.fn.visible = function() {
    return this.css('visibility', 'visible');
};

jQuery.fn.invisible = function() {
    return this.css('visibility', 'hidden');
};

jQuery.fn.visibilityToggle = function() {
    return this.css('visibility', function(i, visibility) {
        return (visibility == 'visible') ? 'hidden' : 'visible';
    });
};

function showHelpTips(){

	optimizedDialogWidth = $(window).width();
	if (optimizedDialogWidth > 720) {
		optimizedDialogWidth = 720;
	}else{
		optimizedDialogWidth = '100%';
	}
	optimizedDialogHeight = $(window).height() - 98;
	if (optimizedDialogHeight > 720) {
		optimizedDialogHeight = 720;
	}

	//alert("optimizedDialogWidth: " + optimizedDialogWidth + " optimizedDialogHeight: " + optimizedDialogHeight);
	$("body").append('<div id="helpTipWidget" title="Help"></div>');
	$("#helpTipWidget").append(helpTopic);
	$("#helpTipWidget").bringToFront();
	$("#helpTipWidget").dialog({
		resizable: false,
		modal: true,
		width:optimizedDialogWidth,
		height:optimizedDialogHeight,
		buttons: {
			"Close": function() {
				$("#helpTipWidget").dialog( "close" );
			}
		},
		show: {
			effect: "blind",
			duration: 300
		},
		hide: {
			effect: "clip",
			duration: 300
		},
		close: function( event, ui ) {
			$("#helpTipWidget").remove();
		}
	});
}

var actionStack = [];
function goback() {
	//alert("actionStack.length: " + actionStack.length);
	//the last one always itself, so the second from last is the last action
	if (actionStack.length > 1){
		//alert("there is action in actionStack!");
		var lastAction = actionStack[actionStack.length - 2];
		actionStack.splice(actionStack.length - 2, 2);
		lastAction();
	}
}
