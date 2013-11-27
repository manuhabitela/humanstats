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
		},
		d3: {
			exports: 'd3'
		},
		topojson: {
			exports: 'topojson'
		},
		d3tip: {
			deps: [
				'd3'
			]
		}
	},
	paths: {
		jquery: '../bower_components/jquery/jquery',
		underscore: '../bower_components/underscore/underscore',
		mixins: '../lib/underscore.mixins',
		backbone: '../bower_components/backbone/backbone',
		d3: '../bower_components/d3/d3',
		d3utils: '../lib/d3utils',
		d3tip: '../bower_components/d3-tip/index',
		datamaps: '../lib/datamaps',
		topojson: '../bower_components/topojson/topojson',
		text: '../bower_components/requirejs-plugins/lib/text',
		json: '../bower_components/requirejs-plugins/src/json',
		moment: '../bower_components/momentjs/min/moment-with-langs.min',
	}
});

require(["./app"], function(HumanStatistics) {
	window.myApp = new HumanStatistics('#container');
});