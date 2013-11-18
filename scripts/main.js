require.config({
	shim: {
		underscore: {
			exports: '_'
		},
		backbone: {
			deps: [
				'underscore',
				'jquery'
			],
			exports: 'Backbone'
		}
	},
	paths: {
		jquery: '../bower_components/jquery/jquery',
		underscore: '../bower_components/underscore/underscore',
		backbone: '../bower_components/backbone/backbone',
		text: '../bower_components/requirejs-plugins/lib/text',
		json: '../bower_components/requirejs-plugins/src/json'
	}
});

require(["./app"], function(HumanStatistics) {
	var app = new HumanStatistics('#container');
});