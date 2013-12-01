define(["backbone", "underscore", "d3", "d3utils", "moment", "d3tip", "mixins"], function(Backbone, _, d3, d3utils, moment) {
	moment.lang('fr');

	var BubblesChartDataView = Backbone.View.extend({

		template: ['<svg class="bubble"></svg>',
			'<div class="bubbles-slider">',
				'<output class="bubbles-slider__min">1</output>',
				'<input class="bubbles-slider__input" name="bubbles-slider" type="range" min="1" step="1" value="1">',
				'<output class="bubbles-slider__max"></output>',
				'<output class="bubbles-slider__value"></output>',
			'</div>'].join(''),

		initialize: function() {
			_.bindAll(this, 'onSliderChange', 'onSliderMouseup', 'render');
		},

		render: function(attendees) {
			if (!this.data) return false;

			if (!this.$el.children().length) {
				this.$el.html( this.template );
				this.$slider = {
					min: this.$('.bubbles-slider__min'),
					input: this.$('.bubbles-slider__input'),
					value: this.$('.bubbles-slider__value'),
					max: this.$('.bubbles-slider__max')
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
				.attr('class', 'graph-tip')
				.html(function(d) {
					return [
						'<div class="graph-tip__inner" style="background-color: ',
						that.originalData.cities.findWhere({ id: d.mainCity }).get('color'),
						'">',
							'<span class="graph-tip__attendee">',
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
				.value(function(d) { return d.talkIds && d.talkIds.length ? d.talkIds.length*4 : 1; })
				.radius(function(d) { return 9 + d; });

			var svg = d3.select(this.el.querySelector('svg'))
				.attr("width", diameter)
				.attr("height", diameter)
				.attr("class", "bubble");
			svg.call(tip);

			var node = svg.selectAll(".node")
				.data(bubble.nodes({ children: attendees}).filter(function(d) { return !d.children; }));

			node.enter().append("g").attr("class", "node").append("circle").attr('class', 'node-circle');

			node.transition()
				.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

			node.selectAll('.node-circle').data(function(d) { return [d]; })
				.transition()
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