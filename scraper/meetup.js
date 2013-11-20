var _ = require('underscore');
var moment = require('moment');

var Meetup = function(opts) {
	this.options = _.extend({}, { url: 'http://www.meetup.com', casper: null }, opts);
	this.casper = this.options.casper;
	this.url = this.options.url;
	this.apiURL = "https://api.meetup.com";
	if (!this.casper || !this.apiKey)
		return false;
	return this;
};
Meetup.prototype = {

	eventURL: function(group, id) {
		return this.url + '/' + group + '/events/' + id;
	},

	/**
	 * get attendees of current event page
	 * @return {array} list of {id, group, name, img} objects
	 */
	attendees: function attendees() {
		var elements = this.DOMAttendees();
		return _(elements).map(function(el) {
			if (el.url) {
				el.id = 'm_' + Meetup.Utils.getIDFromURL(el.url);
				el.group = Meetup.Utils.getGroupFromURL(el.url);
				delete el.url;
			}
			return el;
		}, this);
	},

	/**
	 * get users from the DOM of the current event page
	 * @return {array} list of {name, img, url} objects
	 */
	DOMAttendees: function DOMAttendees() {
		return this.casper.evaluate(function users(meetupURL) {
			var elements = document.querySelectorAll('#rsvp-list > .memberinfo-widget');
			return Array.prototype.map.call(elements, function(element) {
				var name = element.querySelector('.member-name a');
				var img = element.querySelector('.mem-photo-small img');
				return {
					name: name ? name.innerHTML : '',
					img: img ? img.src : '',
					url: name ? name.href.replace(meetupURL, '') : ''
				};
			});
		}, this.url);
	},

	loadMoreAttendees: function loadMoreAttendees() {
		return this.casper.evaluate(function() {
			return document.querySelector('.event-attendees .nav-appendPager') ? '.event-attendees .nav-appendPager' : null;
		});
	}
};
Meetup.Utils = {
	getIDFromURL: function getIDFromURL(url) {
		return url.substr(url.lastIndexOf('/')+1);
	},

	getGroupFromURL: function getGroupFromURL(url) {
		url = url.replace('http://', '');
		var group = url.substr(url.indexOf('/')+1);
		return group.substr(0, group.indexOf('/'));
	}
};
module.exports = Meetup;