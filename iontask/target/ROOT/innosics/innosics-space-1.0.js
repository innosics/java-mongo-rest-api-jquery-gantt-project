
function initSpacesView(){
	$('.gantt').hide();
	$('.nongantt').show();

	$("#mainWorkspace").empty();
	resetToolBar();

	initSpacesWidgit();

	initSpacesDataTable('#SpacesTable');

	refreshSpacesData('#SpacesTable');

	appendToolBar('Create', 'Create', function(){
		initSpaceEditorWidget();
	}, true);

	$("#mainWorkspace").resize();

	actionStack[actionStack.length] = function() { initSpacesView(); };
}

function initSpacesWidgit(){
	$('#mainWorkspace').append('<table id="SpacesTable" class="display responsive nowrap" cellspacing="0" width="100%"></table>');
}

function initSpacesDataTable(tableId){

	var spaceTable = $(tableId).dataTable({
        responsive: true,
	"aoColumns": [
		{ "sTitle": "", "mData": "_id"},
		{ "sTitle": "Code", "mData": "code" },
		{ "sTitle": "Default", "mData": "_id"},
		{ "sTitle": "Name", "mData": "name"},
		{ "sTitle": "Members", "mData": "maxms"},
		{ "sTitle": "Expiry", "mData": "expiry"},
		{ "sTitle": "Paid", "mData": "paid" },
		{ "sTitle": "Role", "mData": "role" }
	],
	"aoColumnDefs": [
		{
			"aTargets" : [0],
			"mRender": function ( data, type, full ) {
				if(full.paid){// && full.canWrite){//alert("_id: " + data);
					return '<button onclick="initSpaceEditorWidget(\'' + full._id + '\',\'' + full.code + '\',\'' + full.name + '\');" class="buttonsmall textual" title="Renew"><span class="innosicsIcon">&#x65;</span></button>';
				}else{
					return '<button onclick="initSpaceEditorWidget(\'' + full._id + '\',\'' + full.code + '\',\'' + full.name + '\');" class="buttonsmall textual" title="Renew"><span class="innosicsIcon">&#x65;</span></button>';
				}
			}
		},
		{
			"aTargets" : [2],
			"mRender": function ( data, type, full ) {
				if(full._id == default_workspace_id){// && full.canWrite){//alert("_id: " + data); &#x3b;
					return '<button class="buttonsmall textual" title="Renew"><span class="innosicsIcon">&#x3b;</span></button>';
				}else{
					return '<button onclick="setDefaultWorkspace(\'' + data + '\',\'' + full.code + '\',\'' + full.name + '\');" class="buttonsmall textual" title="Renew"><span class="innosicsIcon">&#xa1;</span></button>';
				}
			}
		},
		{
			"aTargets" : [5],
			"mRender": function ( data, type, full ) {
				if(data){
					var mDate = moment(data);
					//return (mDate && mDate.isValid()) ? mDate.format("L LT") : "";
					return (mDate && mDate.isValid()) ? mDate.format("L") : "";
				}
				return "";
			}
		},
		{
			"aTargets" : [6],
			"mRender": function ( data, type, full ) {
				if(full.paid){// && full.canWrite){//alert("_id: " + data);
					return '<button onclick="initSpaceEditorWidget(\'' + full._id + '\',\'' + full.code + '\',\'' + full.name + '\');" class="buttonsmall textual" title="Renew"><span class="innosicsIcon">&#x3b;</span></button>';
				}else{
					return '<button onclick="initSpaceEditorWidget(\'' + full._id + '\',\'' + full.code + '\',\'' + full.name + '\');" class="buttonsmall textual" title="Renew"><span class="innosicsIcon">&#x65;</span></button>';
				}
			}
		}
	],
        "oLanguage": {
        	"sSearch": "Filter: "
		}
	});

	$(tableId + ' tbody').on( 'click', 'tr', function () {
		if ( $(this).hasClass('selected') ) {
			//$(this).removeClass('selected');
		}
		else {
			spaceTable.$('tr.selected').removeClass('selected');
			$(this).addClass('selected');
		}
	} );
}

function refreshSpacesData(tableId){
	loadDataFromServer(URL_SPACES_LIST, function(roleListData){
		bindSpacesData(tableId, roleListData);
	});
}
function bindSpacesData(tableId, roleListData){
	var table = $(tableId).dataTable();
	var oSettings = table.fnSettings();

	table.fnClearTable(this);

	for (var i=0; i<roleListData.length; i++){
		//alert(JSON.stringify(roleListData[i]));
		table.oApi._fnAddData(oSettings, roleListData[i]);
	}
	oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();

	table.fnDraw();
}

function initSpaceEditorWidget (_id, code, name) {
	//alert("initSpaceEditorWidget _id: " + _id);
	//make editor
	var spaceEditor = $.JST.createFromTemplate({}, "SPACE_EDITOR");

	optimizedDialogWidth = $(window).width();
	if (optimizedDialogWidth > 1024) {
		optimizedDialogWidth = 1024;
	}else{
		optimizedDialogWidth = '100%';
	}
	optimizedDialogHeight = $(window).height() - 98;
	if (optimizedDialogHeight > 720) {
		optimizedDialogHeight = 720;
	}
	//alert("optimizedDialogWidth: " + optimizedDialogWidth + " optimizedDialogHeight: " + optimizedDialogHeight);

	$("body").append('<div id="spaceEditorWidget" title="Workspace"></div>');
	$("#spaceEditorWidget").append(spaceEditor);
	$("#spaceEditorWidget").bringToFront();
	$("#spaceEditorWidget").dialog({
		resizable: false,
		modal: true,
		width:optimizedDialogWidth,
		height:optimizedDialogHeight,
		buttons: [{
			id: "spacePurchaseButton",
			click: function() {
				spaceEditor.find("#validationMsg").text("");

				var space = {};
				if (_id) space._id = _id;
				space.code = spaceEditor.find("#code").val();
				space.name = spaceEditor.find("#name").val();

				space.term = spaceEditor.find("#term").val();
				space.termDescription = $("#term option:selected").text();

				space.paymethod = spaceEditor.find("#paymethod").val();
				space.default =$("#statusSpacedefault").is(':checked');

				space.maxms = spaceEditor.find("#maxms").val();

				var isValid = true;
				if (space.code.trim() == '' || space.code.trim().length < 3 || space.code.trim().length > 10){
					isValid = false;
					spaceEditor.find("#validationMsg").text("Error: Database code invalid, 3 to 6 alphabets, e.g., \"ions\"");
					spaceEditor.find("#code").focus();
					return;
				}

				if (space.name.trim() == '' || space.name.trim().length < 3){
					isValid = false;
					spaceEditor.find("#validationMsg").text("Error: Workspace name required, 3 to 30 alphabets, e.g, \"Ionscape\"");
					spaceEditor.find("#name").focus();
					return;
				}
				if (space.term == 0 && space.maxms == 0){
					isValid = false;
					spaceEditor.find("#validationMsg").text("Error: please choose Term extention or adding Additional members!");
					spaceEditor.find("#term").focus();
					return;
				}
				if (_id){
				}else if (space.term == 0){
					isValid = false;
					spaceEditor.find("#validationMsg").text("Error: A new workspace must have an initial term!");
					spaceEditor.find("#term").focus();
					return;
				}

				if (isValid){
					//alert(JSON.stringify(space));

					space.origin = window.location.href;
					$('#spacePurchaseButton').button('option', 'label', 'Please wait...');
					$('#spacePurchaseButton').button('option', 'disabled', true);

					saveDataOnServer(DOMAIN_PREFIX + '/api/pay/' + space.code, space, function(json, textStatus){
						var strData = JSON.stringify(json);
						if (json.success){
							$("#spaceEditorWidget").empty();
							$("#spaceEditorWidget").append('<div class="12u 12u$(medium)"><header class="major"><h2>Please wait</h2></header><section id="payprocessMsg" name="payprocessMsg"><p>Preparing payment...</p></section></div>');

							//$("#payprocessMsg").append('<p>Redirect to paypal...</p>');
							//$("#spaceEditorWidget").dialog( "close" );
							//alert("json.data.approvalURL: " + json.data.approvalURL);
							window.location = json.data.approvalURL;
						}else{
							if (json.code == 'WORKSPACE_EXISTS'){
								spaceEditor.find("#validationMsg").text("Error: workspace code exists, please enter another one!");
								spaceEditor.find("#code").focus();
							}
							$('#spacePurchaseButton').button('option', 'label', 'Next ...');
							$('#spacePurchaseButton').button('option', 'disabled', false);
							return;
						}
					});
				}
			}
		}],
		show: {
			effect: "blind",
			duration: 300
		},
		hide: {
			effect: "clip",
			duration: 300
		},
		close: function( event, ui ) {
			$("#spaceEditorWidget").remove();
		}
	});
	if (_id) {
		spaceEditor.find("#_id").val(_id);
		//$("#statusSpacedefault").prop('disabled', true);
	}
	if (code) {
		spaceEditor.find("#code").val(code);
		spaceEditor.find("#code").prop('disabled', true);
	}
	if (name) {
		spaceEditor.find("#name").val(name);
		//spaceEditor.find("#name").prop('disabled', true);
	}

	$('#spacePurchaseButton').button('option', 'label', 'Next ...');
}
function setDefaultWorkspace(_id, code, name){
	//alert("default_workspace_id: " + default_workspace_id);
	var space = {};

	space._id = _id;
	space.default = true;

	//alert("default_workspace_name space: " + JSON.stringify(space));
	//alert("URL_SPACES_SAVE: " + URL_SPACES_SAVE);

	saveDataOnServer(URL_SPACES_SAVE, space, function(json, textStatus){
		//alert(JSON.stringify(json));
		default_workspace_id = _id;
		default_workspace_code = code;
		default_workspace_name = name;
		refreshSpacesData('#SpacesTable');
		//alert("default_workspace_id: " + default_workspace_id);
	});
}

function switchWorkspace(){
	//alert("current_workspace_code: " + current_workspace_code);

	if (access_token == '') {
		helpTopic = helpTips.nologWorkspace;
		showHelpTips();
		return;
	}

	$("body").append('<div id="spaceSwitchWidget" title="Current Workspace"></div>');
	$("#spaceSwitchWidget").append('<table id="spaceSwitchTable" class="display responsive nowrap" cellspacing="0" width="100%"></table>');
	$("#spaceSwitchWidget").bringToFront();
	$("#spaceSwitchWidget").dialog({
		resizable: false,
		modal: true,
		width:"75%",
		height:480,
		buttons: {
			"Cancel": function() {
				$("#spaceSwitchWidget").dialog( "close" );
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
			$("#spaceSwitchWidget").remove();
		}
	});

	var spaceSwitchTable = $('#spaceSwitchTable').dataTable({
        responsive: true,
		"aoColumns": [
			{ "sTitle": "Code", "mData": "code" },
			{ "sTitle": "Current", "mData": "_id"},
			{ "sTitle": "Name", "mData": "name"},
			{ "sTitle": "Expiry", "mData": "expiry"},
			{ "sTitle": "Paid", "mData": "paid" }
		],
		"aoColumnDefs": [
			{
				"aTargets" : [1],
				"mRender": function ( data, type, full ) {
					if(full._id == current_workspace_id){// && full.canWrite){//alert("_id: " + data); &#x3b;
						return '<button class="buttonsmall textual" title="Renew"><span class="innosicsIcon">&#x3b;</span></button>';
					}else{
						return '<button onclick="switchCurrentWorkspace(\'' + data + '\',\'' + full.code + '\',\'' + full.name + '\');" class="buttonsmall textual" title="Renew"><span class="innosicsIcon">&#xa1;</span></button>';
					}
				}
			},
			{
				"aTargets" : [3],
				"mRender": function ( data, type, full ) {
					if(data){
						var mDate = moment(data);
						//return (mDate && mDate.isValid()) ? mDate.format("L LT") : "";
						return (mDate && mDate.isValid()) ? mDate.format("L") : "";
					}
					return "";
				}
			},
			{
				"aTargets" : [4],
				"mRender": function ( data, type, full ) {
					if(full.paid){
						return '<button class="buttonsmall textual" title="Renew"><span class="innosicsIcon">&#x3b;</span></button>';
					}else{
						return '<button class="buttonsmall textual" title="Renew"><span class="innosicsIcon">&#x65;</span></button>';
					}
				}
			}
		],
        "oLanguage": {
        	"sSearch": "Filter: "
		}
	});

	$('#spaceSwitchTable tbody').on( 'click', 'tr', function () {
		if ( $(this).hasClass('selected') ) {
			//$(this).removeClass('selected');
		}
		else {
			spaceSwitchTable.$('tr.selected').removeClass('selected');
			$(this).addClass('selected');
		}
	} );

	refreshCurrentWorkspacesData();
}

function refreshCurrentWorkspacesData(){
	loadDataFromServer(URL_SPACES_LIST, function(spacesListData){
		bindCurrentWorkspacesData(spacesListData);
	});
}
function bindCurrentWorkspacesData(spacesListData){
	var table = $('#spaceSwitchTable').dataTable();
	var oSettings = table.fnSettings();

	table.fnClearTable(this);

	for (var i=0; i<spacesListData.length; i++){
		//alert(JSON.stringify(roleListData[i]));
		table.oApi._fnAddData(oSettings, spacesListData[i]);
	}
	oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();

	table.fnDraw();
}

function switchCurrentWorkspace(_id, code, name){
	//alert("current_workspace_id: " + current_workspace_id + "  _id: " + _id);
	setCurrentWorkspace(_id, code, name);
	$("#spaceSwitchWidget").dialog( "close" );
	//refresh workspace
	initWorkspace();
}
