function saveChanges() {
        // Get a value saved in a form.
        var lineSpacesRadio = document.getElementsByName('linespaces');
		var stepDefsRadio = document.getElementsByName('methodNames');
		var lineSpacesSetting;
		var stepDefSetting;
		
		for (var i = 0, length = lineSpacesRadio.length; i < length; i++) {
			if (lineSpacesRadio[i].checked) {
				// do whatever you want with the checked radio
				lineSpacesSetting = lineSpacesRadio[i].value;
				// only one radio can be logically checked, don't check the rest
				break;
			}
		}
		
		for (var i = 0, length = stepDefsRadio.length; i < length; i++) {
			if (stepDefsRadio[i].checked) {
				// do whatever you want with the checked radio
				stepDefSetting = stepDefsRadio[i].value;
				// only one radio can be logically checked, don't check the rest
				break;
			}
		}
		
		var settingsChosen = {settings: {LineSpacesSetting:lineSpacesSetting, StepDefSetting:stepDefSetting}};
		
        // Save it using the Chrome extension storage API.
        chrome.storage.sync.set(settingsChosen, function() {
			chrome.storage.sync.get("settings", function(data) {
			console.log("LineSpacesSetting", data.settings.LineSpacesSetting);
			tidyup(data);
		});
		});

		
		//chrome.storage.sync.set({'StepDefSetting': stepDefSetting}, tidyup);
		
		//var settings = document.getElementById('settings');
		//settings.style.display = 'none';
}

function loadSettings() {

	var lineSpacesRadio = document.getElementsByName('linespaces');
	//var stepDefsRadio = document.getElementsByName('methodNames');
		
	chrome.storage.sync.get("LineSpacesSetting", function (obj) {
		for (var i = 0, length = lineSpacesRadio.length; i < length; i++) {
			if (lineSpacesRadio[i].value == obj.LineSpacesSetting) {
				// do whatever you want with the checked radio
				lineSpacesRadio[i].checked = true;
				// only one radio can be logically checked, don't check the rest
				break;
			}
		}
    });
	
	//chrome.storage.sync.get("StepDefSetting", function (obj) {
     //   for (var i = 0, length = stepDefsRadio.length; i < length; i++) {
	//		if (stepDefsRadio[i].value == obj.StepDefSetting) {
	//			// do whatever you want with the checked radio
	//			stepDefsRadio[i].checked = true;
	//			// only one radio can be logically checked, don't check the rest
	//			break;
	//		}
	//	}
    //});
}