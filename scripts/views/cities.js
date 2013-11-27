define(["jquery", "backbone", "underscore"], function($, Backbone, _) {
	var CitiesView = Backbone.View.extend({
		template: _.template([
			'<ul class="inline-list">',
				'<li><a href="#">Tout</a></li>',
				'<% _.each(cities, function(city) { %>',
				'<li><a href="#" data-id="<%- city.id %>" style="background-color: <%- city.color %>"><%- city.name %></a></li>',
				'<% }) %>',
			'</ul>'].join('')
		),

		events: {
			'click a': 'toggleCity'
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
				this.$('a').removeClass('active');
			}
			e.preventDefault();
		}
	});
	return CitiesView;
});