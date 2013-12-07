define(["backbone", "underscore", "d3", "d3utils", "moment", "d3tip", "mixins"], function(Backbone, _, d3, d3utils, moment) {
	moment.lang('fr');

	//bubbles chart, code based on http://bl.ocks.org/mbostock/4063269 Bubble Chart
	var BubblesChartDataView = Backbone.View.extend({
		className: 'BubblesChart',
		template: [
			'<div class="BubblesChart-info u-marginBl">',
				'<div class="BubblesChart-slider Grid Grid--center u-paddingButtonM u-marginBs">',
					'<output class="BubblesChart-slider-min Grid-cell Grid-cell--sizeFit">1</output>',
					'<input class="BubblesChart-slider-input Grid-cell Grid-cell--sizeFit" name="BubblesChart-slider" type="range" min="1" step="1" value="1">',
					'<output class="BubblesChart-slider-max Grid-cell Grid-cell--sizeFit"></output>',
				'</div>',
				'<div class="BubblesChart-text u-textCenter u-paddingButtonM">',
					'<p>',
						'<output class="BubblesChart-attendeesCount"></output> <output class="BubblesChart-slider-value">1</output> fois <output class="BubblesChart-city"></output>',
					'</p>',
				'</div>',
			'</div>',
			'<svg class="BubblesChart-chart"></svg>'
		].join(''),

		initialize: function(options) {
			this.data = options.data;

			_.bindAll(this, 'onSliderChange', 'onSliderMouseup', 'render', 'updateFilteredData', 'updateInfoView');

			var that = this;
			this.attendees = [];
			this.diameter = 700;
			this.tip = d3.tip()
				.attr('class', 'ChartTooltip')
				.html(function(d) {
					return [
						'<div class="ChartTooltip-inner ChartTooltip-inner--withImg Grid" style="background-color: ',
						that.data.cities.findWhere({ id: d.mainCities[0] }).get('color'),
						'">',
							'<span class="ChartTooltip-text Grid-cell Grid-cell--sizeFit u-alignMiddle">',
								d.name,
							'</span> ',
							'<img class="ChartTooltip-img Grid-cell Grid-cell--sizeFit u-alignMiddle" src="' + d.img + '">',
						'</div>'
					].join('');
				});
			this.bubble = d3.layout.pack()
				.sort(null)
				.size([this.diameter, this.diameter])
				.padding(4)
				.value(function(d) { return d.talkIds && d.talkIds.length ? d.talkIds.length*(that.attendees.length > 500 ? 2 : 4) : 1; })
				.radius(function(d) { return that.attendees.length > 500 ? 6 + d : 12 + d; });
		},

		render: function() {
			if (!this.data) return false;
			var that = this;

			if (!this.$el.children().length) {
				this.$el.html( this.template );
				this.$slider = {
					min: this.$('.BubblesChart-slider-min'),
					input: this.$('.BubblesChart-slider-input'),
					value: this.$('.BubblesChart-slider-value'),
					max: this.$('.BubblesChart-slider-max'),
					attendeesCount: this.$('.BubblesChart-attendeesCount'),
					city: this.$('.BubblesChart-city'),
				};
				this.$slider.input.on('change', this.onSliderChange);
				this.$slider.input.on('mouseup', this.onSliderMouseup);

			}

			this.updateFilteredData();
			this.updateInfoView();

			this.attendees = _(this.data.filtered.filteredAttendees).shuffle();

			this.$slider.input.attr('max', this.data.filtered.cities.length > 1 ?
				_(this.attendees).chain().pluck('attendedEventIds').map(function (attended) { return attended.all.length; }).max().value() :
				this.data.filtered.events.length
			);
			this.$slider.max.text( this.$slider.input.attr('max') );
			if (!this.attendees)
				this.$slider.input.val(1);


			if (!this.svg) {
				this.svg = d3.select(this.el.querySelector('svg'))
					.attr("width", this.diameter)
					.attr("height", this.diameter)
					.attr("class", "BubblesChart-bubble");
				this.svg.call(this.tip);
			}

			var node = this.svg.selectAll(".BubblesChart-node")
				.data(this.bubble.nodes({ children: this.attendees}).filter(function(d) { return !d.children; }));

			node.enter().append("g").attr("class", "BubblesChart-node").append("circle").attr('class', 'BubblesChart-node-circle').style("fill", function(d) { return "#fff"; });

			node.transition()
				.duration(500)
				.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

			node.selectAll('.BubblesChart-node-circle').data(function(d) { return [d]; })
				.transition()
				.duration(500)
				.attr("r", function(d) { return d.id ? d.r : 0; })
				.style("fill", function(d) { return d.id ? that.data.cities.findWhere({ id: d.mainCities[0] }).get('color') : ''; });

			var tooltipTimeout = null;
			node
				.on('.mouseover', null)
				.on('.mouseout', null)
				.on('mouseover', function(d) {
					clearTimeout(tooltipTimeout);
					that.tip.show(d);
				})
				.on('mouseout', function() {
					clearTimeout(tooltipTimeout);
					tooltipTimeout = setTimeout(that.tip.hide, 500);
				});

			node.exit().remove();
		},

		onSliderChange: function(e) {
			this.render();
		},

		updateFilteredData: function() {
			this.data.filtered.filteredAttendees = _(this.data.filtered.attendees).filter(function(user) {
				if (user.attendedEventIds) {
					var city = this.data.filtered.cities.length > 1 || !this.data.filtered.cities.length ? 'all' : this.data.filtered.cities[0].id;
					if (user.attendedEventIds[city])
						return user.attendedEventIds[city].length >= Math.round(this.$slider.input.val());
					return false;
				}
				return false;
			}, this);
		},

		updateInfoView: function() {
			this.$slider.value.text( this.$slider.input.val() );
			var tpl = '<%- attendees %> <%= _.pluralize("personne", attendees) %> <%= _.pluralize("venue", attendees) %>';
			this.$slider.attendeesCount.text( _.template(tpl, { attendees: this.data.filtered.filteredAttendees.length } ) );
			this.$slider.city.text( this.data.filtered.cities.length > 1 || !this.data.filtered.cities.length ?
				'aux Human Talks' :
				'à ' + this.data.filtered.cities[0].name
			);
		},

		onSliderMouseup: function(e) {
			this.$slider.input.val( Math.round(this.$slider.input.val()) );
		}
	});
	return BubblesChartDataView;
});