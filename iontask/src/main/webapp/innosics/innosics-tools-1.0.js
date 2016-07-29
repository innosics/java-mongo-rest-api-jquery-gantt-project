function appendToolBar(id, text, func, isSpecial){
	$('#toolBar').append('<li><input style="width:120px" type="button" id="' + id + '" value="' + text + '"' + (isSpecial? 'class="special"':'') + ' /></li>');
	$('#' + id).click(function() {
		func();
	});
}
function resetToolBar(){
	$('#toolBar').empty();
}

