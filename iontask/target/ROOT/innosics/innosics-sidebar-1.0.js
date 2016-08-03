function loadSideBar(){
	var sideBarStr =

								'<section>' +
									'<div id="overdueAccordion">' +
										'<h3><a href="#">Overdue</a></h3>' +
										'<div id="overdueDeadline">' +
										'</div>' +
									'</div>' +
									'<div id="upcommingAccordion">' +
										'<h3><a href="#">Due in 7 days</a></h3>' +
										'<div id="upcommingsDeadline">' +
										'</div>' +
									'</div>' +
									'<div id="toBeStartedAccordion">' +
										'<h3><a href="#">To be started in 7 days</a></h3>' +
										'<div id="toBeStartedDeadline">' +
										'</div>' +
									'</div>' +
								'</section>';

	$('#sidebar').append(sideBarStr);

	$("#overdueAccordion").accordion({
		heightStyle: "content",
		collapsible: true,
		active: 0
	});

	$("#upcommingAccordion").accordion({
		heightStyle: "content",
		collapsible: true,
		active: 0
	});

	$("#toBeStartedAccordion").accordion({
		heightStyle: "content",
		collapsible: true,
		active: 0
	});

	refreshDeadlineData();
}

function refreshDeadlineData(){
	loadDeadlineData("#overdueDeadline", URL_TASKS_LIST + '?assigs.resourceId=tmp_1&end=$lte' + (new Date()).getTime());
	loadDeadlineData("#upcommingsDeadline", URL_TASKS_LIST + '?assigs.resourceId=tmp_1&end=$btn' + (new Date()).getTime() + '|' + ((new Date()).getTime() + 3600000 * 24 * 7));
	loadDeadlineData("#toBeStartedDeadline", URL_TASKS_LIST + '?assigs.resourceId=tmp_1&start=$btn' + (new Date()).getTime() + '|' + ((new Date()).getTime() + 3600000 * 24 * 7));
}
function loadDeadlineData(sectionWidget, dataUrl){

	loadDataFromServer(dataUrl, function(deadlineList){
		//alert(JSON.stringify(deadlineList));

		$(sectionWidget).empty();

		var sectionHtml = '';

		for (i = 0; i < deadlineList.length; i ++)
		{
			if (! deadlineList[i].hasChild){

				sectionHtml +=
						  '<h5>'
							+ '<a href="javascript:openTaskEditorView(\'' + deadlineList[i]._id + '\');">'
							+ moment(deadlineList[i].start).format("L")
							+ ' - ' + moment(deadlineList[i].end).format("L")
							+ '</a>'
						+ '</h5>'

						+ '<ul>'
							+ '<li>'
							+ ' <a href="javascript:initWorkspaceGanttView(\'' + deadlineList[i].projectId + '\');">' + deadlineList[i].projectName + '</a>'
							+ ' | '
							+ ' <a href="javascript:openTaskEditorView(\'' + deadlineList[i]._id + '\');">' + deadlineList[i].name + '</a>'
							+ '</li>'
						+ '</ul>';
			}

		}

		$(sectionWidget).append(sectionHtml);

	});
}
