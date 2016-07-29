function initProjectsView(){

	$('.gantt').hide();
	$('.nongantt').show();

	$("#mainWorkspace").empty();
	resetToolBar();

	initProjectsViewWidgit();
	/*$('#mainWorkspace').append('<hr />');
	initTasksViewWidgit();*/

	initProjectsDataTable();

	/*initTasksDataTable();*/

	appendToolBar('New', 'New', function(){
		initGanttView();
	}, true);

	loadProjectsData(URL_MY_PROJECTS_LIST);

	$("#mainWorkspace").resize();

	helpTopic = helpTips.projects;

	actionStack[actionStack.length] = function() { initProjectsView(); };
}
function initProjectsViewWidgit(){
	$('#mainWorkspace').append('<div class="table-wrapper"><table id="projectsTable" class="display responsive nowrap" cellspacing="0" width="100%"></table></div>');
}
function initTasksViewWidgit(){
	$('#mainWorkspace').append('<div class="table-wrapper"><table id="tasksTable" class="display responsive nowrap" cellspacing="0" width="100%"></table></div>');
}
function initProjectsDataTable(){

	var projectsTable = $('#projectsTable').dataTable({
        responsive: true,
		"aoColumns": [
			{ "sTitle": "", "mData": "_id"},
			{ "sTitle": "Code", "mData": "code" },
			{ "sTitle": "Name", "mData": "name" },
			{ "sTitle": "Owner", "mData": "principal" },
			{ "sTitle": "Description", "mData": "description" }
		],
		"aoColumnDefs": [
			{
				"aTargets" : [1, 2, 3, 4],
				"mRender": function ( data, type, full ) {
					if(data){
						return data;
					}
					return "";
				}
			},
			{
				"aTargets" : [0],
				"bSortable": false,
				"width": "6px"
			},
			{
				"aTargets" : [1],
				"width": "15px"
			},
			{
				"aTargets" : [0],
				"mRender": function ( data, type, full ) {
					if(data){// && full.canWrite){//alert("_id: " + data);
						return '<button onclick="initGanttView(\'' + data + '\');" class="buttonsmall textual" title="Edit"><span class="innosicsIcon">&#x65;</span></button>';
					}else{
						return "";
					}
				}
			}
		],
        "oLanguage": {
        	"sSearch": "Filter: "
		}
	});

	$('#projectsTable tbody').on( 'click', 'tr', function () {

		if ( $(this).hasClass('selected') ) {
			//$(this).removeClass('selected');
		}
		else {
			$(this).addClass('selected');
			/*var projectData = projectsTable.fnGetData( this );
			projectsTable.$('tr.selected').removeClass('selected');
			loadTasksData(projectData._id);*/
		}
	} );
}

function initTasksDataTable(){
	var tasksTable = $('#tasksTable').dataTable({
        responsive: true,
		"aoColumns": [
			{ "sTitle": "", "mData": "_id"},
			{ "sTitle": "Code", "mData": "code" },
			{ "sTitle": "Name", "mData": "name" },
			{ "sTitle": "Start date", "mData": "start" },
			{ "sTitle": "End date", "mData": "end" },
			{ "sTitle": "Status", "mData": "status" },
			{ "sTitle": "Description", "mData": "description" }
		],
		"aoColumnDefs": [
			{
				"aTargets" : [0],
				"bSortable": false,
				"width": "6px"
			},
			{
				"aTargets" : [0],
				"mRender": function ( data, type, full ) {
					if(data){
						return '<button onclick="openTaskEditorView(\'' + data + '\');" class="buttonsmall textual" title="Edit"><span class="innosicsIcon">&#x65;</span></button>';
					}else{
						return '<button onclick="" class="buttonsmall textual" title="Edit" disabled><span class="innosicsIcon">&#x65;</span></button>';
					}
				}
			},
			{   //format the date for local time
				"aTargets" : [3,4],
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
				"aTargets" : [5],
				"width": "10px",
				"mRender": function ( data, type, full ) {
					if(data){
						return '<div id="status" class="taskStatus" status="' + data + '">';
					}
					return "";
				}
			}
		],
        "oLanguage": {
        	"sSearch": "Filter: "
		}
	});

	$('#tasksTable tbody').on( 'click', 'tr', function () {

		if ( $(this).hasClass('selected') ) {
			//$(this).removeClass('selected');
		}
		else {
			tasksTable.$('tr.selected').removeClass('selected');
			$(this).addClass('selected');
		}
	} );
}

function loadProjectsData(urlData){
	loadDataFromServer(urlData, function(projectListData){

		//alert(JSON.stringify(projectListData));
		var table = $('#projectsTable').dataTable();
		var oSettings = table.fnSettings();

		table.fnClearTable(this);

		for (var i=0; i<projectListData.length; i++){
			table.oApi._fnAddData(oSettings, projectListData[i]);
		}
		oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();

		table.fnDraw();

		var projectData = table.fnGetData( $('#projectsTable tbody tr:eq(0)')[0]);
		//alert(JSON.stringify(projectData));
		//loadTasksData(projectData._id);
	});
}

function loadTasksData(projectId){
	loadDataFromServer(URL_TASKS_LIST + '?projectId=' + projectId, function(tasksData){
		bindTasksData(tasksData);
	});
}
function bindTasksData(tasksData){
	var table = $('#tasksTable').dataTable();
	var oSettings = table.fnSettings();

	table.fnClearTable(this);

	for (var i=0; i<tasksData.length; i++){
		//alert(JSON.stringify(tasksData[i]));
		if (! tasksData[i].hasChild){
			//alert(i);
			table.oApi._fnAddData(oSettings, tasksData[i]);
		}
	}
	//alert("2");
	oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();
	table.fnDraw();

	var taskData = table.fnGetData( $('#tasksTable tbody tr:eq(0)')[0]);
}
