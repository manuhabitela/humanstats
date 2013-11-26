define(["backbone", "underscore", "d3", "d3utils", "mixins"], function(Backbone, _, d3, d3utils) {

	var LinesChartDataView = Backbone.View.extend({

		render: function() {
			if (!this.data) return false;
			var that = this;
			var margin = {top: 20, right: 20, bottom: 30, left: 50},
				width = 650 - margin.left - margin.right,
				height = 500 - margin.top - margin.bottom;

			var parseDate = d3.time.format("%Y-%m-%d").parse;

			var x = d3.time.scale()
				.range([0, width]);

			var y = d3.scale.linear()
				.range([height, 0]);

			var xAxis = d3.svg.axis()
				.scale(x)
				.orient("bottom");

			var yAxis = d3.svg.axis()
				.scale(y)
				.orient("left");

			var line = d3.svg.line()
				.interpolate('basis')
				.x(function(d) { return x(d.date); })
				.y(function(d) { return y(d.attendees); });



			var data = _(this.data.events).map(function(d) {
				return {
					date: parseDate(d.date),
					attendees: d.attendeeIds.length,
					city: d.city,
				};
			});

			var cities = _(data).chain().sortBy(function(d) { return d.date; }).groupBy(function(d) { return d.city; }).value();
			_(cities).each(function(values, city) {
				_(values).each(function(v, n) {
					if (n == values.length-1 && v.attendees === 0)
						values.splice(-1, 1);
				});
			});
			cities = _(cities).map(function(values, name) {
				return {
					name: name,
					values: values
				};
			});

			var chart = d3.select(this.el).attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom);
			if (!this.el.querySelector('g.chart-container')) {
				chart = chart
					.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
					.attr("class", "chart-container");
			} else {
				chart = chart.select('g.chart-container');
			}

			x.domain(d3.extent(data, function(d) { return d.date; }));
			y.domain(d3.extent(data, function(d) { return d.attendees; }));

			if (!this.el.querySelector('.axis--x')) {
				chart.append("g")
					.attr("class", "axis axis--x")
					.attr("transform", "translate(0," + height + ")")
					.call(xAxis);
			}
			if (!this.el.querySelector('.axis--y')) {
				chart.append("g")
					.attr("class", "axis axis--y")
					.append("text")
						.attr("transform", "rotate(-90)")
						.attr("y", 6)
						.attr("dy", ".71em")
						.style("text-anchor", "end")
						.text("Participants");
			}

			chart.select('.axis--x').transition().call(xAxis);
			chart.select('.axis--y').transition().call(yAxis);

			var existingCities = chart.selectAll(".city").data(cities);

			var newCities = existingCities.enter().append("g").attr("class", "city");
			newCities.append("path").attr("class", "line");

			chart.selectAll('.line').data(cities).transition()
				.attr("d", function(d) { return line(d.values); })
				.style("stroke", function(d) { return that.originalData.cities.findWhere({ id: d.name }).get('color'); });

			existingCities.exit().remove();
		}
	});
	return LinesChartDataView;
});