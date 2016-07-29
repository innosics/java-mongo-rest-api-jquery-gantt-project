function initPeopleView(){

	$('.gantt').hide();
	$('.nongantt').show();

	$("#mainWorkspace").empty();
	resetToolBar();

	initPeopleWidgit();

	initPeopleDataTable('#peopleTable');

	refreshPeopleData('#peopleTable');
	if(current_workspace_role=='admin') {
		appendToolBar('invite', ' Add ', function(){
			initPersonEditorWidget();
		}, true);
	}

	$("#mainWorkspace").resize();

	actionStack[actionStack.length] = function() { initPeopleView(); };
}

function initPeopleWidgit(){
	$('#mainWorkspace').append('<table id="peopleTable" class="display responsive nowrap" cellspacing="0" width="100%"></table>');
}

function initPeopleDataTable(tableId){

	var peopleTable = $(tableId).dataTable({
        responsive: true,
	"aoColumns": [
		{ "sTitle": "", "mData": "_id"},
		{ "sTitle": "Email", "mData": "email" },
		{ "sTitle": "Name", "mData": "name"},
		{ "sTitle": "Role", "mData": "role" },
		{ "sTitle": "Phone", "mData": "phone" },
		{ "sTitle": "Status", "mData": "status" }
	],
	"aoColumnDefs": [
		{
			"aTargets" : [0],
			"mRender": function ( data, type, full ) {
				if(data){
					return '<button onclick="openPersonEditorView(\'' + data + '\');" class="buttonsmall textual" title="Edit"><span class="innosicsIcon">&#x65;</span></button>';
				}
				return "";
			}
		},
		{
			"aTargets" : [2, 3, 4],
			"mRender": function ( data, type, full ) {
				if(data){
					return data;
				}
				return "";
			}
		}
	],
        "oLanguage": {
        	"sSearch": "Filter: "
		}
	});

	$('#peopleTable tbody').on( 'click', 'tr', function () {
		if ( $(this).hasClass('selected') ) {
			//$(this).removeClass('selected');
		}
		else {
			peopleTable.$('tr.selected').removeClass('selected');
			$(this).addClass('selected');
		}
	} );
}

function refreshPeopleData(tableId){
	loadDataFromServer(URL_PEOPLE_LIST, function(peopleListData){
		bindPeopleData(tableId, peopleListData);
	});
}
function bindPeopleData(tableId, peopleListData){
	var table = $(tableId).dataTable();
	var oSettings = table.fnSettings();

	table.fnClearTable(this);

	for (var i=0; i<peopleListData.length; i++){
		table.oApi._fnAddData(oSettings, peopleListData[i]);
	}
	oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();

	table.fnDraw();
}
function openPersonEditorView(_id){
	var table = $('#peopleTable').DataTable();
	var allData = table.rows().data();
	for (i = 0; i < allData.length; i ++){
		if (_id == allData[i]._id){
			//alert(JSON.stringify(allData[i]));
			initPersonEditorWidget (allData[i]);
		}
	}

	//if (_id){
	//	alert(JSON.stringify(currentPersonEdited));
	//	initPersonEditorWidget (currentPersonEdited);
	//}//else{
	//	loadDataFromServer(URL_PERSON_FETCH + _id, function(personData){
	//		initPersonEditorWidget (personData);
	//	});
	//}
}

function initPersonEditorWidget (personData) {
	//make editor
	var peopleEditor = $.JST.createFromTemplate({}, "PEOPLE_EDITOR");

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
	$("body").append('<div id="peopleEditorWidget" title="Member"></div>');
	$("#peopleEditorWidget").append(peopleEditor);
	$("#peopleEditorWidget").bringToFront();
	$("#peopleEditorWidget").dialog({
		resizable: false,
		modal: true,
		width:optimizedDialogWidth,
		height:optimizedDialogHeight,
		buttons: {
			"Save": function() {
				var person = {};
				peopleEditor.find("#validationMsg").text("");
				var _id = peopleEditor.find("#_id").val();
				if (_id && _id != '') person._id = _id;

				//person._id = peopleEditor.find("#_id").val();
				person.name = peopleEditor.find("#name").val();

				var status = $("#statusPerson").is(':checked');
				//alert("status: " + status);
				var statusStr = 'INACTIVE';
				if (status){
					statusStr = 'ACTIVE';

				}
				person.status = statusStr;

				person.email = peopleEditor.find("#email").val();
				person.phone = peopleEditor.find("#phone").val();
				person.role = peopleEditor.find("#spaceRole").val();

				var isValid = true;

				if (person.email == '' || validateEmail(person.email) == false) {
					isValid = false;
					peopleEditor.find("#validationMsg").text("Error: email is not valid!");
					peopleEditor.find("#email").focus();
					return;
				}

				if (person.name == '') {
					isValid = false;
					peopleEditor.find("#validationMsg").text("Error: a screen name is required!");
					peopleEditor.find("#name").focus();
					return;
				}

				if (isValid){
					saveDataOnServer(URL_PERSON_SAVE, person, function(reply, textStatus){
						//alert(JSON.stringify(reply));
						if (reply.success){
							//peopleEditor.find("#_id").val(data._id);
							refreshPeopleData('#peopleTable');
							$("#peopleEditorWidget").dialog( "close" );
						}else if (reply.code == 'MEMBER_EXISTS') {
							peopleEditor.find("#validationMsg").text("Error: member already exists!");
							peopleEditor.find("#email").focus();
						}
					});
				}
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
			$("#peopleEditorWidget").remove();
		}
	});

	if (personData){
		peopleEditor.find("#_id").val(personData._id);
		peopleEditor.find("#email").val(personData.email);
		peopleEditor.find("#name").val(personData.name);
		peopleEditor.find("#phone").val(personData.phone);
		peopleEditor.find("#spaceRole").val(personData.role);

		if (personData.status == 'ACTIVE'){
			$("#statusPerson").prop('checked', true); //.checkboxradio('refresh'); not sure why this not work
		}else{
			$("#statusPerson").prop('checked', false);
		}

		if (personData._id) {
			peopleEditor.find("#email").prop('disabled', true);
		}
	}
}


