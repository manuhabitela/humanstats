define(["backbone", "underscore", "d3", "d3utils", "moment", "d3tip", "mixins"], function(Backbone, _, d3, d3utils, moment) {
	moment.lang('fr');

	//simple lines chart, code mostly taken from a few mike bostock's blocks:
	//http://bl.ocks.org/mbostock/3883245 Line Chart
	//http://bl.ocks.org/mbostock/3884955 Multi-Series Line Chart
	//http://bl.ocks.org/mbostock/1642874 Line Transition
	var LinesChartDataView = Backbone.View.extend({
		className: 'LinesChart',
		initialize: function(options) {
			var that = this;
			this.data = options.data;

			this.margin = { top: 20, right: 20, bottom: 30, left: 50 };
			this.width = 700 - this.margin.left - this.margin.right;
			this.height = 600 - this.margin.top - this.margin.bottom;

			this.parseDate = d3.time.format("%Y-%m-%d").parse;

			this.x = d3.time.scale()
				.nice(d3.time.month)
				.range([0, this.width]);

			this.y = d3.scale.linear()
				.range([this.height, 0]);

			this.xAxis = d3.svg.axis()
				.scale(this.x)
				.orient("bottom")
				.ticks(d3.time.month, 1)
				.tickFormat(function(date, i) {
					date = moment(date);
					var format = 'MMM' + ((date.year() !== moment().year()) ? ' YY' : '');
					return date.format(format);
				});

			this.yAxis = d3.svg.axis()
				.scale(this.y)
				.orient("left");

			this.line = d3.svg.line()
				.interpolate('cardinal')
				.x(function(d) { return that.x(d.axisDate); })
				.y(function(d) { return that.y(d.attendees); });

			this.dotsScale = d3.scale.linear().domain([1, that.data.cities.length]).range([5, 3.5]);

			this.tip = d3.tip()
				.attr('class', 'ChartTooltip')
				.html(function(d) {
					var currentYear = moment().year(),
						eventDate = moment(d.date);
					return [
						'<div class="ChartTooltip-inner" style="background-color: ',
						that.data.cities.findWhere({ id: d.city }).get('color'),
						'">',
							'<span class="ChartTooltip-attendees">',
								d.attendees, ' ', _.pluralize('personne', d.attendees),
							'</span> ',
							'<span class="ChartTooltip-date">',
								'le ', eventDate.format('D MMMM' + (currentYear != eventDate.year() ? ' YYYY' : '')),
							'</span> ',
							'<span class="ChartTooltip-city">',
								'à ', d.city.substr(0, 1).toUpperCase() + d.city.substr(1),
							'</span>',
						'</div>'
					].join('');
				});
		},

		render: function() {
			if (!this.data) return false;
			var that = this;

			var data = _(this.data.filtered.events).map(function(d) {
				var obj = {
					date: that.parseDate(d.date),
					attendees: d.attendeeIds.length,
					city: d.city,
				};
				//i'm sure there's a better way but we set day of month to 1 to align values to axis...
				obj.axisDate = moment(obj.date).date(1).toDate();
				return obj;
			});

			var cities = _(data).chain().sortBy(function(d) { return d.date; }).groupBy(function(d) { return d.city; }).value();
			cities = _(cities).map(function(values, name) {
				return {
					name: name,
					values: values
				};
			});

			if (!this.chart) {
				this.chart = d3.select(this.el)
					.append('svg')
						.attr("width", this.width + this.margin.left + this.margin.right).attr("height", this.height + this.margin.top + this.margin.bottom)
						.append("g")
							.attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
							.attr("class", "LinesChart-container");

				this.chart.call(this.tip);
			}


			this.x.domain(d3.extent(data, function(d) { return d.axisDate; }));
			this.y.domain([0, d3.max(data, function(d) { return d.attendees; })+10]);

			if (!this.el.querySelector('.LinesChart-axis--x')) {
				this.chart.append("g")
					.attr("class", "LinesChart-axis LinesChart-axis--x")
					.attr("transform", "translate(0," + this.height + ")");
			}
			if (!this.el.querySelector('.LinesChart-axis--y')) {
				this.chart.append("g")
					.attr("class", "LinesChart-axis LinesChart-axis--y")
					.append("text")
						.attr("transform", "rotate(-90)")
						.attr("y", 6)
						.attr("dy", ".71em")
						.style("text-anchor", "end")
						.text("Participants");
			}

			this.chart.select('.LinesChart-axis--x').transition().call(this.xAxis);
			this.chart.select('.LinesChart-axis--y').transition().call(this.yAxis);

			var chartCities = this.chart.selectAll(".LinesChart-city").data(cities);
			chartCities.enter().append("g").attr("class", "LinesChart-city").append("path").attr("class", "LinesChart-line");

			this.chart.selectAll('.LinesChart-line').data(cities)
				.transition()
					.attr("d", function(d) { return that.line(d.values); })
					.style("stroke", function(d) { return that.data.cities.findWhere({ id: d.name }).get('color'); });

			chartCities.exit().remove();

			var chartDots = this.chart.selectAll(".LinesChart-dot").data(data);
			chartDots.enter().append("circle").attr("class", "LinesChart-dot");

			var tooltipTimeout = null;
			this.chart.selectAll(".LinesChart-dot")
				.on('.mouseover', null)
				.on('.mouseout', null)
				.on('mouseover', function(d) {
					clearTimeout(tooltipTimeout);
					that.tip.show(d);
				})
				.on('mouseout', function() {
					clearTimeout(tooltipTimeout);
					tooltipTimeout = setTimeout(that.tip.hide, 500);
				})
				.transition()
					.attr("r", this.dotsScale(cities.length))
					.attr("cx", function(d) { return that.x(d.axisDate); })
					.attr("cy", function(d) { return that.y(d.attendees); })
					.style("fill", function(d) { return that.data.cities.findWhere({ id: d.city }).get('color'); });

			chartDots.exit().remove();
		}
	});
	return LinesChartDataView;
});