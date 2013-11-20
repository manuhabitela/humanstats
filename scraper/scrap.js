//run this from the root project directory to fill the data dir correctly
//this is starting to become quite a mess, © méthode rache
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
		res.url.indexOf(meetup.url) !== 0 && res.url.indexOf("meetupstatic") === -1)
		req.abort();
});

geocoder.key = apiKeys.bing;

var cities = new models.Cities(IO.getDataFromJSON('./data/cities.json')),
	events = new models.Events(IO.getDataFromJSON('./data/events.json')),
	talks = new models.Talks(IO.getDataFromJSON('./data/talks.json')),
	users = new models.Users(IO.getDataFromJSON('./data/users.json')),
	meetups = IO.getDataFromJSON('./data/meetups.json'),
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
	IO.saveJSON('./data/all.json', all);
}

casper
	.start(humantalks.url)
	.then(function getAndLocateCities() {
		cities.add(humantalks.cities());

		cities.each(function(city) {
			var coordsURL = geocoder.getQueryURL({ locality: city.get('name'), countryRegion: "FR", maxResults: 1 });
			casper.thenOpen(coordsURL, { method: 'get', headers: { 'Accept': 'application/json' } }, function openedCityCoords() {
				var response = JSON.parse(casper.getPageContent());
				var coords = geocoder.getCoordsFromResponse(response);
				city.set({ coords: coords }, { silent: true });
			});
		});
	})
	.then(function saveCities() {
		saveAll();
	})
	.then(function saveEventsAndOrganizers() {
		cities.each(function(city) {
			casper.thenOpen(city.getURL(), function openedCityPage() {
				events.add(humantalks.events());

				var organizers = humantalks.organizers();
				city.set('organizerIds', _(organizers).pluck('id'));

				cityEvents = _.chain( events.where({ city: city.id }) )
					.map(function(ev) { return ev.toJSON(); })
					.pluck('id')
					.value();
				city.set('eventIds', cityEvents);

				users.add(organizers);

				saveAll();
			});
		});
	})
	.then(function saveTalksAndAttendees() {
		events.each(function(event) {
			casper.thenOpen(event.getURL(), function openedEventPage() {
				var currentTalks = humantalks.talks();
				talks.add(currentTalks);

				var attendees = humantalks.attendees();
				event.set('attendeeIds', _(attendees).pluck('id'));
				users.add(attendees);

				var talkers = humantalks.talksTalkers();
				users.add(talkers);

				saveAll();
			});
		});
	})
	.then(function saveMeetupAttendees() {
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

		_(meetups).each(function(event) {
			var eventModel = events.get(event.eventId);
			if (!eventModel) return false;
			var eventMeetup = event.meetup;
			if (eventMeetup && eventMeetup.group && eventMeetup.id) {
				casper.thenOpen(meetup.eventURL(eventMeetup.group, eventMeetup.id), openedMeetupEvent);
				casper.then(function allMeetupAttendeesLoaded() {
					var meetupAttendees = meetup.attendees();
					var meetupAttendeeIds = _(meetupAttendees).pluck('id');
					users.add(meetupAttendees);
					//uggggglyyyyyyyyyy
					//ok so I do this because I wanna be sure the 'handleDuplicates' stuff is done before going forward
					//and didn't find a proper way to do it with my tiny tired brain
					casper.wait(500);
					var actualUsers = users.filter(function(user) {
						return user.get('m_id') ?
							_(meetupAttendeeIds).contains('m_' + user.get('m_id')) :
							_(meetupAttendeeIds).contains(user.id);
					});
					eventModel.set('attendeeIds', eventModel.get('attendeeIds').concat( _(actualUsers).pluck('id') ));
				});
			}
		});
	})
	.then(function updateUsers() {
		users.setAttendance(events);
		users.setTalks(talks);
		saveAll();
	})
	.run();