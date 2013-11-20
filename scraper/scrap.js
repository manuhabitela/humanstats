//run this from the root project directory to fill the data dir correctly
// this is starting to become quite a mess, © méthode rache
var Backbone = require('backbone');
var _ = require('underscore');
var fs = require('fs');
var utils = require('utils');
var HumanTalks = require('./humantalks');
var Meetup = require('./meetup');
var IO = require('./io');
var models = require('../scripts/models');
var geocoder = require('./geocode');
var apiKeys = require('./keys');

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
//don't load any other thing than humantalks, meetup or bing geocode api
casper.on("resource.requested", function(res, req) {
	if (res.url.indexOf(humantalks.url) !== 0 && res.url.indexOf(geocoder.baseURL) !== 0 &&
		res.url.indexOf(meetup.url) !== 0 && res.url.indexOf("meetupstatic") == -1)
		req.abort();
});

geocoder.key = apiKeys.bing;

var cities = new models.Cities(IO.getDataFromJSON('./data/cities.json')),
	events = new models.Events(IO.getDataFromJSON('./data/events.json')),
	talks = new models.Talks(IO.getDataFromJSON('./data/talks.json')),
	users = new models.Users(IO.getDataFromJSON('./data/users.json')),
	humantalks = new HumanTalks({ casper: casper }),
	meetup = new Meetup({ casper: casper });

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
	// .then(function humanTalksHomeLoaded() {
	// 	cities.add(humantalks.cities());

	// 	cities.each(function(city) {
	// 		var coordsURL = geocoder.getQueryURL({ locality: city.get('name'), countryRegion: "FR", maxResults: 1 });
	// 		casper.thenOpen(coordsURL, { method: 'get', headers: { 'Accept': 'application/json' } }, function openedCityCoords() {
	// 			var response = JSON.parse(casper.getPageContent());
	// 			var coords = geocoder.getCoordsFromResponse(response);
	// 			city.set({ coords: coords }, { silent: true });
	// 		});
	// 	});
	// })
	// .then(function citiesParsedAndGeocoded() {
	// 	saveAll();
	// })
	// .then(function citiesSaved() {
	// 	cities.each(function(city) {
	// 		casper.thenOpen(city.getURL(), function openedCity() {
	// 			events.add(humantalks.events());

	// 			var organizers = humantalks.organizers();
	// 			city.set('organizerIds', _(organizers).pluck('id'));

	// 			cityEvents = _.chain( events.where({ city: city.id }) )
	// 				.map(function(ev) { return ev.toJSON(); })
	// 				.pluck('id')
	// 				.value();
	// 			city.set('eventIds', cityEvents);

	// 			users.add(organizers);

	// 			saveAll();
	// 		});
	// 	});
	// })
	.then(function eventsSaved() {
		// events.each(function(event) {
		// 	casper.thenOpen(event.getURL(), function openedEvent() {
		// 		var currentTalks = humantalks.talks();
		// 		talks.add(currentTalks);

		// 		var attendees = humantalks.attendees();
		// 		event.set('attendeeIds', _(attendees).pluck('id'));
		// 		users.add(attendees);

		// 		var talkers = humantalks.talksTalkers();
		// 		users.add(talkers);

		// 		saveAll();
		// 	});
		// });
		


		var openedMeetupEvent = function openedMeetupEvent() {
			loadMore = meetup.loadMoreAttendees();
			if (loadMore) {
				casper.thenClick(loadMore, function loadedMoreMeetupAttendees() {
					casper.waitWhileSelector(loadMore, function whenNoMoreLoad() {}, function onTimeout() {
						openedMeetupEvent();
					});
				});
			}
		};

		events.each(function(event) {
			var eventMeetup = event.get('meetup');
			if (eventMeetup && eventMeetup.group && eventMeetup.id) {
				casper.thenOpen(meetup.eventURL(eventMeetup.group, eventMeetup.id), openedMeetupEvent);
				casper.then(function allMeetupAttendeesLoaded() {
					console.log("azdazd");
					var meetupAttendees = meetup.attendees();
					console.log("azdazdadzazd", meetupAttendees.length);
					event.set('attendeeIds', event.get('attendeeIds').concat( _(meetupAttendees).pluck('id') ));

					users.add(meetupAttendees);
				});
			}
		});
	})
	.then(function afterAll() {
		// users.setAttendance(events);
		// users.setTalks(talks);

		saveAll();
	})
	.run();