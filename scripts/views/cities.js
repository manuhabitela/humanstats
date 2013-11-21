define(["jquery", "backbone", "underscore"], function($, Backbone, _) {
	var CitiesView = Backbone.View.extend({
		template: _.template([
			'<ul class="inline-list">',
				'<li>Tout</li>',
				'<% _.each(cities, function(city) { %>',
				'<li data-id="<%= city.id %>"><%- city.name %></li>',
				'<% }) %>',
			'</ul>'].join('')
		),

		events: {
			'click li': 'toggleCity'
		},

		initialize: function() {
			this.render();
		},

		render: function() {
			this.$el.html( this.template({ cities: this.collection.toJSON() }) );
		},

		toggleCity: function(e) {
			var $city = $(e.currentTarget);
			var cityId = $city.attr('data-id');
			if (cityId) {
				this.collection.toggle(cityId);
				$city.toggleClass('active', this.collection.isActive(cityId));
			} else {
				this.collection.deactivateAll();
				this.$('li').removeClass('active');
			}
		}
	});
	return CitiesView;
});