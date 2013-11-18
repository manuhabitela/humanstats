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
		}
	},
	paths: {
		jquery: '../bower_components/jquery/jquery',
		underscore: '../bower_components/underscore/underscore',
		backbone: '../bower_components/backbone/backbone',
		d3: '../bower_components/d3/d3',
		datamaps: '../bower_components/datamaps/datamaps.world',
		topojson: '../bower_components/topojson/topojson',
		text: '../bower_components/requirejs-plugins/lib/text',
		json: '../bower_components/requirejs-plugins/src/json'
	}
});

require(["./app"], function(HumanStatistics) {
	var app = new HumanStatistics('#container');
});