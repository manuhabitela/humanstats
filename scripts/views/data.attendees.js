define(["backbone", "underscore", "d3", "d3utils", "moment", "d3tip", "mixins"], function(Backbone, _, d3, d3utils, moment) {
	moment.lang('fr');

	var BubblesChartDataView = Backbone.View.extend({
		className: 'BubblesChart',
		template: ['<svg class="BubblesChart-chart"></svg>',
			'<div class="BubblesChart-slider">',
				'<output class="BubblesChart-slider-min">1</output>',
				'<input class="BubblesChart-slider-input" name="BubblesChart-slider" type="range" min="1" step="1" value="1">',
				'<output class="BubblesChart-slider-max"></output>',
				'<output class="BubblesChart-slider-value"></output>',
			'</div>'].join(''),

		initialize: function() {
			_.bindAll(this, 'onSliderChange', 'onSliderMouseup', 'render');
		},

		render: function(attendees) {
			if (!this.data) return false;

			if (!this.$el.children().length) {
				this.$el.html( this.template );
				this.$slider = {
					min: this.$('.BubblesChart-slider-min'),
					input: this.$('.BubblesChart-slider-input'),
					value: this.$('.BubblesChart-slider-value'),
					max: this.$('.BubblesChart-slider-max')
				};
				this.$slider.input.on('change', this.onSliderChange);
				this.$slider.input.on('mouseup', this.onSliderMouseup);
			}


			attendees = _(attendees || this.data.attendees).shuffle();

			this.$slider.input.attr('max', this.data.cities.length > 1 ? _(attendees).chain().pluck('attendedEventIds').map(function (attended) { return attended.length; }).max().value() : this.data.events.length);
			this.$slider.max.text( this.$slider.input.attr('max') );
			if (!attendees)
				this.$slider.input.val(1);

			var that = this;
			var diameter = 700;

			var tip = d3.tip()
				.attr('class', 'ChartTooltip')
				.html(function(d) {
					return [
						'<div class="ChartTooltip-inner" style="background-color: ',
						that.originalData.cities.findWhere({ id: d.mainCity }).get('color'),
						'">',
							'<span class="ChartTooltip-attendee">',
								d.name,
							'</span> ',
						'</div>'
					].join('');
				});
			var tooltipTimeout = null;

			var bubble = d3.layout.pack()
				.sort(null)
				.size([diameter, diameter])
				.padding(4)
				.value(function(d) { return d.talkIds && d.talkIds.length ? d.talkIds.length*(attendees.length > 500 ? 2 : 4) : 1; })
				.radius(function(d) { return attendees.length > 500 ? 6 + d : 12 + d; });

			var svg = d3.select(this.el.querySelector('svg'))
				.attr("width", diameter)
				.attr("height", diameter)
				.attr("class", "BubblesChart-bubble");
			svg.call(tip);

			var node = svg.selectAll(".BubblesChart-node")
				.data(bubble.nodes({ children: attendees}).filter(function(d) { return !d.children; }));

			node.enter().append("g").attr("class", "BubblesChart-node").append("circle").attr('class', 'BubblesChart-node-circle').style("fill", function(d) { return "#fff"; });

			node.transition()
				.duration(500)
				.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

			node.selectAll('.BubblesChart-node-circle').data(function(d) { return [d]; })
				.transition()
				.duration(500)
				.attr("r", function(d) { return d.id ? d.r : 0; })
				.style("fill", function(d) { return d.id ? that.originalData.cities.findWhere({ id: d.mainCity }).get('color') : ''; });

			node
				.on('mouseover', function(d) {
					clearTimeout(tooltipTimeout);
					tip.show(d);
				})
				.on('mouseout', function() {
					clearTimeout(tooltipTimeout);
					tooltipTimeout = setTimeout(tip.hide, 500);
				});

			node.exit().remove();
		},

		onSliderChange: function(e) {
			this.data.filteredAttendees = _(this.data.attendees).filter(function(user) {
				return user.attendedEventIds && user.attendedEventIds.length >= Math.round(this.$slider.input.val());
			}, this);

			this.$slider.value.text( this.$slider.input.val() );

			this.render(this.data.filteredAttendees);
		},

		onSliderMouseup: function(e) {
			this.$slider.input.val( Math.round(this.$slider.input.val()) );
		}
	});
	return BubblesChartDataView;
});