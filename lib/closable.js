define(["jquery", "underscore"], function($, _) {
	$('body').on('click', '.u-closable-close', function(e) {
		$(e.currentTarget).closest('.u-closable').addClass('u-isHidden');
	});
});