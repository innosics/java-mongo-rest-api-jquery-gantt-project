function initIdfForm(){
	
	$('.gantt').hide();
	$('.nongantt').show();

	$("#mainWorkspace").empty();
	resetToolBar();

	jQuery.get("templates/innosics-idf-template-1.0.html", function (data){
		$("#mainWorkspace").append(data);
		$( "#deadline-date" ).datepicker();

		$('#disclosure-deadline').change(function() {
			if($(this).is(":checked")) {
				$('#deadline-date').visible();
			}else{
				$('#deadline-date').invisible();
			}
		});
		$('#in-product').change(function() {
			if($(this).is(":checked")) {
				$('#products').visible();
				$('#products-list').visible();
			}else{
				$('#products').invisible();
				$('#products-list').invisible();
			}
		});
		$('#standard-related').change(function() {
			if($(this).is(":checked")) {
				$('#standards').visible();
				$('#standards-list').visible();
			}else{
				$('#standards').invisible();
				$('#standards-list').invisible();
			}
		});

		var products = [
			"ActionScript",
			"AppleScript",
			"Asp",
			"BASIC",
			"C",
			"C++",
			"Clojure",
			"COBOL",
			"ColdFusion",
			"Erlang",
			"Fortran",
			"Groovy",
			"Haskell",
			"Java",
			"JavaScript",
			"Lisp",
			"Perl",
			"PHP",
			"Python",
			"Ruby",
			"Scala",
			"Scheme"
		];

		$( "#inventors" ).autocomplete({
			source: products,
			select: function( event, ui ) {
				$('#inventors-list-ul').append('<li>' + ui.item.value + '</li>');
			}
		});

		$( "#products" ).autocomplete({
			source: products,
			select: function( event, ui ) {
				$('#products-list-ul').append('<li>' + ui.item.value + '</li>');
			}
		});

		$( "#standards" ).autocomplete({
			source: products,
			select: function( event, ui ) {
				$('#standards-list-ul').append('<li>' + ui.item.value + '</li>');
			}
		});
		
		appendToolBar('idf-savedraft', 'Save Draft', function(){
			alert('Save Draft');
		});
		appendToolBar('idf-submit', 'Submit', function(){
			alert('Submit');
		}, true);
	});
}

