function initGlobalNav(){

	var navStr =
				'<ul>';
		if(current_workspace_role=='admin' || current_workspace_role=='edit') {
			navStr += '<li class="authorized" style="display: none"><a href="javascript:initGanttView()">New Project</a></li>';
		}
		navStr +=
					'<li class="authorized" style="display: none"><a href="javascript:initProjectsView()">Projects</a></li>' +
					'<li class="authorized" style="display: none"><a href="javascript:initMyTasksView()">Tasks</a></li>' +
					'<li class="authorized" style="display: none"><a href="javascript:initPeopleView()">Members</a></li>' +
					//'<li class="authorized" style="display: none"><a href="javascript:initRolesView()">Roles</a></li>' +
					'<li class="authorized" style="display: none"><a href="javascript:initSpacesView()">Workspaces</a></li>' +
					'<li class="authorized" style="display: none"><a href="javascript:initUserProfileWidget();" class="button special">' + current_user + '</a></li>' +
				'</ul>';

	$('#nav').empty();
	$('#nav').append(navStr);

	resetNavPanel();

	$('.unauthorized').hide();
	$('.authorized').show();
}

function resetNavPanel(){

	var navPanel = $("#navPanel");

	if (navPanel){
		navPanel.empty();

		var newMenuList =
		'<div data-action="navList" data-args="nav">' +
			'<nav>';
			if(current_workspace_role=='admin' || current_workspace_role=='edit') {
				newMenuList += '<a class="link depth-0" href="javascript:initGanttView()"><span class="indent-0"></span>New Project</a>';
			}
			newMenuList +=
				'<a class="link depth-0" href="javascript:initProjectsView()"><span class="indent-0"></span>Projects</a>' +
				'<a class="link depth-0" href="javascript:initMyTasksView()"><span class="indent-0"></span>Tasks</a>' +
				'<a class="link depth-0" href="javascript:initPeopleView()"><span class="indent-0"></span>Members</a>' +
				//'<a class="link depth-0" href="javascript:initRolesView()"><span class="indent-0"></span>Roles</a>' +
				'<a class="link depth-0" href="javascript:initSpacesView()"><span class="indent-0"></span>Workspaces</a>' +
				'<a class="link depth-0" href="javascript:initUserProfileWidget();"><span class="indent-0"></span>' + current_user + '</a>' +
			'</nav>' +
		'</div>';
		navPanel.append(newMenuList);
	}
}


function initUserProfileWidget () {

	$("body").append('<div id="userProfileWidget" title="Logout"></div>');
	$("#userProfileWidget").append("Name: " + current_user
		+ "<br>Default Workspace: " + default_workspace_name
		+ "<br>Cuurent Workspace: " + current_workspace_name
		);
	$("#userProfileWidget").bringToFront();
	$("#userProfileWidget").dialog({
		resizable: false,
		modal: true,
		//width:"45%",
		//height:280,
		buttons:
		{
				"Logout": function() {
					logoutFramework();
				},
				"Cancel": function() {
					$("#userProfileWidget").dialog( "close" );
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
			$("#userProfileWidget").remove();
		}
	});
}

