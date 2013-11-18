//run this from the root project directory to fill the data dir correctly
var Backbone = require('backbone');
var _ = require('underscore');
var fs = require('fs');
var utils = require('utils');
var HumanTalks = require('./humantalks.js');
var IO = require('./io.js');
var models = require('../scripts/models.js');
var geocoder = require('./geocode.js');

var casper = require('casper').create({
	verbose: true,
	logLevel: "debug",
	viewportSize: { width: 1378, height: 768 }, //for real, my screen is like everyone else's!
	pageSettings: {
		loadImages: false,
		loadPlugins: false,
		//I'm using Chrome, I SWEAR
		userAgent: "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36"
	}
});
//logging all the thinnnngs
casper.on('page.error', function (msg, trace) { this.echo( 'Error: ' + msg, 'ERROR' ); });
casper.on('remote.message', function(msg) { this.echo('Remote message: ' + msg); });
//don't load any external ressource except bing geocoder
casper.on("resource.requested", function(res, req) {
	if (res.url.indexOf(humantalks.url) !== 0 && res.url.indexOf(geocoder.baseURL) !== 0)
		req.abort();
});

geocoder.key = 'AqJNOV0iGMNRfUf9gp5Rb2gf1HHKoJ-752bZ1xgUuT3qdqGJ8z2-KFttDY39aQcH';

var cities = new models.Cities(IO.getDataFromJSON('./data/cities.json')),
	events = new models.Events(IO.getDataFromJSON('./data/events.json')),
	talks = new models.Talks(IO.getDataFromJSON('./data/talks.json')),
	users = new models.Users(IO.getDataFromJSON('./data/users.json')),
	humantalks = new HumanTalks({ casper: casper });

function saveAll() {
	var all = {
		cities: cities.toJSON(),
		events: events.toJSON(),
		talks: talks.toJSON(),
		users: users.toJSON()
	};
	IO.saveJSON('./data/cities.json', all.cities);
	IO.saveJSON('./data/events.json', all.events);
	IO.saveJSON('./data/talks.json', all.talks);
	IO.saveJSON('./data/users.json', all.users);
	IO.saveJSON('./data/humantalks.json', all);
}

casper
	.start(humantalks.url)
	.then(function humanTalksHomeLoaded() {
		cities.add(humantalks.cities());

		cities.each(function(city) {
			var coordsURL = geocoder.getQueryURL({ locality: city.get('name'), countryRegion: "FR", maxResults: 1 });
			casper.thenOpen(coordsURL, { method: 'get', headers: { 'Accept': 'application/json' } }, function openedCityCoords() {
				var response = JSON.parse(casper.getPageContent());
				var coords = geocoder.getCoordsFromResponse(response);
				city.set({ coords: coords }, { silent: true });
				casper.echo("hhaa)");
			});
		});
	})
	.then(function citiesParsedAndGeocoded() {
		saveAll();
	})
	.then(function citiesSaved() {
		cities.each(function(city) {
			casper.thenOpen(city.getURL(), function openedCity() {
				events.add(humantalks.events());

				var rawOrganizers = humantalks.organizers();
				var organizers = new models.Users(rawOrganizers, { parse: true });
				city.set('organizerIds', organizers.pluck('id'));
				users.add(rawOrganizers);

				saveAll();
			});
		});
	})
	.then(function eventsSaved() {
		events.each(function(event) {
			casper.thenOpen(event.getURL(), function openedEvent() {
				var currentTalks = humantalks.talks();
				var currentTalkers = _(currentTalks).map(function(talk) { return talk.author; });
				currentTalks = _(currentTalks).map(function(talk) {
					return _.extend(talk, { event: event.toJSON() });
				});
				talks.add(currentTalks);

				var rawAttendees = humantalks.attendees();
				var attendees = new models.Users(rawAttendees, { parse: true });
				event.set('attendeeIds', attendees.pluck('id'));
				users.add(rawAttendees);

				users.add(humantalks.talkers());
				users.add(currentTalkers);

				saveAll();
			});
		});
	})
	.then(function afterAll() {
		users.setAttendance(events);
		users.setTalks(talks);

		saveAll();
	})
	.run();