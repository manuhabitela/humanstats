var _ = require('underscore');
var moment = require('moment');
moment.lang('fr');

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
	 * get cities from current page
	 * @return {array} list of {name, id} objects
	 */
	cities: function cities() {
		var elements = this.DOMCities();
		return _(elements).map(function(el) {
			if (el.url) {
				el.id = el.url.replace(this.url + '/cities/', '');
				delete el.url;
			}
			return el;
		}, this);
	},

	/**
	 * get all human talks cities from the DOM of the current root page
	 * @return {array}          list of {name, url} objects
	 */
	DOMCities: function DOMCities() {
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
	 * get events from current page
	 * @return {array} list of {date, city, id} objects
	 */
	events: function events() {
		var elements = this.DOMEvents();
		// return elements;
		return _(elements).map(function(el) {
			if (el.url) {
				var city = el.url.match(/\/cities\/(.*)\/events/);
				el.city = city[1] ? city[1] : '';
				el.id = el.url.replace(this.url + '/cities/' + el.city + '/events/', '')*1;
				delete el.url;
			}
			if (el.date) {
				el.date = moment(el.date.replace(/\n/g, '').trim(), "D MMM YYYY").format('YYYY-MM-DD');
			}

			return el;
		}, this);
	},

	/**
	 * get events from the DOM of the current city page
	 * @return {array} list of {date, url} event objects
	 */
	DOMEvents: function DOMEvents() {
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
	 * @return {array} list of {name, id, slug, authorId, authorName} objects
	 */
	talks: function() {
		var elements = this.DOMTalks();
		return _(elements).map(function(el) {
			if (el.url) {
				el.id = HumanTalks.Utils.getIDFromURL(el.url);
				el.slug = HumanTalks.Utils.getSlugFromURL(el.url);
				delete el.url;
			}
			if (el.author) {
				if (el.author.url) {
					el.authorId = HumanTalks.Utils.getIDFromURL(el.author.url);
				} else if (el.author.name) {
					el.authorName = el.author.name;
				}
				delete el.author;
			}
			return el;
		}, this);
	},

	/**
	 * get talkers of the current event page
	 * this way lets us get the names of paris talkers without id (parisot style)
	 */
	talksTalkers: function() {
		var elements = this.DOMTalks();
		var talkers = _(elements).map(function(el) {
			var author = null;
			if (el.author && el.author.url) {
				author = {};
				author.id = HumanTalks.Utils.getIDFromURL(el.author.url);
				author.slug = HumanTalks.Utils.getSlugFromURL(el.author.url);
			}
			if (el.author && el.author.name) {
				if (!author) author = {};
				author.name = el.author.name;
				if (!el.author.url && !author.id) {
					author.id = HumanTalks.Utils.hashCode(author.name);
				}
			}
			return author.id !== 0 ? author : false;
		}, this);
		return _(talkers).compact();
	},

	/**
	 * get talks from the DOM of the current event page
	 * @return {array} list of {name, url, { autor: name, url } } objects
	 */
	DOMTalks: function DOMTalks() {
		return this.casper.evaluate(function talks() {
			//todo: refactor event id/city getter (code copied/pasted here and in events())
			var eventURL = window.location.href;
			var city = eventURL.match(/\/cities\/(.*)\/events/);
			city = city[1] ? city[1] : '';
			eventId = eventURL.substr(eventURL.lastIndexOf('/')+1)*1;

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
				var obj = {
					eventId: eventId,
					city: city
				};
				if (title) {
					obj.name = title.trim();
					obj.url = titleLink.href;
				}
				if (author) {
					obj.author = { name: author.trim() };
					if (!parisotStyle) {
						obj.author.url = authorLink.href;
					}
				}
				return obj;
			});
		});
	},

	/**
	 * get users of the current event page
	 * @param  {string} selector css selector used to filter the type of users we want
	 * @return {array}  list of {name, img, id, slug} objects
	 */
	users: function users(selector) {
		selector = selector || '.attendees .attendee a';
		var elements = this.DOMUsers(selector);
		return _(elements).map(function(el) {
			if (el.url) {
				el.id = HumanTalks.Utils.getIDFromURL(el.url);
				el.slug = HumanTalks.Utils.getSlugFromURL(el.url);
				delete el.url;
			} else if (el.name && !el.id && !el.slug) {
				el.id = el.name;
			}
			return el;
		}, this);
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

	DOMUsers: function DOMUsers(selector) {
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
HumanTalks.Utils = {
	getInfoFromURL: function getInfoFromURL(url, info) {
		if (!_(['slug', 'id']).contains(info))
			return false;
		url = url.substr(url.lastIndexOf('/')+1);
		if (info === 'id')
			return (url.substr(0, url.indexOf('-')))*1;
		if (info === 'slug')
			return url.substr(url.indexOf('-')+1);
		return false;
	},

	getIDFromURL: function getIDFromURL(url) {
		return this.getInfoFromURL(url, 'id');
	},

	getSlugFromURL: function getSlugFromURL(url) {
		return this.getInfoFromURL(url, 'slug');
	},

	hashCode: function hashCode(s){
		var code = s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a;},0);
		return code < 0 ? code*-1 : code;
	}
};
module.exports = HumanTalks;