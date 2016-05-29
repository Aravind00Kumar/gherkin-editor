$(function () {
	$(".tabs-menu a").click(function(event) {
		event.preventDefault();
		$(this).parent().addClass("current");
		$(this).parent().siblings().removeClass("current");
		var tab = $(this).attr("href");
		$(".tab-content").not(tab).css("display", "none");
		$(tab).fadeIn();
		javaStepDefsCodeMirror.refresh();
		chrome.storage.sync.get("settings", function(data) {
			console.log("LineSpacesSetting", data.settings.LineSpacesSetting);
			tidyup(data);
		});
	});
	
});