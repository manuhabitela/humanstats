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
			return Array.prototype.map.call(elements, function(element) {
				var title = element.querySelector('h3 a');
				var author = element.querySelector('.presenter a');
				var obj = {};
				if (title) {
					obj.name = title.innerHTML;
					obj.url = title.href;
				}
				if (author) {
					obj.author = {
						url: author.href,
						name: author.innerHTML
					};
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