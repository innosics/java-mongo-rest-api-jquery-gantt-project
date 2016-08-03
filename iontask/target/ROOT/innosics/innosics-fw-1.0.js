
function initFramework(data){

	$("head").append(data.vars);

	//alert("current_workspace_role: " + current_workspace_role + " current_user: " + current_user);
	var wsn = $("#defaultWorkspaceName");
	if (wsn){
		wsn.empty();
		wsn.append(data.name);
	}
	var wsnl = $("#defaultWorkspaceNameLogo");
	if (wsnl){
		wsnl.empty();
		wsnl.append(data.name);
	}
}
