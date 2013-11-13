//get hearthstone cards from hearthhead.com
var _ = require('underscore');
var fs = require('fs');
var utils = require('utils');
var childProcess;
try { childProcess = require("child_process"); } catch (e) {}


Utils = {
	saveJSON: function saveJSON(filepath, data) {
		data = JSON.stringify(data);
		fs.write(filepath, data, 'w');
	},

	getDataFromJSON: function getDataFromJSON(filepath) {
		return JSON.save( fs.read(filepath) );
	},

	frenchDateToNumber: function frenchDateToNumber(date) {
		var months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
		date = date.replace(/\n/g, '').trim();
		date = date.split(' ');
		date[1] = (_(months).indexOf(date[1])+1).toString();
		date[1] = (date[1]).toString().length > 1 ? date[1] : "0" + date[1];
		date[0] = (date[0]).toString().length > 1 ? date[0] : "0" + date[0];
		date = date.reverse().join('-');
		return date;
	}
};


/**
 * the Webpage object contains all variables and functions directly related to the human talks webpage we will parse
 *
 * the "_get...FromDOM" functions are supposed to be called in a casper.evaluate in order to work directly in the page environment
 * @type {Object}
 */
Webpage = {
	url: 'http://humantalks.com',

	/**
	 * get all human talks cities
	 * @param  {string} selector cities css selector
	 * @return {array}          list of {name, url} city objects
	 */
	_getCitiesFromDOM: function _getCitiesFromDOM() {
		var cities = document.querySelectorAll('.cities a[href^="/cities/"]');
		return Array.prototype.map.call(cities, function(element) {
			return {
				name: element.innerHTML,
				url: element.href
			};
		});
	},

	/**
	 * get events of the current city page
	 * @return {array} list of {city, name, url} event objects
	 */
	_getEventsFromDOM: function _getEventsFromDOM() {
		var events = document.querySelectorAll('#events .event > a');
		return Array.prototype.map.call(events, function(element) {
			return {
				date: element.querySelector('h3 small').innerHTML,
				url: element.href
			};
		});
	},

	/**
	 * get talks of the current event page
	 * @return {array} list of {name, author, url} talk objects
	 */
	_getTalksFromDOM: function _getTalksFromDOM() {
		var talks = document.querySelectorAll('.talks .talk');
		return Array.prototype.map.call(talks, function(element) {
			var title = element.querySelector('h3 a');
			return {
				name: title.innerHTML,
				author: element.querySelector('.presenter a').innerHTML,
				url: title.href
			};
		});
	},

	/**
	 * get attendees of the current talk page
	 * @return {array} list of {name, img, url} attendee objects
	 */
	_getAttendeesFromDOM: function _getAttendeesFromDOM() {
		var attendees = document.querySelectorAll('.attendees + .attendees + .attendees .attendee a');
		return Array.prototype.map.call(attendees, function(element) {
			return {
				name: element.querySelector('.name').innerHTML,
				img: element.querySelector('.picture img').src,
				url: element.href
			};
		});
	},

	getCities: function getCities() {
		var cities = casper.evaluate(Webpage._getCitiesFromDOM);
		return cities;
	},

	getEvents: function getEvents(city) {
		var events = casper.evaluate(Webpage._getEventsFromDOM);
		_(events).each(function(event) {
			event.city = city.name;
			event.date = Utils.frenchDateToNumber(event.date);
		});
		return events;
	},

	getTalks: function getTalks(event) {
		var talks = casper.evaluate(Webpage._getTalksFromDOM);
		_(talks).each(function(talk) {
			talk.city = event.city;
			talk.date = event.date;
		});
		return talks;
	},

	getAttendees: function getAttendees(talk) {
		var attendees = casper.evaluate(Webpage._getAttendeesFromDOM);
		_(attendees).each(function(attendee) {
			attendee.city = talk.city;
			attendee.date = talk.date;
			attendee.talk = talk.name;
		});
		return attendees;
	}
};


var casper = require('casper').create({
	verbose: true,
	logLevel: "debug",
	viewportSize: { width: 1378, height: 768 }, //for real, my screen is like everyone else's!
	pageSettings: {
		loadImages: false,
		loadPlugins: false,
		//I'm using Chrome, I SWEAR
		userAgent: "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36"
	},
	//don't load any external ressource
	onResourceRequested: function(capser, requestData, networkRequest) {
		if (requestData.url.indexOf(Webpage.url) !== 0) {
			networkRequest.abort();
		}
	}
});
//logging all the thinnnngs
casper.on('page.error', function (msg, trace) { this.echo( 'Error: ' + msg, 'ERROR' ); });
casper.on('remote.message', function(msg) { this.echo('Remote message: ' + msg); });


var cities = [], events = [], talks = [], attendees = [];


casper
	.start(Webpage.url)
	.then(function homeLoaded() {
		cities = Webpage.getCities();
	})
	.then(function citiesSaved() {
		_(cities).each(function(city) {
			casper.thenOpen(city.url, function openedCity() {
				events = events.concat(Webpage.getEvents(city));
			});
		});
	})
	.then(function eventsSaved() {
		_(events).each(function(event) {
			casper.thenOpen(event.url, function openedEvent() {
				talks = talks.concat(Webpage.getTalks(event));
			});
		});
	})
	.then(function talksSaved() {
		_(talks).each(function(talk) {
			casper.thenOpen(talk.url, function openedTalk() {
				attendees = attendees.concat(Webpage.getAttendees(talk));
			});
		});
	})
	.then(function attendeesSaved() {
		var all = {
			cities: cities,
			events: events,
			talks: talks,
			attendees: attendees
		};
		Utils.saveJSON('humantalks.json', all);
	})
	.run();