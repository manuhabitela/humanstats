var $ = require('../bower_components/jquery/jquery');
var Backbone = require('backbone');
var _ = require('underscore');
Backbone.$ = $;

var Cities = module.exports.Cities = Backbone.View.extend({
	template: _.template([
		'<ul class="inline-list">',
			'<li>Tout</li>',
			'<% _.each(cities, function(city) { %>',
			'<li data-id="<%= city.id %>"><%- city.name %></li>',
			'<% }) %>',
		'</ul>'].join('')
	),

	events: {
		'click li': 'selectCity'
	},

	initialize: function() {
		this.render();
	},

	render: function() {
		this.$el.html( this.template({ cities: this.collection.toJSON() }) );
	},

	selectCity: function(e) {
		this.$('li').removeClass('active');
		$(e.currentTarget).addClass('active');
		var dataId = this.$('li.active').attr('data-id');
		if (dataId)
			this.collection.activate(dataId);
		else
			this.collection.desactivate();
	}
});

var Data = module.exports.Data = Backbone.View.extend({
	template: _.template([
		'<div class="row">',
			'<div class="col">',
				'<h2>Les Human Talks, c\'est :</h2>',
				'<ul>',
					'<li><%- talks.length %> talks</li>',
					'<li>en <%- events.length %> évènements</li>',
					'<% if (cities && cities.length > 1) { %><li>dans <%- cities.length %> villes</li><% } %>',
				'</ul>',
			'</div>',
			'<div class="col">',
				'<h2>Les Human Talks, c\'est :</h2>',
				'<ul>',
					'<li><%- organizers.length %> organiseurs</li>',
					'<li><%- talkers.length %> talkers</li>',
					'<li><%- attendees.length %> participants venus <%- appearances %> fois</li>',
				'</ul>',
			'</div>',
		'</div>'
		].join('')
	),

	initialize: function(options) {
		this.cities = options.cities || [];
		this.events = options.events || [];
		this.talks = options.talks || [];
		this.users = options.users || [];
		this.filterData();
		this.render();

		this.cities.on('activate desactivate', _(this.onCityChange).bind(this));
	},

	onCityChange: function(city) {
		this.filterData(city);
		this.render();
	},

	render: function() {
		this.$el.html( this.template({
			cities: this.data.cities,
			events: this.data.events,
			talks: this.data.talks,
			organizers: this.data.organizers,
			talkers: this.data.talkers,
			attendees: this.data.attendees,
			appearances: this.data.appearances
		}) );
	},

	filterData: function(city) {
		if (!this.data) this.data = {};
		_(['Cities', 'Events', 'Talks', 'Organizers', 'Talkers', 'Attendees', 'Appearances']).each(function(type) {
			this.data[type.toLowerCase()] = this['filtered' + type](city);
		}, this);
	},

	filteredCities: function(city) {
		return city ? [city.toJSON()] : this.cities.toJSON();
	},

	filteredEvents: function(city) {
		return city ? _(this.events.where({ city: city.get('id') })).map(function(ev) { return ev.toJSON(); }) : this.events.toJSON();
	},

	filteredTalks: function(city) {
		return city ? _(this.talks.where({ city: city.get('id') })).map(function(ta) { return ta.toJSON(); }) : this.talks.toJSON();
	},

	filteredOrganizers: function(city) {
		var cities = this.filteredCities(city);
		var organizerIds = _.uniq( _.flatten( _(cities).pluck('organizerIds') ) );
		return this.users.filter(function(user) {
			return _(organizerIds).contains(user.get('id'));
		});
	},

	filteredTalkers: function(city) {
		var talks = this.filteredTalks(city);
		var talkers = _(talks).pluck('authorId');
		return this.users.filter(function(user) {
			return _(talkers).contains(user.get('id'));
		});
	},

	filteredAttendees: function(city) {
		var events = this.filteredEvents(city);
		var attendeeIds = _.uniq( _.flatten( _(events).pluck('attendeeIds') ) );
		return this.users.filter(function(user) {
			return _(attendeeIds).contains(user.get('id'));
		});
	},

	filteredAppearances: function(city) {
		var events = this.filteredEvents(city);
		return _.reduce(events, function(memo, event) {
			return memo + event.attendeeIds.length;
		}, 0);
	}
});