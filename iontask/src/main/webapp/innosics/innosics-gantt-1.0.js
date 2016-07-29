
var ge;
var ganttInitialized = false;
function initGanttView(projectId){

	$('.nongantt').hide();
	$('.gantt').show();

	var workSpace = $("#workspaceGantt");

	if (! ganttInitialized){
		$("#workspaceGantt").empty();

		ge = new GanttMaster();

		workSpace.css({width:$(window).width() - 1,height:$(window).height() - 259});
		ge.init(workSpace);

		loadI18n();

		ganttInitialized = true;
	}

	loadGanttFromServer(projectId);

	$(window).resize(function(){
		workSpace.css({width:$(window).width() - 1,height:$(window).height() - 259});
		workSpace.trigger("resize.gantt");
		console.log('$(window).height(): ' + $(window).height());
	}).oneTime(150,"resize",function(){$(this).trigger("resize")});

	resetToolBar();
	appendToolBar('Save', 'Save', function(){
		saveGanttOnServer();
	}, true);
	actionStack[actionStack.length] = function() { initGanttView(projectId); };
}

function getDocHeight() {
    var D = document;
    return Math.max(
        D.body.scrollHeight, D.documentElement.scrollHeight,
        D.body.offsetHeight, D.documentElement.offsetHeight,
        D.body.clientHeight, D.documentElement.clientHeight
    );
}
function loadGanttFromServer(projectId) {

	var projectUrl;
	if (projectId) {
		projectUrl = URL_PROJECT_FETCH + projectId;
	}else{
		projectUrl = URL_PROJECT_FETCH + 'EMPTY';
	}
	loadDataFromServer(projectUrl, function(data){

		var tasks = data.tasks;
		tasks.sort(function(a,b){
			return a.id - b.id;
		});
		if (projectId) {

		}else{
			data.tasks[0].id = 1;
			data.tasks[0].start = new Date().getTime();
			data.tasks[0].end = new Date().getTime() + 3600000 * 24;
			data.tasks[0].duration = 1;
			data.tasks[0].progress = 0;
			data.tasks[0].description = "New project created on " + (new Date());
		}
		//alert(JSON.stringify(data));
		ge.loadProject(data);
		ge.checkpoint(); //empty the undo stack

	});
}
function saveGanttOnServer() {
	if(!ge.canWrite)
		return;

	var prj = ge.saveProject();

	if (ge.deletedTaskIds.length>0) {
		if (!confirm("TASK_THAT_WILL_BE_REMOVED\n"+ge.deletedTaskIds.length)) {
			return;
		}
	}

	prj.code = prj.tasks[0].code;
	prj.name = prj.tasks[0].name;
	prj.description = prj.tasks[0].description;

	for (i = 0; i < prj.tasks.length; i ++){
		prj.tasks[i].id = i + 1;

	}

	saveDataOnServer(URL_PROJECT_SAVE, prj, function(reply, textStatus){
		var data;
		var msg;
		//alert(JSON.stringify(reply));
		if (reply.success){
			data = reply.data;
			var tasks = data.tasks;
			tasks.sort(function(a,b){
				return a.id - b.id;
			});
			ge.loadProject(data);
			ge.checkpoint(); //empty the undo stack
			msg = reply.MESSAGE;
		}else{
			msg = reply.MESSAGE;
		}

		$("body").append('<div id="ganttSaveConfirmWidget" title="Project"></div>');
		$("#ganttSaveConfirmWidget").append(msg);
		$("#ganttSaveConfirmWidget").bringToFront();
		$("#ganttSaveConfirmWidget").dialog({
			resizable: false,
			modal: true,
			//width:"45%",
			//height:180,
			buttons:
			{
					"Ok": function() {
						$("#ganttSaveConfirmWidget").dialog( "close" );
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
				$("#ganttSaveConfirmWidget").remove();
			}
		});
		refreshGlebalViews();
	});
}

function editResources(){

	$('body').append('<div id="projectTeamEditorWidget" title="Resources"></div>');
	var str =
		'<div class="row 150%">' +
			'<div class="6u 12u$(medium)">' +
				'<header class="major">' +
					'<h2>Resource Available</h2>' +
				'</header>' +
				'<section>' +
					'<table id="availableResourceTable" class="display responsive nowrap" cellspacing="0" width="100%"></table>' +
				'</section>' +
			'</div>' +
			'<div class="6u$ 12u$(medium) important(medium)">' +
				'<header class="major">' +
					'<h2>Project Team</h2>' +
				'</header>' +
				'<section>' +
					'<table id="projectResourceTable" class="display responsive nowrap" cellspacing="0" width="100%"></table>' +
				'</section>' +
			'</div>' +
		'</div>';

	$("#projectTeamEditorWidget").append(str);

	$("#projectTeamEditorWidget").bringToFront();

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

	$("#projectTeamEditorWidget").dialog({
		resizable: false,
		modal: true,
		width:optimizedDialogWidth,
		height:optimizedDialogHeight,
		buttons: {
			"Done": function() {
				$( this ).dialog( "close" );
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
			$("#projectTeamEditorWidget").remove();
		}
	});

	initAvailableResourceDataTable("#availableResourceTable");
	initProjectResourceDataTable("#projectResourceTable");

	refreshAvailableResourceData("#availableResourceTable");
	projectResourceData("#projectResourceTable");
}

function initAvailableResourceDataTable(tableId){
	var resourceTable = $(tableId).dataTable({
        responsive: true,
        "paging": false,
		"aoColumns": [
		{ "sTitle": "", "mData": "_id"},
		{ "sTitle": "Email", "mData": "email" },
		{ "sTitle": "Name", "mData": "name"}
		],
		"aoColumnDefs": [
			{
				"aTargets" : [0],
				"bSortable": false,
				"width": "6px",
				"mRender": function ( data, type, full ) {
					if(data){
						return '<button onclick="moveResourceTable(\'#availableResourceTable\', \'#projectResourceTable\',\'' + data + '\', 1);" class="buttonsmall textual" title="Edit"><span class="innosicsIcon">&#x2b;</span></button>';
					}
					return "";
				}
			}
		],
        "oLanguage": {
        	"sSearch": "Filter: "
		}
	});
}

var defaultProjectRoles = [{"id": "pm", "name":"Project Manager"},{"id": "mem", "name":"Team Member"}];

function initProjectResourceDataTable(tableId){

	var resourceTable = $(tableId).dataTable({
        responsive: true,
        "paging": false,
		"aoColumns": [
		{ "sTitle": "", "mData": "_id"},
		{ "sTitle": "Email", "mData": "email" },
		{ "sTitle": "Name", "mData": "name"},
		{ "sTitle": "Role", "mData": "role.id"}
		],
		"aoColumnDefs": [
			{
				"aTargets" : [0],
				"bSortable": false,
				"width": "6px",
				"mRender": function ( data, type, full ) {
					if(data){
						return '<button onclick="moveResourceTable(\'#projectResourceTable\', \'#availableResourceTable\',\'' + data + '\', -1);" class="buttonsmall textual" title="Edit"><span class="innosicsIcon">&#x64;</span></button>';
					}
					return "";
				}
			},
			{
				"aTargets" : [3],
				"mRender": function ( data, type, full ) {
					var ss =
						'<select id="ro_' + full._id + '" name="ef_' + full._id + '" style="height:24px; width: 120px; margin:0;padding:0;" type="select" ' + (ge.canWrite? '':'disabled') + '>';
							for (r = 0; r < defaultProjectRoles.length; r ++){
								ss += '<option value="' + defaultProjectRoles[r].id + '"';
								//alert("defaultProjectRoles[r].id: " + defaultProjectRoles[r].id); //roleId
								if (defaultProjectRoles[r].id == data) {
									ss += ' selected';
								}
								ss += '>' + defaultProjectRoles[r].name + '</option>';
							}
					ss += '</select>';
					return ss;
				}
			}
		],
        "oLanguage": {
        	"sSearch": "Filter: "
		}
	});
}

function refreshAvailableResourceData(tableId){
	loadDataFromServer(URL_PEOPLE_LIST + '?status=ACTIVE', function(projectListData){
		var table = $(tableId).dataTable();
		var oSettings = table.fnSettings();

		table.fnClearTable(this);

		var unassignedRes = [];
		for (var j=0; j<projectListData.length; j++){
			var alreadyAssigned = false;
			for (i = 0; i < ge.resources.length; i ++){
				if (ge.resources[i]._id == projectListData[j]._id){
					alreadyAssigned = true;
					break;
				}
			}
			if (alreadyAssigned == false){
				unassignedRes[unassignedRes.length] = projectListData[j];
			}
		}

		for (var i=0; i<unassignedRes.length; i++){
			table.oApi._fnAddData(oSettings, unassignedRes[i]);
		}
		oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();

		table.fnDraw();
	});
}

function projectResourceData(tableId){
	var table = $(tableId).dataTable();
	var oSettings = table.fnSettings();

	table.fnClearTable(this);

	for (var i=0; i<ge.resources.length; i++){
		table.oApi._fnAddData(oSettings, ge.resources[i]);
	}
	oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();

	table.fnDraw();
}
function moveResourceTable( tableId1, tableId2, _id, action){
	var table1 = $(tableId1).DataTable();
	var table1Rows = table1.rows()[0];

	table1Rows.forEach(function(rowId){
		var rowData = table1.rows(rowId).data()[0];

		if (_id == rowData._id){
			var table2 = $(tableId2).dataTable();
			var oSettings2 = table2.fnSettings();
			table2.oApi._fnAddData(oSettings2, rowData);
			oSettings2.aiDisplay = oSettings2.aiDisplayMaster.slice();
			table2.fnDraw();

			table1.rows(rowId).remove().draw();

			if (action == 1){
				var role = $('#ro_' + _id).val();
				rowData.role = getProjectRole(role);
				//alert("role: " + JSON.stringify(rowData.role));
				ge.resources[ge.resources.length] = rowData;
				//
				$('#ro_' + _id).on('change', function() {
					var v = $(this).val();
					//alert("v: " + v);
					rowData.role = getProjectRole(v);
					//alert("role: " + JSON.stringify(rowData.role));
				});
			}else{
				for (i = 0; i < ge.resources.length; i ++){
					if (ge.resources[i]._id == _id){
						ge.resources.splice(i, 1);
						return;
					}
				}
			}
		}
	});
}
function getProjectRole(id){
	for (i = 0; i < defaultProjectRoles.length; i ++){
		if (id == defaultProjectRoles[i].id){
			return defaultProjectRoles[i];
		}
	}
	return {"un":"Unknown"};
}

function editResourceAssignments(task, taskRow){

	$('body').append('<div id="assignmentEditorWidget" title="Assgnments"></div>');
	var str =
		'<div class="row 150%">' +
			'<div class="6u 12u$(medium)">' +
				'<header class="major">' +
					'<h2>Project Team</h2>' +
				'</header>' +
				'<section>' +
					'<table id="projectResourceTable" class="display responsive nowrap" cellspacing="0" width="100%"></table>' +
				'</section>' +
			'</div>' +
			'<div class="6u$ 12u$(medium) important(medium)">' +
				'<header class="major">' +
					'<h2>Resource Assigned</h2>' +
				'</header>' +
				'<section>' +
					'<table id="assignmentsTable" class="display responsive nowrap" cellspacing="0" width="100%"></table>' +
				'</section>' +
			'</div>' +
		'</div>';

	$("#assignmentEditorWidget").append(str);

	$("#assignmentEditorWidget").bringToFront();

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

	$("#assignmentEditorWidget").dialog({
		resizable: false,
		modal: true,
		width:optimizedDialogWidth,
		height:optimizedDialogHeight,
		buttons: {
			"Done": function() {
				if (ge.canWrite){
					saveAssignedTaskAssignments();
				}
				$( this ).dialog( "close" );
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
			$("#assignmentEditorWidget").remove();
		}
	});

	initProjectMemberDataTable("#projectResourceTable");
	initAssignmentsTable("#assignmentsTable");

	availableProjectMemberData("#projectResourceTable", task);
	assignmentsTableData("#assignmentsTable", task);
}

function availableProjectMemberData(tableId, task){
	var table = $(tableId).dataTable();
	table.attr("task_id",task._id);
	table.attr("taskId",task.id);
	var oSettings = table.fnSettings();

	table.fnClearTable(this);

	var unassignedRes = [];
	for (var j=0; j<ge.resources.length; j++){
		var alreadyAssigned = false;
		for (i = 0; i < task.assigs.length; i ++){
			if (task.assigs[i]._id == ge.resources[j]._id){
				alreadyAssigned = true;
				break;
			}
		}
		if (alreadyAssigned == false){
			unassignedRes[unassignedRes.length] = ge.resources[j];
		}
	}

	for (var i=0; i<unassignedRes.length; i++){
		table.oApi._fnAddData(oSettings, unassignedRes[i]);
	}
	oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();

	table.fnDraw();
}
function initProjectMemberDataTable(tableId){
	var resourceTable = $(tableId).dataTable({
        responsive: false,
        "paging": false,
		"aoColumns": [
		{ "sTitle": "", "mData": "_id"},
		{ "sTitle": "Email", "mData": "email" },
		{ "sTitle": "Name", "mData": "name"}
		],
		"aoColumnDefs": [
			{
				"aTargets" : [0],
				"bSortable": false,
				"width": "6px",
				"mRender": function ( data, type, full ) {
					if(data && ge.canWrite){
						return '<button onclick="assignTaskResource(\'#projectResourceTable\', \'#assignmentsTable\',\'' + data + '\', 1);" class="buttonsmall textual" title="Edit"><span class="innosicsIcon">&#x2b;</span></button>';
					}
					return "";
				}
			}
		],
        "oLanguage": {
        	"sSearch": "Filter: "
		}
	});
}
function initAssignmentsTable(tableId){
	var resourceTable = $(tableId).dataTable({
        responsive: false,
        "paging": false,
		"aoColumns": [
		{ "sTitle": "", "mData": "_id"},
		{ "sTitle": "Email", "mData": "email" },
		{ "sTitle": "Name", "mData": "name"},
		{ "sTitle": "Effort", "mData": "effort"}
		],
		"aoColumnDefs": [
			{
				"aTargets" : [0],
				"bSortable": false,
				"width": "6px",
				"mRender": function ( data, type, full ) {
					if(data && ge.canWrite){
						return '<button onclick="assignTaskResource(\'#assignmentsTable\', \'#projectResourceTable\',\'' + data + '\', -1);" class="buttonsmall textual" title="Edit"><span class="innosicsIcon">&#x64;</span></button>';
					}
					return "";
				}
			},
			{
				"aTargets" : [3],
				"mRender": function ( data, type, full ) {
					//alert(JSON.stringify(full));
					var v = '';
					if(data){
						v = data;
					}
					return '<input id="ef_' + full._id + '" name="ef_' + full._id + '" style="height:24px; width: 80px; margin:0;padding:0;" type="text" length=10 value="' + v + '" ' + (ge.canWrite? '':'disabled') + '/>';
				}
			}
		],
        "oLanguage": {
        	"sSearch": "Filter: "
		}
	});
}
function assignTaskResource( tableId1, tableId2, _id, action){
	var table1 = $(tableId1).DataTable();
	var table1Rows = table1.rows()[0];

	table1Rows.forEach(function(rowId){
		var rowData = table1.rows(rowId).data()[0];

		if (_id == rowData._id){
			var table2 = $(tableId2).dataTable();
			var oSettings2 = table2.fnSettings();

			var taskId = table2.attr("taskId");

			var task = ge.getTask(taskId);
			var i = task.assigs.length;

			if (action == 1){
				rowData.effort = 100;
				//alert(JSON.stringify(rowData));
			}
			table2.oApi._fnAddData(oSettings2, rowData);
			oSettings2.aiDisplay = oSettings2.aiDisplayMaster.slice();
			table2.fnDraw();

			table1.rows(rowId).remove().draw();
		}
	});
}
function saveAssignedTaskAssignments(){
	//alert('saveAssignedTaskAssignments: 1');
	var table2 = $('#assignmentsTable').dataTable();

	var taskId = table2.attr("taskId");

	var task = ge.getTask(taskId);

	ge.beginTransaction();
	task.assigs.splice(0,task.assigs.length);
	//alert('saveAssignedTaskAssignments: task.assigs.length: ' + task.assigs.length);

	var table1 = $('#assignmentsTable').DataTable();
	var table1Rows = table1.rows()[0];

	table1Rows.forEach(function(rowId){
		var rowData = table1.rows(rowId).data()[0];
		//var v = $('#assignmentsTable tr:eq(' + rowId + ') td:eq(3)').html();
		//alert(v);
		var effort = $('#ef_' + rowData._id).val();
		//alert("effort: " + effort);


		rowData.effort = effort;

		task.assigs[task.assigs.length] = rowData;
	});
	ge.endTransaction();
}
function assignmentsTableData(tableId, task){
	var table = $(tableId).dataTable();
	table.attr("task_id",task._id);
	table.attr("taskId",task.id);
	table.attr("task",task);
	var oSettings = table.fnSettings();

	table.fnClearTable(this);

	for (var i=0; i<task.assigs.length; i++){
		table.oApi._fnAddData(oSettings, task.assigs[i]);
	}
	oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();

	table.fnDraw();
}

function clearGantt() {
  ge.reset();
}
function loadI18n() {
	GanttMaster.messages = {
		"CANNOT_WRITE":                  "CANNOT_WRITE",
		"CHANGE_OUT_OF_SCOPE":"NO_RIGHTS_FOR_UPDATE_PARENTS_OUT_OF_EDITOR_SCOPE",
		"START_IS_MILESTONE":"START_IS_MILESTONE",
		"END_IS_MILESTONE":"END_IS_MILESTONE",
		"TASK_HAS_CONSTRAINTS":"TASK_HAS_CONSTRAINTS",
		"GANTT_ERROR_DEPENDS_ON_OPEN_TASK":"GANTT_ERROR_DEPENDS_ON_OPEN_TASK",
		"GANTT_ERROR_DESCENDANT_OF_CLOSED_TASK":"GANTT_ERROR_DESCENDANT_OF_CLOSED_TASK",
		"TASK_HAS_EXTERNAL_DEPS":"TASK_HAS_EXTERNAL_DEPS",
		"GANTT_ERROR_LOADING_DATA_TASK_REMOVED":"GANTT_ERROR_LOADING_DATA_TASK_REMOVED",
		"ERROR_SETTING_DATES":"ERROR_SETTING_DATES",
		"CIRCULAR_REFERENCE":"CIRCULAR_REFERENCE",
		"CANNOT_DEPENDS_ON_ANCESTORS":"CANNOT_DEPENDS_ON_ANCESTORS",
		"CANNOT_DEPENDS_ON_DESCENDANTS":"CANNOT_DEPENDS_ON_DESCENDANTS",
		"INVALID_DATE_FORMAT":"INVALID_DATE_FORMAT",
		"TASK_MOVE_INCONSISTENT_LEVEL":"TASK_MOVE_INCONSISTENT_LEVEL",

		"GANTT_QUARTER_SHORT":"trim.",
		"GANTT_SEMESTER_SHORT":"sem."
	};
}

