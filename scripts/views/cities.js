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
	return CitiesView;
});