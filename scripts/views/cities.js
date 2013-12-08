	define(["jquery", "backbone", "underscore"], function($, Backbone, _) {
	var CitiesView = Backbone.View.extend({
		template: _.template([
			'<ul class="CitiesList">',
				'<li class="CitiesList-item" data-color="#000"><label class="CitiesList-item-inner Button">',
					'<input type="checkbox" class="CitiesList-input CitiesList-toggle u-isInvisible">',
					'<span class="CitiesList-label">Tout cocher</span>',
				'</label></li>',
				'<% _.each(cities, function(city) { %>',
				'<li class="CitiesList-item" data-id="<%- city.id %>" data-color="<%- city.color %>"><label class="CitiesList-item-inner Button">',
					'<input type="checkbox" class="CitiesList-input">',
					'<span class="CitiesList-label"><%- city.name %></span>',
				'</label></li>',
				'<% }) %>',
			'</ul>'].join('')
		),

		events: {
			'click .CitiesList-input': 'onCityClick',
			'click .CitiesList-toggle': 'onToggleClick',
		},

		initialize: function() {
			this.render();
		},

		render: function() {
			this.$el.html( this.template({ cities: this.collection.toJSON() }) );
			this.updateView();
		},

		onCityClick: function(e) {
			var $target = $(e.currentTarget);
			if (!$target.hasClass('.CitiesList-toggle'))
				this.toggleCity( $target.closest('.CitiesList-item') );
		},

		onToggleClick: function(e) {
			this.collection[this.collection.activeItems.length > 0 ? 'deactivateAll' : 'activateAll']();
			this.updateView();
		},

		toggleCity: function(city) {
			var cityId = city && city.attr('data-id');
			if (cityId)
				this.collection.toggle(cityId);
			this.updateView();
		},

		updateView: function() {
			var that = this;
			this.$('.CitiesList-item').each(function(n, item) {
				var $item = $(item);
				var cityId = $item.attr('data-id');
				var $inner = $item.find('.CitiesList-item-inner');
				var cityIsActive = that.collection.isActive(cityId);
				if (cityIsActive) {
					$inner.css({ 'color': 'white', 'background-color': $item.attr('data-color') });
					$item.find('.CitiesList-input').prop('checked', true);
				}
				else {
					$inner.css({ 'color': $item.attr('data-color'), 'background-color': '' });
					$item.find('.CitiesList-input').prop('checked', false);
				}
				$item.toggleClass('CitiesList-item--active', cityIsActive);
			});

			var activeItems = this.collection.activeItems.length > 0;
			this.$('.CitiesList-toggle + .CitiesList-label')
				.text(activeItems && activeItems !== that.collection.length ? 'Tout décocher' : 'Tout cocher')
				.closest('.CitiesList-item').toggleClass('CitiesList-item--active', activeItems);
		}
	});
	return CitiesView;
});