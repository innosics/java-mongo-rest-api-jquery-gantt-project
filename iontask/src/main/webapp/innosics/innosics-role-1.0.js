function initRolesView(){

	$('.gantt').hide();
	$('.nongantt').show();

	$("#mainWorkspace").empty();
	resetToolBar();

	initRolesWidgit();

	initRolesDataTable('#RolesTable');

	refreshRolesData('#RolesTable');

	if(current_workspace_role=='admin') {
		appendToolBar('Create', 'Create', function(){
			initRoleEditorWidget();
		}, true);
	}

	$("#mainWorkspace").resize();
}

function initRolesWidgit(){
	$('#mainWorkspace').append('<table id="RolesTable" class="display responsive nowrap" cellspacing="0" width="100%"></table>');
}

function initRolesDataTable(tableId){

	var roleTable = $(tableId).dataTable({
        responsive: true,
	"aoColumns": [
		{ "sTitle": "", "mData": "_id"},
		{ "sTitle": "ID", "mData": "id" },
		{ "sTitle": "Name", "mData": "name"},
		{ "sTitle": "Status", "mData": "status" }
	],
	"aoColumnDefs": [
		{
			"aTargets" : [0],
			"mRender": function ( data, type, full ) {
				if(data){
					return '<button onclick="openRoleEditorView(\'' + data + '\');" class="buttonsmall textual" title="Edit"><span class="innosicsIcon">&#x65;</span></button>';
				}
				return "";
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
			roleTable.$('tr.selected').removeClass('selected');
			$(this).addClass('selected');
		}
	} );
}


function refreshRolesData(tableId){
	loadDataFromServer(URL_ROLES_LIST, function(roleListData){
		bindRolesData(tableId, roleListData);
	});
}
function bindRolesData(tableId, roleListData){
	var table = $(tableId).dataTable();
	var oSettings = table.fnSettings();

	table.fnClearTable(this);

	for (var i=0; i<roleListData.length; i++){
		table.oApi._fnAddData(oSettings, roleListData[i]);
	}
	oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();

	table.fnDraw();
}
function openRoleEditorView(_id){
	var table = $('#RolesTable').DataTable();
	var allData = table.rows().data();
	for (i = 0; i < allData.length; i ++){
		if (_id == allData[i]._id){
			//alert(JSON.stringify(allData[i]));
			initRoleEditorWidget (allData[i]);
		}
	}
}

function initRoleEditorWidget (roleData) {
	//make editor
	var roleEditor = $.JST.createFromTemplate({}, "ROLE_EDITOR");

	$("body").append('<div id="roleEditorWidget" title="Invite"></div>');
	$("#roleEditorWidget").append(roleEditor);
	$("#roleEditorWidget").bringToFront();
	$("#roleEditorWidget").dialog({
		resizable: false,
		modal: true,
		width:"75%",
		height:480,
		buttons: {
			"Save": function() {
				if (roleData && roleData.id == 'PM'){
					$("#roleEditorWidget").dialog( "close" );
				}else{
					var role = {};
					var _id = roleEditor.find("#_id").val();
					if (_id && _id != '') role._id = _id;
					role.id = roleEditor.find("#id").val();
					role.name = roleEditor.find("#name").val();

					var status = $("#statusAssignmentRole").is(':checked');
					//alert("status: " + status);
					var statusStr = 'INACTIVE';
					if (status){
						statusStr = 'ACTIVE';

					}
					//alert("role._id: " + role._id);
					//alert("statusStr: " + statusStr);
					role.status = statusStr;
					//alert(JSON.stringify(role));

					saveDataOnServer(URL_ROLE_SAVE, role, function(data, textStatus){
						var strData = JSON.stringify(data);

						roleEditor.find("#_id").val(data._id);

						refreshRolesData('#RolesTable');

						$("#roleEditorWidget").dialog( "close" );
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
			$("#roleEditorWidget").remove();
		}
	});

	if (roleData){
		roleEditor.find("#_id").val(roleData._id);
		roleEditor.find("#id").val(roleData.id);
		roleEditor.find("#name").val(roleData.name);

		if (roleData.id == 'PM'){
				roleEditor.find("#id").prop('disabled', true);
				roleEditor.find("#name").prop('disabled', true);
				$("#statusAssignmentRole").prop('disabled', true);
		}
		if (roleData.status == 'ACTIVE'){
			$("#statusAssignmentRole").prop('checked', true); //.checkboxradio('refresh'); not sure why this not work
		}else{
			$("#statusAssignmentRole").prop('checked', false);
		}
	}
}

