define(["jquery", "backbone", "underscore"], function($, Backbone, _) {
	var CitiesView = Backbone.View.extend({
		template: _.template([
			'<ul class="CitiesList">',
				'<li><a href="#" class="CitiesList-link" data-color="#000">Tout</a></li>',
				'<% _.each(cities, function(city) { %>',
				'<li><a href="#" class="CitiesList-link" data-id="<%- city.id %>" data-color="<%- city.color %>"><%- city.name %></a></li>',
				'<% }) %>',
			'</ul>'].join('')
		),

		events: {
			'click .CitiesList-link': 'toggleCity'
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
			var that = this;

			if (cityId) {
				this.collection.toggle(cityId);
				$city.toggleClass('CitiesList-link--active', this.collection.isActive(cityId));
			} else {
				this.collection.deactivateAll();
				this.$('.CitiesList-link').removeClass('CitiesList-link--active');
			}

			this.$('.CitiesList-link').each(function(n, link) {
				var $link = $(link);
				if ($link.hasClass('CitiesList-link--active') || (!$link.attr('data-id') && !that.$('.CitiesList-link--active').length))
					$link.css({ 'color': 'white', 'background-color': $link.attr('data-color') });
				else
					$link.css({ 'color': $link.attr('data-color'), 'background-color': '' });
			});
			e.preventDefault();
		}
	});
	return CitiesView;
});