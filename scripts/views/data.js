define(["backbone", "underscore", "tabs", "./data.info", "./data.cities", "./data.events", "./data.attendees"],
	function(Backbone, _, tabs, TextDataView, MapDataView, LinesChartDataView, BubblesChartDataView) {

	var DataView = Backbone.View.extend({

		template: [
			'<div class="Tabs">',
				'<ul class="Tabs-tabs">',
					'<li class="Tabs-tab"><a class="Tabs-link" href="#cities">Les villes</a></li>',
					'<li class="Tabs-tab"><a class="Tabs-link" href="#events">Les évènements</a></li>',
					'<li class="Tabs-tab"><a class="Tabs-link" href="#attendees">Les participants</a></li>',
					'<li class="Tabs-tab"><a class="Tabs-link" href="#talks">Les talks</a></li>',
				'</ul>',
				'<ul id="info" class="TextChart"></ul>',
				'<div class="Data Tabs-contents">',
					'<div id="attendees" class="Tabs-content BubblesChart"></div>',
					'<div id="cities" class="Tabs-content MapChart"></div>',
					'<div id="events" class="Tabs-content LinesChart"></div>',
				'</div>',
			'</div>'
		].join(''),

		initialize: function(options) {
			this.originalData = {
				cities: (options.citiesCollection || []),
				events: (options.eventsCollection || []),
				talks: (options.talksCollection || []),
				users: (options.usersCollection || [])
			};

			this.initDOM();

			this.subViews = {
				"attendees": new BubblesChartDataView({ el: this.$('.BubblesChart') }),
				"info": new TextDataView({ el: this.$('.TextChart') }),
				"cities": new MapDataView({ el: this.$('.MapChart') }),
				"events": new LinesChartDataView({ el: this.$('.LinesChart') })
			};

			this.filterData();

			_(this.subViews).each(function(subView) {
				subView.originalData = this.originalData;
				if (subView.initializeWithData) subView.initializeWithData();
			}, this);


			this.render();

			_.bindAll(this, 'onCityChange', 'render');
			this.originalData.cities.on('activate deactivate deactivateAll', this.onCityChange);
			this.on('tab.show', this.render);
		},

		initDOM: function() {
			this.$el.html( this.template );
			new tabs(this);
		},

		render: function() {
			if (this.subViews) {
				_(this.subViews).each(function(subView) {
					if (!subView.$el.hasClass('Tabs-content--hidden'))
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