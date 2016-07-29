function initCasesView(){

	$("#mainWorkspace").empty();
	resetToolBar();

	var mainWorkspaceStr =
		'<section id="content">' +
			//'<h3><div class="workspaceMsg">Welcome to Mea Opus!</div></h3>' +
			//'<hr />' +
			'<div id="workspace" style="width: 100%; padding:0px; border:0px solid #e5e5e5;position:relative;margin:0 0px"></div>' +
		'</section>';

	$("#mainWorkspace").append(mainWorkspaceStr);

	initCasesWidgit();
}
function initCasesWidgit(){
	$('#workspace').append('<table id="casesTable" class="display responsive nowrap" cellspacing="0" width="100%"></table>');
	//alert("load cdef...");
	loadDataFromServer(URL_FIND_UI_DEF + 'casesTable', function(cdef){

		initCasesDataTable(cdef);

		refreshCasesData();
	});
}
function initCasesDataTable(cdef){
	//alert(JSON.stringify(cdef));
	var casesTable = $('#casesTable').dataTable({
        responsive: true,
        //"paging": false,
	//"bAutoWidth":false,
	"sScrollX": "100%",
	"sScrollY": false,
	"aoColumns": cdef.columns,
        "oLanguage": {
        	"sSearch": "Filter: "
		}
	});

	$('#casesTable tbody').on( 'click', 'tr', function () {
		if ( $(this).hasClass('selected') ) {
			//$(this).removeClass('selected');
		}
		else {
			casesTable.$('tr.selected').removeClass('selected');
			$(this).addClass('selected');
		}
	} );
}
function refreshCasesData(){
	loadDataFromServer(URL_DATA_SIMPLE_LIST + 'cases', function(data){
		//alert(JSON.stringify(data));
		var table = $('#casesTable').dataTable();
		var oSettings = table.fnSettings();

		table.fnClearTable(this);

		for (var i=0; i<data.length; i++){
			table.oApi._fnAddData(oSettings, data[i]);
		}
		oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();

		table.fnDraw();

		//var caseData = table.fnGetData( $('#casesTable tbody tr:eq(0)')[0]);
		//alert(JSON.stringify(caseData));
		//show case details
	});
}
