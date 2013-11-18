require.config({
	// The shim config allows us to configure dependencies for
	// scripts that do not call define() to register a module
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

require(["json!../data/humantalks.json", "../scripts/models", "./views"], function(data, models, views) {
	var cities = new models.Cities(data.cities);
	var events = new models.Events(data.events);
	var talks = new models.Talks(data.talks);
	var users = new models.Users(data.users);

	var citiesView = new views.Cities({ collection: cities, el: document.querySelector('.cities') });
	var dataView = new views.Data({
		cities: cities,
		events: events,
		talks: talks,
		users: users,
		el: document.querySelector('.data')
	});
});