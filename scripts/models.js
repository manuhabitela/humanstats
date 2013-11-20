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
		htURL: 'http://humantalks.com/cities/<%= city %>',
		getURL: function() {
			return _.template(this.htURL, { city: this.get('id') });
		}
	});
	var Cities = models.Cities = Backbone.Collection.extend({
		model: City,

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
		htURL: 'http://humantalks.com/cities/<%= city %>/events/<%= event %>',
		meetupURL: 'http://www.meetup.com/<%= city %>/events/<%= event %>/',
		getURL: function() {
			return _.template(this.htURL, { city: this.get('city'), event: this.get('id') });
		},
		getMeetupURL: function() {
			var meetup = this.get('meetup');
			return meetup ? _.template(this.meetupURL, { city: meetup.group, event: meetup.id }) : false;
		}
	});
	var Events = models.Events = Backbone.Collection.extend({
		model: Event
	});


	var Talk = models.Talk = Backbone.Model.extend({
		htURL: 'http://humantalks.com/talks/<%= id %>-<%= slug %>',
		getURL: function() {
			return _.template(this.htURL, { id: this.get('id'), slug: this.get('slug') });
		}
	});
	var Talks = models.Talks = Backbone.Collection.extend({
		model: Talk
	});


	var User = models.User = Backbone.Model.extend({
		htURL: 'http://news.humancoders.com/users/<%= id %>-<%= slug %>',
		parse: function(res) {
			return res.id ? res : false;
		},
		getURL: function() {
			return _.template(this.htURL, { id: this.get('id'), slug: this.get('slug') });
		},
		setAttendance: function(events) {
			var attendedEventIds = [];
			var id = this.get('id');
			events.each(function(event) {
				if ( id && _(event.get('attendeeIds')).contains(id) ) {
					attendedEventIds.push(event.get('id'));
				}
			}, this);
			this.set('attendedEventIds', attendedEventIds);
		},
		setTalks: function(talks) {
			var talkIds = [];
			var id = this.get('id');
			talks.each(function(talk) {
				if ( id && talk.get('authorId') == id ) {
					talkIds.push(talk.get('id'));
				}
			}, this);
			this.set('talkIds', talkIds);
		}
	});
	var Users = models.Users = Backbone.Collection.extend({
		model: User,
		setAttendance: function(events) {
			_(this.models).each(function(user) {
				if (user.get('id') !== undefined)
					user.setAttendance(events);
			}, this);
		},
		setTalks: function(talks) {
			_(this.models).each(function(user) {
				if (user.get('id') !== undefined)
					user.setTalks(talks);
			}, this);
		}
	});

	return models;
});