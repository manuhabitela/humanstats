//using this on both the scraper (node-like env) and the browser (requirejs)
if (typeof module === 'object' && typeof define !== 'function') {
    var define = function (factory) {
        module.exports = factory(require, exports, module);
    };
}

define(function (require, exports, module) {
	var _ = require('underscore');
	var Backbone = require('backbone');

	var models = {};

	var _originalAdd = Backbone.Collection.prototype.add;
	Backbone.Collection.prototype.add = function(models, options) {
		options = _.extend({ parse: true, merge: true }, options);
		return _originalAdd.call(this, models, options);
	};

	Backbone.Collection.prototype.comparator = function(model) {
		if (model.name) return model.name;
		if (model.title) return model.title;
		if (model.id) return model.id;
		return model.cid;
	};

	Backbone.Collection.prototype.parse = function(resp, options) {
		var data = resp;
		if (this.model && resp.length) {
			data = _(resp).map(function(item) {
				if (!(item instanceof Backbone.Model)) {
					item = new this.model(item, _.extend({ parse: true }, options));
					return item.toJSON();
				}
				return item;
			}, this);
		}
		return data;
	};

	var City = models.City = Backbone.Model.extend({
		parse: function(data) {
			if (data.url) {
				data.id = data.url.replace('http://humantalks.com/cities/', '');
				delete data.url;
			}
			return data;
		},

		getURL: function() {
			if (!this.collection) return false;
			return _.template(this.collection.htURL, { city: this.get('id') });
		}
	});
	var Cities = models.Cities = Backbone.Collection.extend({
		model: City,
		htURL: 'http://humantalks.com/cities/<%= city %>',

		activate: function (id) {
			if (!this.get(id))
				return false;
			this.activeItem = this.get(id);
			this.trigger('activate', this.activeItem);
		},

		desactivate: function() {
			this.activeItem = null;
			this.trigger('desactivate', this.activeItem);
		}
	});


	var Event = models.Event = Backbone.Model.extend({
		parse: function(data) {
			if (data.url) {
				var city = data.url.match(/\/cities\/(.*)\/events/);
				data.city = city[1] ? city[1] : '';
				data.id = data.url.replace('http://humantalks.com/cities/' + data.city + '/events/', '')*1;
				delete data.url;
			}
			if (data.date)
				data.date = modelsUtils.frenchDateToNumber(data.date);

			return data;
		},

		getURL: function() {
			if (!this.collection) return false;
			return _.template(this.collection.htURL, { city: this.get('city'), event: this.get('id') });
		}
	});
	var Events = models.Events = Backbone.Collection.extend({
		model: Event,
		htURL: 'http://humantalks.com/cities/<%= city %>/events/<%= event %>',
		meetupURL: 'http://www.meetup.com/<%= city %>/events/<%= event %>/'
	});


	var Talk = models.Talk = Backbone.Model.extend({
		parse: function(data) {
			if (data.url) {
				data.id = modelsUtils.getIDFromURL(data.url);
				data.slug = modelsUtils.getSlugFromURL(data.url);
				delete data.url;
			}
			if (data.event && data.event.id) {
				data.eventId = data.event.id;
				data.city = data.event.city;
				delete data.event;
			}
			if (data.author) {
				if (data.author.url) {
					data.authorId = modelsUtils.getIDFromURL(data.author.url);
				} else if (data.author.name) {
					data.authorName = data.author.name;
				}
				delete data.author;
			}
			return data;
		}
	});
	var Talks = models.Talks = Backbone.Collection.extend({
		model: Talk,
		htURL: 'http://humantalks.com/talks/'
	});


	var User = models.User = Backbone.Model.extend({
		parse: function(data) {
			if (data.event && data.event.id) {
				data.eventId = event.id;
				delete data.event;
			}
			if (data.url) {
				data.id = modelsUtils.getIDFromURL(data.url);
				data.slug = modelsUtils.getSlugFromURL(data.url);
				delete data.url;
			} else if (data.name && !data.id && !data.slug) {
				data.id = data.name;
			}
			return data;
		},

		setAttendance: function(events) {
			this.set('attendedEventIds', []);
			var id = this.get('id');
			events.each(function(event) {
				if ( id && _(event.get('attendeeIds')).contains(id) ) {
					var attendedEventIds = _.clone(this.get('attendedEventIds'));
					attendedEventIds.push(event.get('id'));
					this.set('attendedEventIds', attendedEventIds);
				}
			}, this);
		},

		setTalks: function(talks) {
			this.set('talkIds', []);
			var id = this.get('id');
			talks.each(function(talk) {
				if ( id && talk.get('authorId') == id ) {
					var talkIds = this.get('talkIds');
					talkIds.push(talk.get('id'));
					this.set('talkIds', talkIds);
				}
			}, this);
		}
	});
	var Users = models.Users = Backbone.Collection.extend({
		model: User,
		htURL: 'http://news.humancoders.com/users/<%= id %>-<%= slug %>',
		setAttendance: function(events) {
			_(this.models).each(function(user) {
				user.setAttendance(events);
			}, this);
		},
		setTalks: function(talks) {
			_(this.models).each(function(user) {
				user.setTalks(talks);
			}, this);
		}
	});

	var modelsUtils = {
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
		frenchDateToNumber: function frenchDateToNumber(date) {
			var months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
			var hasToConvert = _.some(months, function(month) { return date.indexOf(month) !== -1; });
			if (!hasToConvert) return date;

			var oldDate = date;
			date = date.replace(/\n/g, '').trim();
			date = date.split(' ');
			date[1] = (months.indexOf(date[1])+1).toString();
			date[1] = (date[1]).toString().length > 1 ? date[1] : "0" + date[1];
			date[0] = (date[0]).toString().length > 1 ? date[0] : "0" + date[0];
			date = date.reverse().join('-');
			return date;
		}
	};

	return models;
});