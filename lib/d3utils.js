define(["d3"], function(d3) {
	return {
		//https://groups.google.com/forum/#!msg/d3-js/WC_7Xi6VV50/j1HK0vIWI-EJ
		allTransitionEnd: function(transition, callback) {
			var n = 0;
			transition
				.each(function() { ++n; })
				.each("end", function() { if (!--n) callback.apply(this, arguments); });
		}
	};
});