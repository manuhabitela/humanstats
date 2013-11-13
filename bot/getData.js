//get hearthstone cards from hearthhead.com
var _ = require('underscore');
var _s = require('underscore.string');
var fs = require('fs');
var childProcess;
try { childProcess = require("child_process"); } catch (e) {}
var casper = require('casper').create({
	verbose: true,
	logLevel: "debug"
});
casper.on('page.error', function (msg, trace) { this.echo( 'Error: ' + msg, 'ERROR' ); });
casper.on('remote.message', function(msg) { this.echo('remote message caught: ' + msg); });


/**
 * the Webpage object contains all variables and functions directly related to the human talks webpage we will parse
 *
 * the functions are supposed to be called in a casper.evaluate in order to work directly in the page environment
 * @type {Object}
 */
Webpage = {
	/**
	 * url we go to on casper, containing the list of cities
	 *
	 * @type {String}
	 */
	url: "http://humantalks.com/",

	/**
	 * css selector that targets all the cities the human talks are
	 * @type {String}
	 */
	citiesSelector: '.cities a[href^="/cities/"]',

	/**
	 * css selector targeting all the events when on a city page
	 * @type {String}
	 */
	eventsSelector: '#events .event a',

	/**
	 * css selector targeting the talks of an event
	 * @type {String}
	 */
	talksSelector: '.talks .talk',

	/**
	 * css selector of a talk title (to be used directly in a talk element, otherwise wouldn't be precise enough)
	 * @type {String}
	 */
	talkTitleSelector: 'h3 a',

	/**
	 * css selector of a talk author (to be used directly in a talk element, otherwise wouldn't be precise enough)
	 * @type {String}
	 */
	talkAuthorSelector: '.presenter a',

	/**
	 * css selector targeting the attendees of an event
	 * @type {String}
	 */
	attendeesSelector: '.attendees + .attendees + .attendees .attendee a',

	/**
	 * css selector of an attendee name (to be used directly in an attendee element, otherwise wouldn't be precise enough)
	 * @type {String}
	 */
	attendeeNameSelector: '.name',

	/**
	 * css selector of an attendee img (to be used directly in an attendee element, otherwise wouldn't be precise enough)
	 * @type {String}
	 */
	attendeePictureSelector: '.picture img',

	/**
	 * get all human talks cities
	 * @param  {string} selector cities css selector
	 * @return {array}          list of {name, url} city objects
	 */
	getCities: function getCities(citiesSelector) {
		var cities = document.querySelectorAll(citiesSelector);
		return Array.prototype.map.call(cities, function(element) {
			return {
				name: element.innerHTML,
				url: element.href,
				el: element
			};
		});
	},

	/**
	 * get events of the current city page
	 * @param  {string} eventsSelector events css selector
	 * @return {array}                list of {city, name, url} event objects
	 */
	getEvents: function getEvents(eventsSelector) {
		var events = document.querySelectorAll(eventsSelector);
		return Array.prototype.map.call(events, function(element) {
			return {
				date: ,//moment
				url: element.href,
				el: element
			};
		});
	},

	/**
	 * get talks of the current event page
	 * @param  {string} talksSelector talks css selector
	 * @param  {string} talkTitleSelector title css selector
	 * @param  {string} talkAuthorSelector author css selector
	 * @return {array}                list of {name, author, url} talk objects
	 */
	getTalks: function getTalks(talksSelector, talkTitleSelector, talkAuthorSelector) {
		var talks = document.querySelectorAll(talksSelector);
		return Array.prototype.map.call(talks, function(element) {
			return {
				name: element.querySelector(talkTitleSelector).innerHTML,
				author: element.querySelector(talkAuthorSelector).innerHTML,
				url: element.href,
				el: element
			};
		});
	},

	/**
	 * get attendees of the current talk page
	 * @param  {string} attendeesSelector attendees css selector
	 * @param  {string} attendeeNameSelector name css selector
	 * @param  {string} attendeePictureSelector img css selector
	 * @return {array}                list of {name, img, url} attendee objects
	 */
	getAttendees: function getAttendees(attendeesSelector, attendeeNameSelector, attendeePictureSelector) {
		var attendees = document.querySelectorAll(attendeesSelector);
		return Array.prototype.map.call(attendees, function(element) {
			return {
				name: element.querySelector(attendeeNameSelector).innerHTML,
				img: element.querySelector(attendeePictureSelector).src,
				url: element.href,
				el: element
			};
		});
	}
};

Utils = {
	saveJSON: function saveJSON(filepath, data) {
		var data = JSON.stringify(data);
		fs.write(filepath, data, 'w');
	},

	getDataFromJSON: function getDataFromJSON(filepath) {
		return JSON.parse( fs.read(filepath) );
	}
};

//we load the human talks webpage
casper.start(Webpage.url);

casper.then(function homeLoaded() {
	var cities = casper.evaluate(Webpage.getCities, Webpage.citiesSelector);
	_(cities).each(function(city) {

	});
});
casper.run();