function initMyTasksView(){

	$('.gantt').hide();
	$('.nongantt').show();

	$("#mainWorkspace").empty();
	resetToolBar();

	initTasksViewWidgit();

	initTasksDataTable();

	loadMyTaksData();

	appendToolBar('Create', 'Create', function(){
		initTaskEditorWidget();
	}, true);

	$("#mainWorkspace").resize();

	actionStack[actionStack.length] = function() { initMyTasksView(); };
}

function loadMyTaksData(){
	loadDataFromServer(URL_TASKS_LIST, function(myTasksListData){
		bindTasksData(myTasksListData);
	});
}

function openTaskEditorView(taskId){
	//alert("taskId: " + taskId);
	loadDataFromServer(URL_TASK_FETCH + taskId, function(taskData){
		initTaskEditorWidget (taskData);
	});
}

function initTaskEditorWidget (task) {
	//alert(JSON.stringify(task));
	//make task editor
	var taskEditor = $.JST.createFromTemplate({}, "TASK_EDITOR");

	if (task){
		taskEditor.find("#code").attr("disabled", true);
		taskEditor.find("#name").attr("disabled", true);
		taskEditor.find("#description").attr("readOnly", true);
		taskEditor.find("#start").attr("disabled", "true");
		taskEditor.find("#end").attr("disabled", "true");
		taskEditor.find("#duration").attr("disabled", true);
		taskEditor.find("#startIsMilestone").attr("disabled", true);
		taskEditor.find("#endIsMilestone").attr("disabled", true);

		taskEditor.find("#name").val(task.name);
		taskEditor.find("#description").val(task.description);
		taskEditor.find("#code").val(task.code);
		taskEditor.find("#progress").val(task.progress ? parseFloat(task.progress) : 0);
		taskEditor.find("#status").attr("status", task.status);

		if (task.startIsMilestone)
			taskEditor.find("#startIsMilestone").attr("checked", true);
		if (task.endIsMilestone)
			taskEditor.find("#endIsMilestone").attr("checked", true);

		taskEditor.find("#duration").val(task.duration);
		var startDate = taskEditor.find("#start");
		startDate.val(new Date(task.start).format());
		//start is readonly in case of deps
		if (task.depends) {
			startDate.attr("readonly", "true");
		} else {
			startDate.removeAttr("readonly");
		}

		taskEditor.find("#end").val(new Date(task.end).format());
	}else{
		taskEditor.find("#progress").val(0);
		taskEditor.find("#status").attr("status", "STATUS_ACTIVE");

		taskEditor.find("#duration").val(1);
		var startDate = taskEditor.find("#start").val(new Date().format());
		var startDate = taskEditor.find("#end").val(new Date().format());
	}


	//define start end callbacks
	function startChangeCallback(date) {
		var dur = parseInt(taskEditor.find("#duration").val());
		date.clearTime();
		taskEditor.find("#end").val(new Date(computeEndByDuration(date.getTime(), dur)).format());
	}

	function endChangeCallback(end) {
		var start = Date.parseString(taskEditor.find("#start").val());
		end.setHours(23, 59, 59, 999);

		if (end.getTime() < start.getTime()) {
			var dur = parseInt(taskEditor.find("#duration").val());
			start = incrementDateByWorkingDays(end.getTime(), -dur);
			taskEditor.find("#start").val(new Date(computeStart(start)).format());
		} else {
			taskEditor.find("#duration").val(recomputeDuration(start.getTime(), end.getTime()));
		}
	}

	if (task && (!task.canWrite)) {
	//if (false) {
		taskEditor.find("input,textarea").attr("readOnly", true);
		taskEditor.find("input:checkbox,select").attr("disabled", true);
		taskEditor.find("#saveButton").remove();
	} else {
		//bind dateField on dates
		taskEditor.find("#start").click(function () {
			$(this).dateField({
				inputField:$(this),
				callback:  startChangeCallback
			});
		}).blur(function () {
			var inp = $(this);
			if (!Date.isValid(inp.val())) {
				alert(GanttMaster.messages["INVALID_DATE_FORMAT"]);
				inp.val(inp.getOldValue());
			} else {
				startChangeCallback(Date.parseString(inp.val()))
			}
		});
		//bind dateField on dates
		taskEditor.find("#end").click(function () {
			$(this).dateField({
				inputField:$(this),
				callback:  endChangeCallback
			});
		}).blur(function () {
			var inp = $(this);
			if (!Date.isValid(inp.val())) {
				alert(GanttMaster.messages["INVALID_DATE_FORMAT"]);
				inp.val(inp.getOldValue());
			} else {
				endChangeCallback(Date.parseString(inp.val()))
			}
		});

		//bind blur on duration
		taskEditor.find("#duration").change(function () {
			var start = Date.parseString(taskEditor.find("#start").val());
			var el = $(this);
			var dur = parseInt(el.val());
			dur = dur <= 0 ? 1 : dur;
			el.val(dur);
			taskEditor.find("#end").val(new Date(computeEndByDuration(start.getTime(), dur)).format());
		});

		taskEditor.find("#status").click(function () {
			var tskStatusChooser = $(this);
			var changer = $.JST.createFromTemplate({}, "CHANGE_STATUS");
			if (task) {
				changer.find("[status=" + task.status + "]").addClass("selected");
			}
			changer.find(".taskStatus").click(function (e) {
				e.stopPropagation();
				tskStatusChooser.attr("status", $(this).attr("status"));
				changer.remove();
			});
			tskStatusChooser.oneTime(3000, "hideChanger", function () {
				changer.remove();
			});
			tskStatusChooser.after(changer);
		});
	}

	$("body").append('<div id="taskEditorWidget" title="Task Editor"></div>');
	$("#taskEditorWidget").append(taskEditor);
	$("#taskEditorWidget").bringToFront();

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

	$("#taskEditorWidget").dialog({
		resizable: false,
		modal: true,
		width:optimizedDialogWidth,
		height:optimizedDialogHeight,
		buttons: {
			"Save": function() {
				// maybe need to get task again because in case of rollback old task is lost
				if (!task){
					task = {};
				}

				task.name = taskEditor.find("#name").val();

				task.description = taskEditor.find("#description").val();
				task.code = taskEditor.find("#code").val();

				task.progress = parseFloat(taskEditor.find("#progress").val());
				task.duration = parseInt(taskEditor.find("#duration").val());
				task.startIsMilestone = taskEditor.find("#startIsMilestone").is(":checked");
				task.endIsMilestone = taskEditor.find("#endIsMilestone").is(":checked");

				//change dates
				var sd = Date.parseString(taskEditor.find("#start").val()).getTime();
				var ed = Date.parseString(taskEditor.find("#end").val()).getTime() + (3600000 * 24);
				var st = taskEditor.find("#status").attr("status");
				if (st == '') st = 'ACTIVE';
				//alert("save task-----start: " + sd + "   end: " + ed + "  status: " + st);
				task.start = sd;
				task.end = ed;
				task.status = st;

				alert("save task _id: " + task._id);
				alert(JSON.stringify(task));
				saveDataOnServer(URL_TASK_SAVE, task, function(){
					loadMyTaksData();
					$("#taskEditorWidget").dialog( "close" );
				});
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
			$("#taskEditorWidget").remove();
		}
	});
}


function loadTaskAssignmentDecorator (assigTr, assignResourceId, assignRoleId){
	var resEl = assigTr.find("[name=resourceId]");
	var resources =
	[
		{"id":"marissa@innosics.com","name":"Marissa"},
		{"id":"paul","name":"Paul"}
	];

	for (var i in resources) {
	var res = resources[i];
	var opt = $("<option>");
	opt.val(res.id).html(res.name);

	if (assignResourceId == res.id)
		opt.attr("selected", "true");
		resEl.append(opt);
	}

	var roleEl = assigTr.find("[name=roleId]");
	var roles =
	[
		{"id":"pmr","name":"Project Manager"},
		{"id":"mem","name":"Worker"},
		{"id":"shr","name":"Stakeholder"}
	];

	for (var i in roles) {
		var role = roles[i];
		var optr = $("<option>");
		optr.val(role.id).html(role.name);
		if (assignRoleId == role.id)
			optr.attr("selected", "true");
		roleEl.append(optr);
	}

	//if(taskAssig.task.master.canWrite && taskAssig.task.canWrite){
	assigTr.find(".delAssig").click(function() {
		var tr = $(this).closest("[assigId]").fadeOut(200, function() {
			$(this).remove();
		});
	});
}


