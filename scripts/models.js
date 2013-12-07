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

	var BaseModel = models.BaseModel = Backbone.Model.extend({});
	var BaseCollection = models.BaseCollection = Backbone.Collection.extend({

		add: function(models, options) {
			options = _.extend({ parse: true, merge: true }, options);
			return Backbone.Collection.prototype.add.call(this, models, options);
		},

		comparator: function(model) {
			if (model.name) return model.name;
			if (model.title) return model.title;
			if (model.id) return model.id;
			return model.cid;
		},

		parse: function(resp, options) {
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
		}

	});

	var City = models.City = BaseModel.extend({
		htURL: 'http://humantalks.com/cities/<%= city %>',
		getURL: function() {
			return _.template(this.htURL, { city: this.get('id') });
		}
	});
	var Cities = models.Cities = BaseCollection.extend({
		model: City,

		initialize: function(models, options) {
			this.activeItems = new Backbone.Collection([], { model: this.model });
		},

		activate: function(id, silent) {
			if (!this.get(id))
				return false;
			silent = !!silent;
			var city = this.get(id);
			this.activeItems.add(city);
			if (!silent)
				this.trigger('activate', city, this.activeItems);
		},

		deactivate: function(id, silent) {
			if (!this.get(id))
				return false;
			silent = !!silent;
			var city = this.get(id);
			this.activeItems.remove(city);
			if (!silent)
				this.trigger('deactivate', city, this.activeItems);
		},

		isActive: function(id) {
			return !!(this.get(id) && this.activeItems.get(id));
		},

		toggle: function(id) {
			if (this.isActive(id))
				this.deactivate(id);
			else
				this.activate(id);
			this.trigger('toggle', this.get(id), this.activeItems);
		},

		activateAll: function(silent) {
			silent = !!silent;
			this.activeItems.reset(this.models);
			if (!silent)
				this.trigger('activateAll');
		},

		deactivateAll: function(silent) {
			silent = !!silent;
			this.activeItems.reset();
			if (!silent)
				this.trigger('deactivateAll');
		},

		setColors: function() {
			//taken from d3.scale.category20()
			var colors = [
				'#1f77b4',
				'#ff7f0e',
				'#2ca02c',
				'#d62728',
				'#9467bd',
				'#8c564b',
				'#e377c2',
				'#7f7f7f',
				'#bcbd22',
				'#17becf',
				'#aec7e8',
				'#ffbb78',
				'#98df8a',
				'#ff9896',
				'#c5b0d5',
				'#c49c94',
				'#f7b6d2',
				'#c7c7c7',
				'#dbdb8d',
				'#9edae5'
			];
			var i = 0;
			this.each(function(city) {
				city.set('color', colors[i]);
				if (i >= colors.length-1) i = 0;
				else i++;
			});
		},

		setAttendeesCount: function(events) {
			this.each(function(city) {
				var attendeeIds = [];
				events.each(function(event) {
					if (event.get('city') && event.get('city') === city.id && event.get('attendeeIds')) {
						attendeeIds = attendeeIds.concat(event.get('attendeeIds'));
					}
				}, this);
				city.set('attendeesCount', _(attendeeIds).uniq().length);
				city.set('appearancesCount', attendeeIds.length);
			}, this);
		}
	});


	var Event = models.Event = BaseModel.extend({
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
	var Events = models.Events = BaseCollection.extend({
		model: Event,

		initialize: function(models, options) {
			_.bindAll(this, 'removeUpcomings', 'removeEmpty');

			this.activeItems = new Backbone.Collection([], { model: this.model });
		},

		removeUpcomings: function() {
			var now = new Date();
			var currentMonth = now.getMonth()+1;
			var currentYear = now.getFullYear();
			var currentDay = now.getDate();
			var toDelete = [];
			this.each(function(event) {
				var date = event.get('date').split('-');
				var year = date[0]*1;
				var month = date[1]*1;
				var day = date[2]*1;
				if (year > currentYear || (year === currentYear && month > currentMonth) ||
					(year === currentYear && month === currentMonth && day > currentDay)) {
					toDelete.push(event);
				}
			}, this);
			this.remove(toDelete);
		},

		removeEmpty: function() {
			var toDelete = [];
			this.each(function(event) {
				if (event.get('attendeeIds') && event.get('attendeeIds').length === 0)
					toDelete.push(event);
			}, this);
			this.remove(toDelete);
		},

		filterByCities: function(cities) {
			var data = [];
			var cityIds = cities.pluck('id');
			if (cityIds) {
				data = this.filter(function(event) {
					return _(cityIds).contains(event.get('city'));
				});
			}
			this.activeItems.reset(data);
			return this.activeItems.toJSON();
		}
	});


	var Talk = models.Talk = BaseModel.extend({
		htURL: 'http://humantalks.com/talks/<%= id %>-<%= slug %>',
		getURL: function() {
			return _.template(this.htURL, { id: this.get('id'), slug: this.get('slug') });
		}
	});
	var Talks = models.Talks = BaseCollection.extend({
		model: Talk,

		initialize: function() {
			this.activeItems = new Backbone.Collection([], { model: this.model });
		},

		filterByCities: function(cities) {
			var data = [];
			var cityIds = cities.pluck('id');
			if (cityIds) {
				data = this.filter(function(talk) {
					return _(cityIds).contains(talk.get('city'));
				});
			}
			this.activeItems.reset(data);
			return this.activeItems.toJSON();
		}
	});


	var User = models.User = BaseModel.extend({
		htURL: 'http://news.humancoders.com/users/<%= id %>-<%= slug %>',
		parse: function(res) {
			return res.id ? res : false;
		},
		getURL: function() {
			return _.template(this.htURL, { id: this.get('id'), slug: this.get('slug') });
		},
		setAttendance: function(events) {
			var attendedEventIds = { all: [] };
			var id = this.get('id');
			events.each(function(event) {
				if ( id && _(event.get('attendeeIds')).contains(id) ) {
					attendedEventIds.all.push(event.id);
					if (attendedEventIds[event.get('city')])
						attendedEventIds[event.get('city')].push(event.id);
					else
						attendedEventIds[event.get('city')] = [event.id];
				}
			}, this);
			if (attendedEventIds.all.length)
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
			if (talkIds.length)
				this.set('talkIds', talkIds);
		},
		setMainCities: function(events) {
			var attended = this.get('attendedEventIds') ? this.get('attendedEventIds').all : null;
			var cities = _(attended).chain().map(function(eventId) {
				var event = events.get(eventId) ? events.get(eventId).toJSON() : null;
				return event ? event.city : null;
			}).filter(function(city) { return !!city; }).value();
			//array of all the cities the user has been to, in order from most gone to to least gone to
			this.set('mainCities', _(cities).chain()
				.countBy()
				.pairs()
				.sortBy(function(item) { return item[1]*-1; })
				.map(function(item) { return item[0]; })
				.value()
			);
		}
	});
	var Users = models.Users = BaseCollection.extend({
		model: User,
		initialize: function() {
			_.bindAll(this, 'handleDuplicates');
			this.on('add', this.handleDuplicates);

			this.activeItems = new Backbone.Collection([], { model: this.model });
		},
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
		},
		setMainCities: function(events) {
			_(this.models).each(function(user) {
				if (user.get('id') !== undefined)
					user.setMainCities(events);
			}, this);
		},
		handleDuplicates: function(addedUser) {
			//dont try to merge if the name is just a firstname
			if (Users.firstnames && _(Users.firstnames).contains(addedUser.get('name').toLowerCase().trim()))
				return false;
			var existings = this.filter(function(model) {
				return model.get('name') === addedUser.get('name') && model.id !== addedUser.id;
			}, this);
			if (existings.length) {
				_(existings).each(function(existing) {
					//merge meetup user
					if (addedUser.id.toString().indexOf('m_') === 0) {
						var meetupId = (addedUser.id.substr(2))*1; //looks like ("m_123", so, substring to get 123);
						existing.set({ m_id: meetupId, m_group: (addedUser.get('group') || '') });
						this.remove(addedUser);
					} else {
						//remove unused user
						var newModelKeys = _(addedUser.omit('attendedEventIds', 'talkIds')).keys();
						if ( !_(newModelKeys).difference( ['name', 'id'] ).length )
							this.remove(addedUser);
					}
				}, this);
			}
			this.trigger('handledDuplicates');
		},
		filterOrganizersByCities: function(cities) {
			var data = [];
			var organizerIds = cities && cities.length ?
				_.uniq( _.flatten( cities.pluck('organizerIds') ) ) :
				null;
			if (organizerIds) {
				data = this.filter(function(user) {
					return _(organizerIds).contains(user.id);
				});
			}
			this.activeItems.reset(data);
			return this.activeItems.toJSON();
		},
		filterTalkersByTalks: function(talks) {
			var data = [];
			var talkers = talks.pluck('authorId');
			if (talkers) {
				data = this.filter(function(user) {
					return _(talkers).contains(user.id);
				});
			}
			this.activeItems.reset(data);
			return this.activeItems.toJSON();
		},
		filterAttendeesByEvents: function(events) {
			var data = [];
			var attendeeIds = events && events.length ?
				_.uniq( _.flatten( events.pluck('attendeeIds') ) ) :
				null;
			if (attendeeIds) {
				data = this.filter(function(user) {
					return _(attendeeIds).contains(user.id);
				});
			}
			this.activeItems.reset(data);
			return this.activeItems.toJSON();
		}
	});

	return models;
});