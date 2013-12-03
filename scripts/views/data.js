define(["backbone", "underscore", "tabs", "./data.info", "./data.cities", "./data.events", "./data.attendees"],
	function(Backbone, _, tabs, TextDataView, MapDataView, LinesChartDataView, BubblesChartDataView) {

	var DataView = Backbone.View.extend({

		template: [
			'<div class="Tabs">',
				'<ul class="Tabs-tabs">',
					'<li class="Tabs-tab"><a class="Tabs-link Button" href="#cities">Les villes</a></li>',
					'<li class="Tabs-tab"><a class="Tabs-link Button" href="#events">Les évènements</a></li>',
					'<li class="Tabs-tab"><a class="Tabs-link Button" href="#attendees">Les participants</a></li>',
					'<li class="Tabs-tab"><a class="Tabs-link Button" href="#talks">Les talks</a></li>',
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
			this.data = options.data;

			this.initDOM();

			var subViewOpts = { data: this.data };
			this.subViews = {
				"attendees": new BubblesChartDataView( _.extend(subViewOpts, { el: this.$('.BubblesChart') }) ),
				"cities": new MapDataView( _.extend(subViewOpts, { el: this.$('.MapChart') }) ),
				"events": new LinesChartDataView( _.extend(subViewOpts, { el: this.$('.LinesChart') }) )
			};

			_.bindAll(this, 'render');

			this.render();

			this.data.on('filterData', this.render);
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
		}
	});
	return DataView;
});