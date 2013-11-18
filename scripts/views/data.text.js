define(["jquery", "backbone", "underscore"], function($, Backbone, _) {

	var TextDataView = Backbone.View.extend({
		template: _.template([
			'<div class="data-text"><div class="row">',
				'<div class="col">',
					'<h2>Les Human Talks <% if (cities && cities.length === 1) { %><%- cities[0].name %><% } %>, c\'est :</h2>',
					'<ul>',
						'<li><%- talks.length %> talks</li>',
						'<li>en <%- events.length %> évènements</li>',
						'<% if (cities && cities.length > 1) { %><li>dans <%- cities.length %> villes</li><% } %>',
						'<li><%- organizers.length %> organiseurs</li>',
						'<li><%- talkers.length %> talkers</li>',
						'<li><%- attendees.length %> participants venus <%- appearances %> fois</li>',
					'</ul>',
				'</div>',
			'</div></div>'
			].join('')
		),

		render: function() {
			if (!this.data) return false;

			this.$el.html( this.template({
				cities: this.data.cities,
				events: this.data.events,
				talks: this.data.talks,
				organizers: this.data.organizers,
				talkers: this.data.talkers,
				attendees: this.data.attendees,
				appearances: this.data.appearances
			}) );
		}
	});
	return TextDataView;
});