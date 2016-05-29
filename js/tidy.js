var untransformedGherkin = '';
var transformedGherkin = '';
var _timer = 0;
var _unsavedChangesTimer = 0;
var addedLength = 0;
var initialLength = 0;

var tableRowIndent = "    ";
var inputCodeMirror;
var outputCodeMirror

function tidyup(settings) {
	getGherkinToTransform();
	initialiseTranformedGherkin();
    removeWhitespaceFromLineStart();
	for(i=0; i<inputCodeMirror.lineCount(); i++){
		inputCodeMirror.removeLineClass(i, "background");
	}
	generateStepDefs(settings);
	generateRubyStepDefs(settings);
	generateJSStepDefs(settings);
	checkForSyntaxErrors();
	indentSteps();
	indentExamples();
	indentBackground();
	if(settings.settings.LineSpacesSetting == "remove")
		removeDoubleLineSpacing();
	formatTables();
	var auto = document.getElementById('autoApply')
	removeFeatureIndentation();
	outputTransformedGherkin();
}

function editFind(){
	inputCodeMirror.execCommand("find");
}

function editFindNext(){
	inputCodeMirror.execCommand("findNext");
}

function editFindPrev(){
	inputCodeMirror.execCommand("findPrev");
}

function editReplace(){
	inputCodeMirror.execCommand("replace");
}

function editReplaceAll(){
	inputCodeMirror.execCommand("replaceAll");
}

function insertBasicFramework(){
	var basicFramework = "Feature: \n" +
				"As a \n" +
				"I want \n" +
				"So that \n\n" +
				"  Scenario: \n";
	inputCodeMirror.replaceRange(basicFramework, inputCodeMirror.getCursor());
}

function launchSupport() {
	window.open("mailto:aravindkumarmail@gmail.com?Subject=Gherkin%20Editor%20Support");
}

function launchReview() {
	window.open("mailto:aravindkumarmail@gmail.com?Subject=Gherkin%20Editor%20Review");
}

// function launchRelated() {
// 	window.open("https://chrome.google.com/webstore/detail/pretty-gherkin/blemhogdenfkkojlpghcinocbfjheioc");
// }

function insertNewScenario(){
	var basicFramework = "  Scenario: \n" +
				"    Given \n" +
				"     When \n" +
				"     Then \n\n";
	inputCodeMirror.replaceRange(basicFramework, inputCodeMirror.getCursor());
}

function insertNewScenarioOutline(){
	var basicFramework = "  Scenario Outline: \n" +
				"    Given \n" +
				"     When \n" +
				"     Then \n\n" +
				"  Example: \n\n";
	inputCodeMirror.replaceRange(basicFramework, inputCodeMirror.getCursor());
}

window.onload = function() {

	//chrome.storage.sync.clear(function() {


			chrome.storage.sync.get("settings", function(data) {

				var lsRemoveChecked = "";
				var lsKeepChecked = "";
				var camelCaseChecked = "";
				var underscoreChecked = "";

				if(data.settings == undefined){
					var settingsChosen = {settings: {LineSpacesSetting:'remove', StepDefSetting:'underscore'}};

					// Save it using the Chrome extension storage API.
					chrome.storage.sync.set(settingsChosen, function() {
						chrome.storage.sync.get("settings", function(data) {
						console.log("LineSpacesSetting Default", data.settings.LineSpacesSetting);
						console.log("StepDefSetting Default", data.settings.StepDefSetting);
						});
					});

				}
			});

	//});

	vex.defaultOptions.className = 'vex-theme-default';
	var inputGherkin = document.getElementById("inputgherkin");
	inputCodeMirror = CodeMirror.fromTextArea(inputGherkin,{
		lineNumbers: true,
		pollInterval: 300,
		viewportMargin: Infinity,
		extraKeys: {
			"Ctrl-Enter": function(instance) { autoApply(); },
/* 			"Ctrl-S": function(instance) { saveFile(); },
			"Ctrl-Alt-S": function(instance) { saveFileAs(); },
			"Ctrl-O": function(instance) { openFile(); },
			"Ctrl-N": function(instance) { createNewFile(); }, */
			"Shift-Ctrl-T": function(instance) { insertBasicFramework(); },
			"Shift-Ctrl-S": function(instance) { insertNewScenario(); },
			"Shift-Ctrl-O": function(instance) { insertNewScenarioOutline(); }
		}
	});

	var outputGherkin = document.getElementById("outputgherkin");
	outputCodeMirror = CodeMirror.fromTextArea(outputGherkin,{
		lineNumbers: true,
		readOnly: true
	});

	var javastepsOutput = document.getElementById("javasteps");
	javaStepDefsCodeMirror = CodeMirror.fromTextArea(javastepsOutput,{
		lineNumbers: true,
		mode:  "text/x-java",
		readOnly: true
	});

	var rubystepsOutput = document.getElementById("rubysteps");
	rubyStepDefsCodeMirror = CodeMirror.fromTextArea(rubystepsOutput,{
		lineNumbers: true,
		mode:  "text/x-ruby",
		readOnly: true
	});

	var jsstepsOutput = document.getElementById("jssteps");
	jsStepDefsCodeMirror = CodeMirror.fromTextArea(jsstepsOutput,{
		lineNumbers: true,
		mode:  "text/javascript",
		readOnly: true
	});

	inputCodeMirror.on("change",function(cm,obj){
		DelayedCallMe();
    });

	inputCodeMirror.on("keypress",function(cm,obj){
		DelayedUnsavedChangesLog();
	});


	var tidyMenuItem=document.getElementById("tidyMenuItem");
	tidyMenuItem.addEventListener("click", autoApply);

	var versionInfo=document.getElementById("versionInfo");
	versionInfo.addEventListener("click", showVersionInfo);

	var viewSettings=document.getElementById("settingsOption");
	viewSettings.addEventListener("click", displaySettings);

	var supportLink=document.getElementById("supportLink");
	supportLink.addEventListener("click", launchSupport);

	// var relatedAppsLink=document.getElementById("relatedAppsLink");
	// relatedAppsLink.addEventListener("click", launchRelated);

	// var promotionLink=document.getElementById("promotion");
	// promotionLink.addEventListener("click", launchRelated);

	var reviewLink=document.getElementById("reviewLink");
	reviewLink.addEventListener("click", launchReview);

	var editFindLink=document.getElementById("edit_find");
	editFindLink.addEventListener("click", editFind);

	var editFindNextLink=document.getElementById("edit_find_next");
	editFindNextLink.addEventListener("click", editFindNext);

	var editFindPrevLink=document.getElementById("edit_find_previous");
	editFindPrevLink.addEventListener("click", editFindPrev);

	var editReplaceLink=document.getElementById("edit_replace");
	editReplaceLink.addEventListener("click", editReplace);

	var editReplaceAllLink=document.getElementById("edit_replace_all");
	editReplaceAllLink.addEventListener("click", editReplaceAll);

	var insertFrameworkButton=document.getElementById("insertFramework");
	insertFrameworkButton.addEventListener("click", insertBasicFramework);

	var insertScenarioButton=document.getElementById("insertScenario");
	insertScenarioButton.addEventListener("click", insertNewScenario);

	var insertScenarioOutlineButton=document.getElementById("insertScenarioOutline");
	insertScenarioOutlineButton.addEventListener("click", insertNewScenarioOutline);

	var tableToolButton = document.getElementById("tableInsert")
	tableToolButton.addEventListener("click", insertTable);

	var insertRowAfterButton = document.getElementById("insertRowAfter")
	insertRowAfterButton.addEventListener("click", insertRowAfter);

	var insertColAfterButton = document.getElementById("insertColAfter")
	insertColAfterButton.addEventListener("click", insertColumn);

	var pageContent = document.getElementById("pageContent");
	var rowViewButton = document.getElementById("rowView")
	rowViewButton.addEventListener("click", rowView);

	var colViewButton = document.getElementById("colView")
	colViewButton.addEventListener("click", colView);

	shortcut.add("Ctrl+Alt+S",function() {
		saveFileAs();
	});

	shortcut.add("Ctrl+S",function() {
		saveFile();
	});

	shortcut.add("Ctrl+O",function() {
		openFile();
	});

	shortcut.add("Ctrl+N",function() {
		createNewFile();
	});

	shortcut.add("Ctrl+F",function() {
		editFind();
	});

	shortcut.add("Ctrl+G",function() {
		editFindNext();
	});

	shortcut.add("Shift+Ctrl+G",function() {
		editFindPrev();
	});

	shortcut.add("Shift+Ctrl+F",function() {
		editReplace();
	});

	shortcut.add("Shift+Ctrl+R",function() {
		editReplaceAll();
	});

}

function rowView() {
	if (hasClass(pageContent, 'h') === false) {
		addClass(pageContent, 'h')
	}
}

function colView() {
	removeClass(pageContent, 'h')
}

function hasClass(el, className) {
	if (el.classList)
		return el.classList.contains(className)
	else
		return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'))
}

function addClass(el, className) {
	if (el.classList)
		el.classList.add(className)
	else if (!hasClass(el, className)) el.className += " " + className
}

function removeClass(el, className) {
	if (el.classList)
		el.classList.remove(className)
	else if (hasClass(el, className)) {
		var reg = new RegExp('(\\s|^)' + className + '(\\s|$)')
		el.className = el.className.replace(reg, ' ')
	}
}

function showVersionInfo() {
	vex.dialog.alert("<h1>Version 0.1.1</h1>" +
						"<p>This app is a customized version of Tidy Gherkin application</p>" +
						"<p>New features </p>" +
						"<ul>" +
						"<li><p>Support for auto-generation of Javascript step definitions.</p></li>" +
						"<li><p>New horizontal and vertical views.</p></li>" +
						"</ul>");
	return;
}

function insertTable() {
	var table = "";
	var rows = document.getElementById("rows").value;
	var cols = document.getElementById("cols").value;

	if(rows < 0 || cols < 0 || cols == "" || rows == ""){
		vex.dialog.alert("<h1>Scenario: Inserting a table</h1>" +
							"<p>Given there is no valid row or column values</p>" +
							"<p>When the user attempts to insert a table</p>" +
							"<p>Then the user is provided with an error message</p>" +
							"<p>And the table is not inserted</p>");
		return;
	}

	if(rows > 50 || cols > 50){
		vex.dialog.alert("<h1>Scenario: Inserting large tables</h1>" +
							"<p>Given there are row and column values entered</p>" +
							"<p>And either value is above 50</p>" +
							"<p>When the user attempts to insert a table</p>" +
							"<p>Then the user is provided with an error message</p>" +
							"<p>And the table is not inserted</p>");
		return;
	}
	table = "\n";
	for(var row=0; row<rows; row++){
		table += "      |";
		for(var col=0; col<cols; col++){
			table += "  |";
		}
		table += "\n";
	}

	inputCodeMirror.replaceRange(table, inputCodeMirror.getCursor());
}

function insertRowAfter() {
	var start_cursor_pos = inputCodeMirror.getCursor();
	var currentLineText = inputCodeMirror.getLine(start_cursor_pos.line);
	var pipeCount = (currentLineText.split("|").length - 1);

	if(pipeCount > 1){
		var currentLineChars = currentLineText.split("");
		for (index = 0; index < currentLineChars.length; ++index) {
			if(currentLineChars[index] != "|")
				currentLineChars[index] = " ";
		}
		var newLineText = "\n";
		for (index = 0; index < currentLineChars.length; ++index) {
			newLineText += currentLineChars[index];
		}
		inputCodeMirror.setCursor({line: start_cursor_pos.line})
		inputCodeMirror.replaceRange(newLineText, inputCodeMirror.getCursor());
	}
}

function DelayedUnsavedChangesLog() {
    if (_unsavedChangesTimer)
       window.clearTimeout(_unsavedChangesTimer);
      _unsavedChangesTimer = window.setTimeout(function() {
	  var unsavedChanges = {UnsavedChanges:true};

	  // Save it using the Chrome extension storage API.
      chrome.storage.sync.set(unsavedChanges, function() {
		  chrome.storage.sync.get("UnsavedChanges", function(data) {
			console.log("UnsavedChanges", data.UnsavedChanges);
			DelayedCallMe();
		  });
	  });
    }, 500);
}

function DelayedCallMe() {
    if (_timer)
        window.clearTimeout(_timer);
    _timer = window.setTimeout(function() {
		var auto = document.getElementById('autoApply')
		chrome.storage.sync.get("settings", function(data) {
			console.log("LineSpacesSetting", data.settings.LineSpacesSetting);
			console.log("StepDefSetting", data.settings.StepDefSetting);
			tidyup(data);
		});
    }, 500);
}

function autoApply() {
	var start_cursor_pos = inputCodeMirror.getCursor();
	inputCodeMirror.setValue(outputCodeMirror.getValue());
	inputCodeMirror.setCursor({line: start_cursor_pos.line});
}

function autoApplySwitch() {
	var autoapply = document.getElementById('autoApply')
	tidyup();
}

function isValid(fileName) {
	if(fileName.match(/^[\w,\s-]+$/gm) !=null || fileName == "")
		return true;
	else
		return false;
}

function displaySettings(){

	chrome.storage.sync.get("settings", function(data) {

		var lsRemoveChecked = "";
		var lsKeepChecked = "";
		var camelCaseChecked = "";
		var underscoreChecked = "";

		if(data.settings.LineSpacesSetting == "remove"){
			lsRemoveChecked = "checked";
		} else {
			lsKeepChecked = "checked";
		}

		if(data.settings.StepDefSetting == "camelcase"){
			camelCaseChecked = "checked";
		} else {
			underscoreChecked = "checked";
		}

		vex.dialog.open({
			  message: 'Settings',
			  input: "<style>.vex-custom-field-wrapper {\n" +
						"margin: 1em 0;\n" +
						"}\n" +
						".vex-custom-field-wrapper > label {\n" +
						"display: inline-block;\n" +
						"margin-bottom: .2em;\n" +
						"}\n" +
						"</style>\n" +
						"<div class=\"vex-custom-field-wrapper\">\n" +
						"<h1>Tidy Options</h1>\n" +
						"<div class=\"vex-custom-input-wrapper\">\n" +
						"<input type=\"radio\" id=\"removelinespacesradio\" name=\"linespaces\" value=\"remove\" "+lsRemoveChecked+"><label for=\"removelinespacesradio\">Collapse double line spaces</label><br>" +
						"<input type=\"radio\" id=\"keeplinespacesradio\" name=\"linespaces\" value=\"keep\" "+lsKeepChecked+"><label for=\"keeplinespacesradio\">Leave my linespacing alone</label>\n" +
						"</div>\n" +
						"<h1>Java Step Definition Options</h1>\n" +
						"<div class=\"vex-custom-input-wrapper\">\n" +
						"<input type=\"radio\" id=\"underscoreradio\" name=\"methodNames\" value=\"underscore\" "+underscoreChecked+"><label for=\"underscoreradio\">Underscore Separated Method Names</label><br>" +
						"<input type=\"radio\" id=\"camelcaseradio\" name=\"methodNames\" value=\"camelcase\" "+camelCaseChecked+"><label for=\"camelcaseradio\">Camel Case Method Names</label>\n" +
						"</div>\n" +
						"</div>",
			  showCloseButton: false,
			  escapeButtonCloses: false,
			  overlayClosesOnClick: false,
			  callback: function(data) {
				if (data === false) {
				  return console.log('Cancelled');
				}
				saveChanges();
			  }
			});
		});
}

function fileSave() {
	chrome.storage.sync.get("settings", function(data) {
			fileSaveFromMenu(data);
		});
}

function fileSaveFromMenu(settings) {

	untransformedGherkin = inputCodeMirror.getValue();

	if(untransformedGherkin==""){
		vex.dialog.alert("<h1>Scenario: Saving feature files</h1>" +
							"<p>Given there is no input</p>" +
							"<p>When the user attempts to save</p>" +
							"<p>Then the user is provided with an error message</p>" +
							"<p>And the feature file is not saved</p>");
		return;
	} else {

		var saveFile;

		saveFile = function(fileName, callback) {

		  return setTimeout(function() {
			if (isValid(fileName)) {
			  saveTextAsFile(fileName, settings);
			  return callback('success');
			} else {
			  return callback('Please enter a valid filename');
			}
		  });
		};

		vex.dialog.prompt({
		  className: 'vex-theme-default',
		  message: 'Enter your feature file name (without file extension)',
		  input: '<input name="filename" type="text" class="vex-dialog-prompt-input" placeholder="filename" value="" required>',
		  onSubmit: function(event) {
			var $vexContent;
			event.preventDefault();
			event.stopPropagation();
			$vexContent = $(this).parent();
			return saveFile(this.filename.value, function(message) {
			  if (message === 'success') {
				return vex.close($vexContent.data().vex.id);
			  } else {
				vex.dialog.alert("Please enter a valid filename");
				return console.error(message);
			  }
			});
		  }
		});
	}
}

function saveTextAsFile(fileNameValue, settings) {

	tidyup(settings);

	var textToWrite = outputCodeMirror.getValue();;

	var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});
	var fileNameToSaveAs = fileNameValue + ".feature";

	var downloadLink = document.createElement("a");
	downloadLink.download = fileNameToSaveAs;
	downloadLink.innerHTML = "Download File";
	if (window.webkitURL != null)
	{
		// Chrome allows the link to be clicked
		// without actually adding it to the DOM.
		downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
	}
	else
	{
		// Firefox requires the link to be added to the DOM
		// before it can be clicked.
		downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
		downloadLink.onclick = destroyClickedElement;
		downloadLink.style.display = "none";
		document.body.appendChild(downloadLink);
	}

	downloadLink.click();
}

function getGherkinToTransform(){
	untransformedGherkin = inputCodeMirror.getValue();
	initialLength = untransformedGherkin.length;
}

function initialiseTranformedGherkin(){
	transformedGherkin = untransformedGherkin;
}

function removeWhitespaceFromLineStart() {
    transformedGherkin = transformedGherkin.replace(/^[ \t]+/gm, '');
}

function removeDoubleLineSpacing() {
    transformedGherkin = transformedGherkin.replace(/\n{3,}/g, '\n\n');
}

function indentSteps() {
	transformedGherkin = transformedGherkin.replace(/^(Given)(.*)/gm, '  $1$2');
	transformedGherkin = transformedGherkin.replace(/^(When|Then)(.*)/gm, '   $1$2');
	transformedGherkin = transformedGherkin.replace(/^(But|And)(.*)/gm, '    $1$2');
}

function indentExamples() {
	transformedGherkin = transformedGherkin.replace(/^(Examples)[ \t]*:[ \t]*(.*)/gm, '  $1: $2');
}

function indentBackground() {
	transformedGherkin = transformedGherkin.replace(/^(Background)[ \t]*:[ \t]*(.*)/gm, '$1: $2');
}

function outputTransformedGherkin() {
	if(untransformedGherkin != "")
		outputCodeMirror.setValue(transformedGherkin);
	else
		document.getElementById('outputgherkin').value = "";
}

function clearErrors() {
	document.getElementById('errors').innerHTML = "";
}

function removeFeatureIndentation() {
	var linesArray = transformedGherkin.split("\n");

	if(transformedGherkin.indexOf("Feature:") == -1)
		return;
	if(transformedGherkin.indexOf("Background:") == -1){
		var backgroundPresent = false;
		if(transformedGherkin.indexOf("Scenario:") == -1 && transformedGherkin.indexOf("Scenario Outline:") == -1)
			var scenariosPresent = false;
		else
			var scenariosPresent = true;
	}
	else
		var backgroundPresent = true;

	// Process array of lines
	for (var i = 0; i < linesArray.length; i++) {
		if(!backgroundPresent && !scenariosPresent)
			linesArray[i] = linesArray[i].replace(/^[ \t]+/gm, '');
		if(backgroundPresent){
			if(linesArray[i].match(/^[ \t]+Background.*/mg) )
				break;
			linesArray[i] = linesArray[i].replace(/^[ \t]+/gm, '');
		}
		if(scenariosPresent){
			if(linesArray[i].match(/^[ \t]+Scenario.*/mg) ){
				break;
			}
			linesArray[i] = linesArray[i].replace(/^[ \t]+/gm, '');
		}
	}
	transformedGherkin = "";
	for (var n = 0; n < linesArray.length; n++)
		transformedGherkin += linesArray[n] + "\n";
}

function insertColumn() {

	// Find the position of the cursor
	var cursorPosition = inputCodeMirror.getCursor();

	// Is the cursor inside a table?
	if(!isInTable(cursorPosition)){
		return;
	}

	var initial_cursor_pos = inputCodeMirror.getCursor();
	var initial_line_num = initial_cursor_pos.line;
	var initialLineText = inputCodeMirror.getLine(initial_cursor_pos.line);
	var initialPipeCount = (initialLineText.split("|").length - 1);
	var tableStartLine;
	var tableEndLine;

	var currentPipeCount = 0;
	var currentLineText;
	//if we're not on line 1
	if(initial_line_num != 0) {
		var current_line_num = initial_line_num - 1;
		//for every line above the current line to the start
		for(i=current_line_num; i > -1; i--) {
			//if we made it back to the start line
			// currentLineText = input
			// x.getLine(i);
			currentLineText = inputCodeMirror.getLine(i);
			currentPipeCount = (currentLineText.split("|").length - 1);
			//if the current line does not have the same number of pipes as the line we started on...
			if(currentPipeCount != initialPipeCount && currentPipeCount > 0) {
				// the table is not valid for adding another column - all rows must be equal in column length
				console.log("Invalid Table");
				Messenger().post({
				  message: "Table not valid for adding another column - all rows must be equal in column length",
				  type: "error"
				})
				return;
			}
			if(currentPipeCount == 0) {
				//the start of the table is on line x (the current line number + 2)
				tableStartLine = i + 2; // ADD 1 to allow for zero-based line nums, and another 1 because it was the previous line that the table started on
				console.log("Table Start Position is on line " + tableStartLine);
				break;
			}
			if(i == 0) {
				//the table starts on the first line
				console.log("Table Start Position is on line 1");
				tableStartLine = 1;
			}
		}
	} else {
		console.log("Table Start Position is on line 1");
		tableStartLine = 1;
	}

	var tableSize = inputCodeMirror.lineCount();
	if(initial_line_num != tableSize-1) {
		var current_line_num = initial_line_num + 1;
		//for every line above the current line to the start
		for(i=current_line_num; i < tableSize; i++) {
			//if we made it back to the start line
			currentLineText = inputCodeMirror.getLine(i);
			currentPipeCount = (currentLineText.split("|").length - 1);
			//if the current line does not have the same number of pipes
			if(currentPipeCount != initialPipeCount && currentPipeCount > 0) {
				//the table is not valid for adding another column - all rows must be equal in column length
				console.log("Invalid Table");
				Messenger().post({
				  message: "Table not valid for adding another column - all rows must be equal in column length",
				  type: "error"
				})
				return;
			}
			if(currentPipeCount == 0) {
				//the end of the table is on line x (the current line number - 2)
				tableEndLine = i; // LESS 1 because it was the previous line that the table ended on
				console.log("Table End Position is on line " + tableEndLine);
				break;
			}
			if(i == tableSize-1) {
				//the table ends on the last line (minus one for zero based count)
				tableEndLine = tableSize;
				console.log("Table End Position is on line " + tableEndLine);

			}
		}
	} else {
		tableEndLine = initial_line_num + 1;
		console.log("Table End Position is on line " + tableEndLine);
	}

	// find the number of pipes from here until the end of the line
	var userSelectedLineText = inputCodeMirror.getLine(cursorPosition.line);
	var start = {'line': cursorPosition.line, 'ch': cursorPosition.ch}, end = {'line': cursorPosition.line, 'ch': userSelectedLineText.length};
	var textToLineEnd = inputCodeMirror.getRange(start, end);
	var pipesToUserSelectedLineEnd = (textToLineEnd.split("|").length - 1);
	var numPipesToAddAnotherPipeAfter;
	if(pipesToUserSelectedLineEnd == 0) {
		numPipesToAddAnotherPipeAfter = initialPipeCount;

		// if there is non-whitespace after the last pipe...
		if(textToLineEnd.match(/[^\s-]/g) != null || textToLineEnd.length == 0){
			var addPipeToEnd = true;
		}
	} else {
		numPipesToAddAnotherPipeAfter = initialPipeCount - pipesToUserSelectedLineEnd + 1;
	}
	var positionInLineToAddAfter;

	var lineText;
	for(i=tableStartLine-1; i <= tableEndLine-1; i++) {
		lineText = inputCodeMirror.getLine(i);
		// find index of the nth pipe
		if(!addPipeToEnd) {
			positionInLineToAddAfter = nth_occurrence(lineText, '|', numPipesToAddAnotherPipeAfter);
		} else {
			positionInLineToAddAfter = lineText.length;
		}
		// place the cursor just after the necessary pipe
		inputCodeMirror.setCursor(i, positionInLineToAddAfter + 1);
		inputCodeMirror.replaceRange("   |",inputCodeMirror.getCursor());

	}
	// put the cursor back where we found it to start with
	inputCodeMirror.setCursor(initial_cursor_pos);
}

function nth_occurrence(string, char, nth) {
    var first_index = string.indexOf(char);
    var length_up_to_first_index = first_index + 1;

    if (nth == 1) {
        return first_index;
    } else {
        var string_after_first_occurrence = string.slice(length_up_to_first_index);
        var next_occurrence = nth_occurrence(string_after_first_occurrence, char, nth - 1);

        if (next_occurrence === -1) {
            return -1;
        } else {
            return length_up_to_first_index + next_occurrence;
        }
    }
}

function isInTable(cursor){
	var currentLineText = inputCodeMirror.getLine(cursor.line);
	var pipeCount = (currentLineText.split("|").length - 1);
	if(pipeCount<2) {
		return false;
	} else {
		return true;
	}
}

function formatTables() {
	var syntaxError = false;
	clearErrors();
	var currentlyInTable = false;
	var maxColumns = 0;
	var maxRows = 0;

	// Add a new line to the end - need this for it to work properly
	transformedGherkin += "\n";

	// Split the text by the newline char \n
	var linesArray = transformedGherkin.split("\n");

	// Process array of lines
	for (var i = 0; i < linesArray.length; i++) {

		// Get the current line
		var currentLine = linesArray[i];

		// Look for a line with two or more |  << change this to say one or more | with values either side (excluding lines that are commented out)
		if(currentLine.match(/\|.*\|/g) != null && currentLine.match(/^(\s+)?#/) == null){

			// Note the line number of the first match and create a new array for the table rows
			if(!currentlyInTable) {
				var firstTableRowNumber = i;
				var rows = new Array();
				currentlyInTable = true;
			}

			// Create an array to contain the table cell values
			var columns = new Array();

			// Sensible to extract the lines below into a new method?
			// Replace first pipe in table
			currentLine = currentLine.replace(/^[ \t]*\|\s*/gm, '');
			// Remove last pipe and any trailing whitespace
			currentLine = currentLine.replace(/[ \t]*\|\s*$/gm, '');
			// Trim any remaining whitespace around pipes
			currentLine = currentLine.replace(/[ \t]*(\|)[ \t]*/g, '$1');

			// Extract into a new method?
			// Place the words between the pipes on that line into an array e.g. martin, mike, ammar, kartik
			var currentLineValues = currentLine.split("|");
			for (var j = 0; j < currentLineValues.length; j++) {
				columns.push(currentLineValues[j]);
			}
			rows.push(columns);
		}
		// When you come to a line without a pipe
		else if(currentlyInTable){

			// We're now outside of the table
			currentlyInTable = false;

			// Create a new array to hold the values we want our columns widths to be
			var columnSetWidthArray = new Array();

			// How many columns are there?
			maxColumns = rows[0].length;

			// How many rows are there?
			maxRows = rows.length;

			for (var col = 0; col < maxColumns; col++) { 					// For each column
				var columnLengthsArray = new Array(); 						// Find all the cell lengths for the current column
				for (var row = 0; row < maxRows; row++) { 					// For each row

					if(rows[row].length != maxColumns && !syntaxError){
						syntaxError = true;
						document.getElementById('errors').innerHTML = "Problem with table starting at line " + (firstTableRowNumber + 1) +
																			". Check the number of columns.";
						inputCodeMirror.addLineClass(firstTableRowNumber, "background", "syntaxHighlight");
						return;
					}
					columnLengthsArray.push(rows[row][col].length); 	// Get the string length of the cell value
				}
					// Find and record the largest string length for all rows in the current column
					columnSetWidthArray.push(Math.max.apply(Math, columnLengthsArray));
			}

			for (var row = 0; row < maxRows; row++){									// For each row
				var newLineText = tableRowIndent + "| ";								// Create the new line text
				for (var col = 0; col < maxColumns; col++){									// For each column
					var cellValue = rows[row][col];											// Get the cell value
					var callValueLength = cellValue.length;									// Get the cell value length
					var spacesToTrail = columnSetWidthArray[col] - (callValueLength);		// Find the number of spaces to append
					var spaceBuffer = "";													// Build the space buffer
					newLineText += cellValue;
					for (var m = 0; m < spacesToTrail; m++){
						spaceBuffer += " ";
					}
					newLineText += spaceBuffer + " | ";										// Append spaces and close with pipe - trim the last space off later
				}
				linesArray[firstTableRowNumber + row] = newLineText;						// Change the line text in the array
			}
		}
	}
	// Reconstruct the text from the array - is there a function that does this?
	transformedGherkin = "  ";
	for (var n = 0; n < linesArray.length; n++) {
		transformedGherkin += linesArray[n] + "\n  ";
	}
	// Remove trailing new lines
    transformedGherkin = transformedGherkin.slice(0, -6);
}

function checkForSyntaxErrors() {
	clearTips();
	var scenario = [false,0];
	var scenarioOutline = [false,0];
	// Parse through all lines
	var linesArray = transformedGherkin.split("\n");

	// Process array of lines
	for (var i = 0; i < linesArray.length; i++) {
		// Start after first "scenario"

		// Get the current line
		var currentLine = linesArray[i];

		if(currentLine.match(/^Scenario.*/mgi) != null){
			var scenario = [false,0];
			var scenarioOutline = [false,0];
			// Note whether currently in Scenario or Scenario outline
			if(currentLine.indexOf("Scenario Outline:") == -1) {
				if(currentLine.indexOf("Scenario:") == -1) {
					addTip(i,"Scenarios must be specified with either \'Scenario:\' or \'Scenario Outline:\' terminated with a colon.");
				}
				else {
					scenario = [true,i+1];
				}
			}
			else {
				scenarioOutline = [true,i+1];
			}
		}
		if(currentLine.match(/^Feature.*/mgi) != null){
			if(currentLine.indexOf("Feature:") == -1) {
					addTip(i,"Feature must be specified with \'Feature:\' terminated with a colon.");
			}
		}
		if(currentLine.match(/^Background.*/mgi) != null){
			if(currentLine.indexOf("Background:") == -1) {
					addTip(i,"Background must be specified with \'Background:\' terminated with a colon.");
			}
		}
		if(currentLine.match(/^Examples.*/mgi) != null){
			if(scenario[0] || !scenarioOutline[0]){
				addTip(i,"Examples must be part of a \'Scenario Outline\'.");
			}
			if(currentLine.indexOf("Examples:") == -1){
				addTip(i,"Examples must be specified by text \'Examples:\'.");
			}
		}
		if(currentLine.match(/^Given.*/mgi) != null){
			if(currentLine.indexOf("Given") == -1){
				addTip(i,"Correct step keyword is \'Given\'.");
			}
		}
		if(currentLine.match(/^When.*/mgi) != null){
			if(currentLine.indexOf("When") == -1){
				addTip(i,"Correct step keyword is \'When\'.");
			}
		}
		if(currentLine.match(/^Then.*/mgi) != null){
			if(currentLine.indexOf("Then") == -1){
				addTip(i,"Correct step keyword is \'Then\'.");
			}
		}
		if(currentLine.match(/^And.*/mgi) != null){
			if(currentLine.indexOf("And") == -1){
				addTip(i,"Correct step keyword is \'And\'.");
			}
		}
		if(currentLine.match(/^But.*/mgi) != null){
			if(currentLine.indexOf("But") == -1){
				addTip(i,"Correct step keyword is \'But\'.");
			}
		}
	}
}

function clearTips() {
	var myNode = document.getElementById("tips");
	while (myNode.firstChild) {
		myNode.removeChild(myNode.firstChild);
	}
}

function addTip(lineNum, tipText) {
	newTip = document.createElement('p');
    newText = document.createTextNode("Line " + (lineNum+1) + ": " + tipText);
	inputCodeMirror.addLineClass(lineNum, "background", "syntaxHighlight");
    newTip.appendChild(newText);
    document.getElementById('tips').appendChild(newTip);
}

function generateRubyStepDefs(settings) {

	var outputStepDefs = "";

	var givenSteps = "";
	var whenSteps = "";
	var andSteps = "";
	var thenSteps = "";
	var butSteps = "";
	var stepType;
	var stepBody;

	// Split the text by the newline char \n
	var linesArray = transformedGherkin.split("\n");

	// Process array of lines
	for (var i = 0; i < linesArray.length; i++) {

		// Get the current line
		var currentLine = linesArray[i];

		// Look for a line with two or more |  << change this to say one or more | with values either side?
		if(currentLine.match(/^Given .*|^When .*|^Then .*|^And .*|^But .*/gm) != null){

			// split the string at the first space
			var n = currentLine.indexOf(" ");
			stepType = currentLine.substring(0, n);
			stepBody = currentLine.substring(n+1, currentLine.length);

			switch (stepType) {
			case "Given":
				var potentialGivenStep = generateRubyStepDef(stepType, stepBody);
				if(givenSteps.indexOf(potentialGivenStep.methodName) == -1){
					givenSteps += potentialGivenStep.methodWhole;
				}
				break;
			case "When":
				var potentialWhenStep = generateRubyStepDef(stepType, stepBody);
				if(whenSteps.indexOf(potentialWhenStep.methodName) == -1){
					whenSteps += potentialWhenStep.methodWhole;
				}
				break;
			case "Then":
				var potentialThenStep = generateRubyStepDef(stepType, stepBody);
				if(thenSteps.indexOf(potentialThenStep.methodName) == -1){
					thenSteps += potentialThenStep.methodWhole;
				}
				break;
			case "And":
				var potentialAndStep = generateRubyStepDef(stepType, stepBody);
				if(andSteps.indexOf(potentialAndStep.methodName) == -1){
					andSteps += potentialAndStep.methodWhole;
				}
				break;
			case "But":
				var potentialButStep = generateRubyStepDef(stepType, stepBody);
				if(butSteps.indexOf(potentialButStep.methodName) == -1){
					butSteps += potentialButStep.methodWhole;
				}
				break;
			}
		}
	}

	var stepsText = givenSteps + whenSteps + thenSteps + andSteps + butSteps;

	outputStepDefs += stepsText;
	if(stepsText == "") {
		rubyStepDefsCodeMirror.setValue("");
	} else {
		rubyStepDefsCodeMirror.setValue(outputStepDefs);
	}
}

function generateJSStepDefs(settings) {

	var outputStepDefs = "module.exports = function () {\n\n";

	var givenSteps = "";
	var whenSteps = "";
	var andSteps = "";
	var thenSteps = "";
	var butSteps = "";
	var stepType;
	var stepBody;

	// Split the text by the newline char \n
	var linesArray = transformedGherkin.split("\n");

	// Process array of lines
	for (var i = 0; i < linesArray.length; i++) {

		// Get the current line
		var currentLine = linesArray[i];

		// Look for a line with two or more |  << change this to say one or more | with values either side?
		if(currentLine.match(/^Given .*|^When .*|^Then .*|^And .*|^But .*/gm) != null){

			// split the string at the first space
			var n = currentLine.indexOf(" ");
			stepType = currentLine.substring(0, n);
			stepBody = currentLine.substring(n+1, currentLine.length);

			switch (stepType) {
			case "Given":
				var potentialGivenStep = generateJSStepDef(stepType, stepBody);
				if(givenSteps.indexOf(potentialGivenStep.methodName) == -1){
					givenSteps += potentialGivenStep.methodWhole;
				}
				break;
			case "When":
				var potentialWhenStep = generateJSStepDef(stepType, stepBody);
				if(whenSteps.indexOf(potentialWhenStep.methodName) == -1){
					whenSteps += potentialWhenStep.methodWhole;
				}
				break;
			case "Then":
				var potentialThenStep = generateJSStepDef(stepType, stepBody);
				if(thenSteps.indexOf(potentialThenStep.methodName) == -1){
					thenSteps += potentialThenStep.methodWhole;
				}
				break;
			case "And":
				var potentialAndStep = generateJSStepDef(stepType, stepBody);
				if(andSteps.indexOf(potentialAndStep.methodName) == -1){
					andSteps += potentialAndStep.methodWhole;
				}
				break;
			case "But":
				var potentialButStep = generateJSStepDef(stepType, stepBody);
				if(butSteps.indexOf(potentialButStep.methodName) == -1){
					butSteps += potentialButStep.methodWhole;
				}
				break;
			}
		}
	}

	var stepsText = givenSteps + whenSteps + thenSteps + andSteps + butSteps;

	outputStepDefs += stepsText + "};";
	if(stepsText == "") {
		jsStepDefsCodeMirror.setValue("");
	} else {
		jsStepDefsCodeMirror.setValue(outputStepDefs);
	}
}

function generateStepDefs(settings) {

	var outputStepDefs = "package my.package.name" + "\n\n"
					   + "import cucumber.api.PendingException;\n";

	if(settings.settings.StepDefSetting == "camelcase") {
		outputStepDefs += "import cucumber.api.CucumberOptions;" + "\n"
	}

	var givenSteps = "";
	var whenSteps = "";
	var andSteps = "";
	var thenSteps = "";
	var butSteps = "";
	var stepType;
	var stepBody;

	// Split the text by the newline char \n
	var linesArray = transformedGherkin.split("\n");

	// Process array of lines
	for (var i = 0; i < linesArray.length; i++) {

		// Get the current line
		var currentLine = linesArray[i];

		// Look for a line with two or more |  << change this to say one or more | with values either side?
		if(currentLine.match(/^Given .*|^When .*|^Then .*|^And .*|^But .*/gm) != null){

			// split the string at the first space
			var n = currentLine.indexOf(" ");
			stepType = currentLine.substring(0, n);
			stepBody = currentLine.substring(n+1, currentLine.length);

			switch (stepType) {
			case "Given":
				var potentialGivenStep = generateStepDef(stepType, stepBody, settings);
				if(givenSteps.indexOf(potentialGivenStep.methodName) == -1){
					givenSteps += potentialGivenStep.annotation + potentialGivenStep.methodWhole;
				}
				break;
			case "When":
				var potentialWhenStep = generateStepDef(stepType, stepBody, settings);
				if(whenSteps.indexOf(potentialWhenStep.methodName) == -1){
					whenSteps += potentialWhenStep.annotation + potentialWhenStep.methodWhole;
				}
				break;
			case "Then":
				var potentialThenStep = generateStepDef(stepType, stepBody, settings);
				if(thenSteps.indexOf(potentialThenStep.methodName) == -1){
					thenSteps += potentialThenStep.annotation + potentialThenStep.methodWhole;
				}
				break;
			case "And":
				var potentialAndStep = generateStepDef(stepType, stepBody, settings);
				if(andSteps.indexOf(potentialAndStep.methodName) == -1){
					andSteps += potentialAndStep.annotation + potentialAndStep.methodWhole;
				}
				break;
			case "But":
				var potentialButStep = generateStepDef(stepType, stepBody, settings);
				if(butSteps.indexOf(potentialButStep.methodName) == -1){
					butSteps += potentialButStep.annotation + potentialButStep.methodWhole;
				}
				break;
			}
		}
	}
	if(givenSteps != ""){
		outputStepDefs += "import cucumber.api.java.en.Given;\n";
	}
	if(whenSteps != ""){
		outputStepDefs += "import cucumber.api.java.en.When;\n";
	}
	if(thenSteps != ""){
		outputStepDefs += "import cucumber.api.java.en.Then;\n";
	}
	if(andSteps != ""){
		outputStepDefs += "import cucumber.api.java.en.And;\n";
	}
	if(butSteps != ""){
		outputStepDefs += "import cucumber.api.java.en.But;\n";
	}
	outputStepDefs += "import cucumber.api.junit.Cucumber;\n";
	outputStepDefs += "import org.junit.runner.RunWith;\n";

	var stepsText = givenSteps + whenSteps + thenSteps + andSteps + butSteps;

	if(stepsText.indexOf("List<String>") != -1) {
		outputStepDefs += "\nimport java.util.List;\n";
	}

	outputStepDefs += "\n@RunWith(Cucumber.class)";
	if(settings.settings.StepDefSetting == "camelcase") {
		outputStepDefs += "\n@CucumberOptions(snippets = SnippetType.CAMELCASE)";
	}

	outputStepDefs += "\npublic class MyStepDefinitions {\n"
				   + "\n";
	outputStepDefs += stepsText + "}";
	if(stepsText == "") {
		javaStepDefsCodeMirror.setValue("");
	} else {
		javaStepDefsCodeMirror.setValue(outputStepDefs);
	}
}

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function generateStepDefMethodName(str, settings) {

	str = str.replace(/ {2,}/g, " ");

	if(settings.settings.StepDefSetting == "underscore") {
		str = str.trim();
		str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '');
		return str.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, '_').toLowerCase();
	} else {
		str = str.trim();
		return str.replace(/[^a-zA-Z0-9 ]/g, "").toCamelCase();
	}
}

function generateRubyStepDefMethodName(str) {

	str = str.replace(/ {2,}/g, " ");
	str = str.trim();
	str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '');
	str.replace(/[^a-zA-Z0-9 ]/g, "");

	return "/^" + str + "$/";
}

function generateJSStepDefMethodName(str) {

	str = str.replace(/ {2,}/g, " ");
	str = str.trim();
	str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '');
	str.replace(/[^a-zA-Z0-9 ]/g, "");

	return "/^" + str + "$/";
}

String.prototype.toCamelCase = function() {
    return this.replace(/^([A-Z])|\s(\w)/g, function(match, p1, p2, offset) {
        if (p2) return p2.toUpperCase();
        return p1.toLowerCase();
    });
};

function sanitizeArgName(str) {
	str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '');
	return str.replace(/[^a-zA-Z0-9]/g, "").replace(/\s+/g, '').toLowerCase();
}

function generateStepDef(strStepType, strStepBody, settings){
	var outputStepDef = {annotation:"", methodName:"", methodArgs:"", stepType:"", methodWhole:"", methodException: "", methodBody: ""};
	var paramRegexp = /<([^<>]+)>/g;
	var countParams = (strStepBody.match(paramRegexp) || []).length;
	var listStringsRegexp = /\w+\s*,\s*\w+/g;
	var nonListStringsRegexp = /\"([^\",]*)\"/g;
	var stringRegexp = /\"([^\"]*)\"/g;
	var countStringValues = (strStepBody.match(stringRegexp) || []).length;

	var totalTransformsToDo = countParams + countStringValues;
	var transformsCount = 0;

	if(countParams > 0 || countStringValues > 0){
		var match;

		var paramRegexpReplacement = "(.+)";
		var stringRegexpReplacement = "\\\"([^\\\"]*)\\\"";

		var methodStepBody = strStepBody;
		strStepBody = strStepBody.replace(paramRegexp, paramRegexpReplacement);
		strStepBody = strStepBody.replace(stringRegexp, stringRegexpReplacement);

		outputStepDef.annotation = "    @" + strStepType + '("^' + strStepBody + '$")\n';
		outputStepDef.stepType = strStepType;

		var methodArgsString = "(";

		// Process params first
		for(i=0; i<countParams; i++){
			match = paramRegexp.exec(methodStepBody);
			if(i>0){
				methodArgsString += ", ";
			}
			methodArgsString += "String " + sanitizeArgName(match[1]);
			transformsCount ++;
			if(countParams == i+1){
				if((transformsCount < totalTransformsToDo) && transformsCount > 0) {
					methodArgsString += ", ";
				}
				break;
			}
		}

		// Process strings
		var listNum = 1;
		var strNum = 1;
		for(i=0; i<countStringValues; i++){
			match = stringRegexp.exec(methodStepBody);
			if(match != null){
				var stringToCheckForLists = match[1];
				if(i>0){
					methodArgsString += ", ";
				}
				if(stringToCheckForLists.match(listStringsRegexp) != null){
					methodArgsString += "List<String> " +  "list" + (listNum);
					listNum++;
				}
				else {
					methodArgsString += "String " + "strArg" + (strNum);
					strNum++;
				}

				transformsCount ++;
				if(countStringValues == i+1){
					break;
				}
			}
		}

		// Replace strings that do not contain commas (normal strings) with the string "something"
		methodStepBody = methodStepBody.replace(nonListStringsRegexp, "something");
		// Replace the remaining strings (those WITH commas) with an empty string (these are lists)
		methodStepBody = methodStepBody.replace(stringRegexp, "something");
		methodStepBody = methodStepBody.replace(paramRegexp, "");

		outputStepDef.methodName = generateStepDefMethodName(methodStepBody, settings);
		outputStepDef.methodArgs = methodArgsString += ")";
		outputStepDef.methodException = " throws Throwable ";
		outputStepDef.methodBody = "{\n        throw new PendingException();\n    }\n\n";
		outputStepDef.methodWhole = "    public void " + outputStepDef.methodName
		                                               + outputStepDef.methodArgs
													   + outputStepDef.methodException
													   + outputStepDef.methodBody;
	}
	else {
		outputStepDef.annotation += "    @" + strStepType + '("^' + escapeRegExp(strStepBody) + '$")\n';

		outputStepDef.methodName = generateStepDefMethodName(strStepBody, settings);
		outputStepDef.methodArgs = "()";
		outputStepDef.methodException = " throws Throwable ";
		outputStepDef.methodBody = "{\n        throw new PendingException();\n    }\n\n";
		outputStepDef.methodWhole = "    public void " + outputStepDef.methodName
		                                               + outputStepDef.methodArgs
													   + outputStepDef.methodException
													   + outputStepDef.methodBody;
	}
	return outputStepDef;
}

function generateRubyStepDef(strStepType, strStepBody){
	var outputStepDef = {methodName:"", methodArgs:"", stepType:"", methodWhole:"", methodBody: ""};
	var paramRegexp = /<([^<>]+)>/g;
	var countParams = (strStepBody.match(paramRegexp) || []).length;
	var listStringsRegexp = /\w+\s*,\s*\w+/g;
	var nonListStringsRegexp = /\"([^\",]*)\"/g;
	var stringRegexp = /\"([^\"]*)\"/g;
	var countStringValues = (strStepBody.match(stringRegexp) || []).length;

	var totalTransformsToDo = countParams + countStringValues;
	var transformsCount = 0;

	outputStepDef.stepType = strStepType;

	if(countParams > 0 || countStringValues > 0){
		var match;

		var paramRegexpReplacement = "(.+)";
		var stringRegexpReplacement = "\\\"([^\\\"]*)\\\"";

		var methodStepBody = strStepBody;
		strStepBody = strStepBody.replace(paramRegexp, paramRegexpReplacement);
		strStepBody = strStepBody.replace(stringRegexp, stringRegexpReplacement);

		var methodArgsString = "|";

		// Process params first
		for(i=0; i<countParams; i++){
			match = paramRegexp.exec(methodStepBody);
			if(i>0){
				methodArgsString += ", ";
			}
			methodArgsString += sanitizeArgName(match[1]);
			transformsCount ++;
			if(countParams == i+1){
				if((transformsCount < totalTransformsToDo) && transformsCount > 0) {
					methodArgsString += ", ";
				}
				break;
			}
		}

		// Process strings
		var listNum = 1;
		var strNum = 1;
		for(i=0; i<countStringValues; i++){
			match = stringRegexp.exec(methodStepBody);
			if(match != null){
				var stringToCheckForLists = match[1];
				if(i>0){
					methodArgsString += ", ";
				}
				methodArgsString += sanitizeArgName(match[1]);
				strNum++;

				transformsCount ++;
				if(countStringValues == i+1){
					break;
				}
			}
		}

		outputStepDef.methodName = generateRubyStepDefMethodName(strStepBody);
		outputStepDef.methodArgs = methodArgsString += "|\n";
		outputStepDef.methodBody = "    # do something\n";
		outputStepDef.methodWhole = outputStepDef.stepType + " " + outputStepDef.methodName
										   + " do "
		                                   + outputStepDef.methodArgs
										   + outputStepDef.methodBody
										   + "end\n\n";
	}
	else {
		outputStepDef.methodName = generateRubyStepDefMethodName(strStepBody);
		outputStepDef.methodArgs = "";
		outputStepDef.methodBody = "    # do something\n";
		outputStepDef.methodWhole = outputStepDef.stepType + " " + outputStepDef.methodName
													   + " do \n"
		                                               + outputStepDef.methodArgs
													   + outputStepDef.methodBody
													   + "end\n\n"
	}
	return outputStepDef;
}

function generateJSStepDef(strStepType, strStepBody){
	var outputStepDef = {methodName:"", methodArgs:"", stepType:"", methodWhole:"", methodBody: ""};
	var paramRegexp = /<([^<>]+)>/g;
	var countParams = (strStepBody.match(paramRegexp) || []).length;
	var listStringsRegexp = /\w+\s*,\s*\w+/g;
	var nonListStringsRegexp = /\"([^\",]*)\"/g;
	var stringRegexp = /\"([^\"]*)\"/g;
	var countStringValues = (strStepBody.match(stringRegexp) || []).length;

	var totalTransformsToDo = countParams + countStringValues;
	var transformsCount = 0;

	outputStepDef.stepType = strStepType;

	if(countParams > 0 || countStringValues > 0){
		var match;

		var paramRegexpReplacement = "(.+)";
		var stringRegexpReplacement = "\\\"([^\\\"]*)\\\"";

		var methodStepBody = strStepBody;
		strStepBody = strStepBody.replace(paramRegexp, paramRegexpReplacement);
		strStepBody = strStepBody.replace(stringRegexp, stringRegexpReplacement);

		var methodArgsString = ", function (";

		// Process params first
		for(i=0; i<countParams; i++){
			match = paramRegexp.exec(methodStepBody);
			if(i>0) {
				methodArgsString += ", ";
			}
			methodArgsString += sanitizeArgName(match[1]);
			transformsCount ++;
			if(countParams == i+1){
				if((transformsCount < totalTransformsToDo) && transformsCount > 0) {
					methodArgsString += ", ";
				}
				methodArgsString += ", callback";
				break;
			}
		}

		// Process strings
		var listNum = 1;
		var strNum = 1;
		for(i=0; i<countStringValues; i++){
			match = stringRegexp.exec(methodStepBody);
			if(match != null){
				var stringToCheckForLists = match[1];
				if(i>0){
					methodArgsString += ", ";
				}
				methodArgsString += sanitizeArgName(match[1]);
				strNum++;

				transformsCount ++;
				if(countStringValues == i+1){
					methodArgsString += ", callback";
					break;
				}
			}
		}

		outputStepDef.methodName = generateJSStepDefMethodName(strStepBody);
		outputStepDef.methodArgs = methodArgsString += ") {\n";
		outputStepDef.methodBody = "    callback.pending();\n";
		outputStepDef.methodWhole = "  this." + outputStepDef.stepType + "(" + outputStepDef.methodName
		                   + outputStepDef.methodArgs
										   + outputStepDef.methodBody
										   + "  });\n\n";
	}
	else {
		outputStepDef.methodName = generateJSStepDefMethodName(strStepBody);
		outputStepDef.methodArgs = ", function (callback) {\n";
		outputStepDef.methodBody = "    callback.pending();\n";
		outputStepDef.methodWhole = "  this." + outputStepDef.stepType + "(" + outputStepDef.methodName
                             + outputStepDef.methodArgs
													   + outputStepDef.methodBody
													   + "  });\n\n"
	}
	return outputStepDef;
}
