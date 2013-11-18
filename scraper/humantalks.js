var _ = require('underscore');

var HumanTalks = function(opts) {
	this.options = _.extend({}, { url: 'http://humantalks.com', casper: null }, opts);
	this.casper = this.options.casper;
	this.url = this.options.url;
	if (!this.casper)
		return false;
	return this;
};
HumanTalks.prototype = {
	/**
	 * get all human talks cities
	 * @param  {string} selector cities css selector
	 * @return {array}          list of {name, url} city objects
	 */
	cities: function cities() {
		return this.casper.evaluate(function citiez() {
			var elements = document.querySelectorAll('.cities a[href^="/cities/"]');
			return Array.prototype.map.call(elements, function(element) {
				return {
					name: element.innerHTML,
					url: element.href
				};
			});
		});
	},

	/**
	 * get events of the current city page
	 * @return {array} list of {city, name, url} event objects
	 */
	events: function events() {
		return this.casper.evaluate(function events() {
			var elements = document.querySelectorAll('#events .event > a');
			return Array.prototype.map.call(elements, function(element) {
				var date = element.querySelector('h3 small');
				return {
					date: date ? date.innerHTML : '',
					url: element.href
				};
			});
		});
	},

	/**
	 * get talks of the current event page
	 * @return {array} list of {name, author, url} talk objects
	 */
	talks: function talks() {
		return this.casper.evaluate(function talks() {
			var elements = document.querySelectorAll('.talks .talk');
			//recent paris events page are filled with talks all registered by m. parisot, with the real talkers in the end of the talk' title
			var parisotStyle = Array.prototype.every.call(document.querySelectorAll('.talks .talk .presenter a'), function(link) {
				return link.innerHTML === "Mathieu Parisot";
			});
			return Array.prototype.map.call(elements, function(element) {
				var titleLink = element.querySelector('h3 a');
				var authorLink = element.querySelector('.presenter a');
				title = titleLink ? titleLink.innerHTML : '';
				author = authorLink ? authorLink.innerHTML : '';
				if (parisotStyle) {
					title = titleLink ? titleLink.innerHTML.substr(0, titleLink.innerHTML.lastIndexOf('par ')) : '';
					author = titleLink ? titleLink.innerHTML.substr(titleLink.innerHTML.lastIndexOf('par ')+('par ').length) : '';
				}
				var obj = {};
				if (title) {
					obj.name = title.trim();
					obj.url = titleLink.href;
				}
				if (author) {
					obj.author = { name: author.trim() };
					if (!parisotStyle)
						obj.author.url = authorLink.href;
				}
				return obj;
			});
		});
	},

	/**
	 * get attendees of the current event page
	 * @return {array} list of {name, img, url} attendee objects
	 */
	attendees: function attendees() {
		return this.users('.attendees + .attendees + .attendees .attendee a');
	},

	/**
	 * get talkers of the current event page
	 * @return {array} list of {name, img, url} talker objects
	 */
	talkers: function talkers() {
		return this.users('.location + .attendees + .attendees .attendee a');
	},

	/**
	 * get organizers of the current city page
	 * @return {array} list of {name, img, url} organizer objects
	 */
	organizers: function organizers() {
		return this.users('.attendees:first-child .attendee a');
	},

	users: function users(selector) {
		return this.casper.evaluate(function users(selector) {
			var elements = document.querySelectorAll(selector);
			return Array.prototype.map.call(elements, function(element) {
				var name = element.querySelector('.name');
				var img = element.querySelector('.picture img');
				return {
					name: name ? name.innerHTML : '',
					img: img ? img.src : '',
					url: element.href
				};
			});
		}, selector);
	}
};
module.exports = HumanTalks;