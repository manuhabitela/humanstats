define(["backbone", "underscore", "./data.text", "./data.map", "./data.lines"], function(Backbone, _, TextDataView, MapDataView, LinesChartDataView) {

	var DataView = Backbone.View.extend({
		initialize: function(options) {
			this.originalData = {
				cities: (options.citiesCollection || []),
				events: (options.eventsCollection || []),
				talks: (options.talksCollection || []),
				users: (options.usersCollection || [])
			};

			this.subViews = {
				"text": new TextDataView({ el: this.$('.text') }),
				"map": new MapDataView({ el: this.$('.map') }),
				"lines": new LinesChartDataView({ el: this.$('.lines') }),
			};

			_(this.subViews).each(function(subView) {
				subView.originalData = this.originalData;
				if (subView.initializeWithData) subView.initializeWithData();
			}, this);

			this.filterData();
			this.render();

			_.bindAll(this, 'onCityChange');
			this.originalData.cities.on('activate deactivate deactivateAll', this.onCityChange);

		},

		render: function() {
			if (this.subViews) {
				_(this.subViews).each(function(subView) {
					subView.render();
				});
			}
		},

		onCityChange: function(city, activeItems) {
			this.filterData( (activeItems ? activeItems.toJSON() : []) );
			this.render();
		},

		filterData: function(cities) {
			if (!this.data) this.data = {};

			this.data.cities = this.filteredCities(cities);

			_(['Events', 'Talks', 'Organizers']).each(function(type) {
				this.data[type.toLowerCase()] = this['filtered' + type](this.data.cities);
			}, this);

			this.data.talkers = this.filteredTalkers(this.data.talks);

			_(['Attendees', 'Appearances']).each(function(type) {
				this.data[type.toLowerCase()] = this['filtered' + type](this.data.events);
			}, this);

			if (this.subViews) {
				_(this.subViews).each(function(subView) {
					subView.data = this.data;
				}, this);
			}
		},

		filteredCities: function(cities) {
			return cities && cities.length ? cities : this.originalData.cities.toJSON();
		},

		//I am so inspired to name those things
		_filteredStuff: function(cities, stuff) {
			var data;
			var cityIds = _(cities).pluck('id');
			if (cities) {
				data = _(stuff.filter(function(yolo) {
					return _(cityIds).contains(yolo.get('city'));
				})).map(function(yolo) {
					return yolo.toJSON();
				});
			} else
				data = stuff.toJSON();
			return data;
		},

		filteredEvents: function(cities) {
			return this._filteredStuff(cities, this.originalData.events);
		},

		filteredTalks: function(cities) {
			return this._filteredStuff(cities, this.originalData.talks);
		},

		filteredOrganizers: function(cities) {
			var organizerIds = _.uniq( _.flatten( _(cities).pluck('organizerIds') ) );
			return _( this.originalData.users.filter(function(user) {
				return _(organizerIds).contains(user.get('id'));
			}) ).map(function(user) { return user.toJSON(); });
		},

		filteredTalkers: function(talks) {
			var talkers = _(talks).pluck('authorId');
			return _( this.originalData.users.filter(function(user) {
				return _(talkers).contains(user.get('id'));
			}) ).map(function(user) { return user.toJSON(); });
		},

		filteredAttendees: function(events) {
			var attendeeIds = _.uniq( _.flatten( _(events).pluck('attendeeIds') ) );
			return _( this.originalData.users.filter(function(user) {
				return _(attendeeIds).contains(user.get('id'));
			}) ).map(function(user) { return user.toJSON(); });
		},

		filteredAppearances: function(events) {
			return _.reduce(events, function(memo, event) {
				return memo + event.attendeeIds.length;
			}, 0);
		}
	});
	return DataView;
});