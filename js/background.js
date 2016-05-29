chrome.app.runtime.onLaunched.addListener(function(launchData) {
	var window = chrome.app.window.create('index.html', {
	},function(createdWindow){
		createdWindow.maximize();
		createdWindow.contentWindow.launchData = launchData;
	});
});