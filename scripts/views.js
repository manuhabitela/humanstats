var $ = require('../bower_components/jquery/jquery');
var Backbone = require('backbone');
var _ = require('underscore');
Backbone.$ = $;

var Cities = module.exports.Cities = Backbone.View.extend({
	template: _.template([
		'<ul class="inline-list"><% _.each(cities, function(city) { %>',
			'<li data-id="<%= city.id %>"><%- city.name %></li>',
		'<% }) %></ul>'].join('')
	),


	initialize: function() {
		this.render();
	},

	render: function() {
		this.$el.html( this.template({ cities: this.collection.toJSON() }) );
	},

});

var Data = module.exports.Data = Backbone.View.extend({
	template: _.template([
		'<div class="row">',
			'<div class="col">',
				'<h2>Les Human Talks, c\'est :</h2>',
				'<ul>',
					'<li><%- talksNb %> talks</li>',
					'<li>en <%- eventsNb %> évènements</li>',
					'<% if (citiesNb) { %><li>dans <%- citiesNb %> villes</li><% } %>',
				'</ul>',
			'</div>',
			'<div class="col">',
				'<h2>Les Human Talks, c\'est :</h2>',
				'<ul>',
					'<li><%- organizersNb %> organiseurs</li>',
					'<li><%- talkersNb %> talkers</li>',
					'<li><%- attendeesNb %> participants venus <%- appearancesNb %> fois</li>',
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
		this.render();

	},

	render: function() {
		var citiesNb = this.cities.length;
		var eventsNb = this.events.length;
		var talksNb = this.talks.length;
		var organizersNb = _.uniq( _.flatten( _(this.cities).pluck('organizerIds') ) ).length;
		var talkersNb = _(this.events).pluck('authorId').length;
		var attendeesNb = _.uniq( _.flatten( _(this.events).pluck('attendeeIds') ) ).length;
		var appearancesNb = _.reduce(this.events, function(memo, event) {
			return memo + event.attendeeIds.length; },
		0);
		this.$el.html( this.template({
			citiesNb: citiesNb,
			eventsNb: eventsNb,
			talksNb: talksNb,
			organizersNb: organizersNb,
			talkersNb: talkersNb,
			attendeesNb: attendeesNb,
			appearancesNb: appearancesNb
		}) );
	},
	}
});