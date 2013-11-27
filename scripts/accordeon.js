define(["jquery", "underscore"], function($, _) {
	var Accordeon = function(container, sizes) {
		var $container = $(container);
		sizes = _(sizes || {}).defaults({ normal: 250, small: 100, full: 700 });

		if ($container.find('.accordeon__element.accordeon__element--current').length) {
			$container.find('.accordeon__element').not('.accordeon__element--current').stop().css({ width: sizes.small + 'px' }, 300 );
		}

		$container.find('.accordeon__element').on('mouseenter', function() {
			$container.find('.accordeon__element').not(this).stop().animate({ width: sizes.small + 'px' }, 300 );
			$(this).stop().animate({ width: sizes.full + 'px' }, 300 );
		});

		$container.on('mouseleave', function() {
			if ($container.find('.accordeon__element.accordeon__element--current').length) {
				$container.find('.accordeon__element').not('.accordeon__element--current').stop().animate({ width: sizes.small + 'px' }, 500 );
				$container.find('.accordeon__element.accordeon__element--current').stop().animate({ width: sizes.full + 'px' }, 500 );
			}
			else {
				$container.find('.accordeon__element').stop().animate({ width: sizes.normal + 'px' }, 500 );
			}
		});
	};
	return Accordeon;
});