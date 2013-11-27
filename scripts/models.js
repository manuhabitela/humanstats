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
			this.activeItems = new Backbone.Collection([], { model: City });
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
			_.bindAll(this, 'removeCurrents');

			if (options && options.unfinished === false) {
				options.silent = false;
				this.once('reset', this.removeCurrents);
			}
		},

		removeCurrents: function() {
			var now = new Date();
			var currentMonth = now.getMonth()+1;
			var currentYear = now.getFullYear();
			this.each(function(event) {
				var date = event.get('date').split('-');
				var year = date[0]*1;
				var month = date[1]*1;
				if (year > currentYear || (year === currentYear && month > currentMonth)) {
					this.remove(event);
				}
			}, this);
		}
	});


	var Talk = models.Talk = BaseModel.extend({
		htURL: 'http://humantalks.com/talks/<%= id %>-<%= slug %>',
		getURL: function() {
			return _.template(this.htURL, { id: this.get('id'), slug: this.get('slug') });
		}
	});
	var Talks = models.Talks = BaseCollection.extend({
		model: Talk
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
			var attendedEventIds = [];
			var id = this.get('id');
			events.each(function(event) {
				if ( id && _(event.get('attendeeIds')).contains(id) ) {
					attendedEventIds.push(event.get('id'));
				}
			}, this);
			if (attendedEventIds.length)
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
		}
	});
	var Users = models.Users = BaseCollection.extend({
		model: User,
		initialize: function() {
			_.bindAll(this, 'handleDuplicates');
			this.on('add', this.handleDuplicates);
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
		handleDuplicates: function(addedUser) {
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
		}
	});

	return models;
});