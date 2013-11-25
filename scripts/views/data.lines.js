define(["backbone", "underscore", "d3", "d3utils", "mixins"], function(Backbone, _, d3, d3utils) {

	var LinesChartDataView = Backbone.View.extend({

		render: function() {
			if (!this.data) return false;
			var margin = {top: 20, right: 20, bottom: 30, left: 50},
				width = 650 - margin.left - margin.right,
				height = 500 - margin.top - margin.bottom;

			var parseDate = d3.time.format("%Y-%m-%d").parse;

			var x = d3.time.scale()
				.range([0, width]);

			var y = d3.scale.linear()
				.range([height, 0]);

			var color = d3.scale.category10();

			var xAxis = d3.svg.axis()
				.scale(x)
				.orient("bottom");

			var yAxis = d3.svg.axis()
				.scale(y)
				.orient("left");

			var line = d3.svg.line()
				.interpolate('basis')
				.x(function(d) { return x(d.date); })
				.y(function(d) { return y(d.temperature); });

			d3.select(this.el).select('svg').remove();
			var svg = d3.select(this.el).append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			var data = _(this.data.events).map(function(d) {
				return {
					date: parseDate(d.date),
					temperature: d.attendeeIds.length,
					city: d.city
				};
			});
			var oldData = data;
			data = _(data).sortBy(function(d) {
				return d.date;
			});
			data = _(data).groupBy(function(d) {
				return d.city;
			});
			_(data).each(function(values, city) {
				_(values).each(function(v, n) {
					if (n == values.length-1 && v.temperature === 0)
						values.splice(-1, 1);
				});
			});

			color.domain( _(data).keys() );
			var cities = color.domain().map(function(name) {
				return {
					name: name,
					values: data[name]
				};
			});

			x.domain(d3.extent(oldData, function(d) { return d.date; }));
			y.domain(d3.extent(oldData, function(d) { return d.temperature; }));

			svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis);

			svg.append("g")
				.attr("class", "y axis")
				.call(yAxis)
			.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", 6)
				.attr("dy", ".71em")
				.style("text-anchor", "end")
				.text("Attendees");

			var city = svg.selectAll(".city")
				.data(cities)
				.enter().append("g")
				.attr("class", "city");

				city.append("path")
					.attr("class", "line")
					.attr("d", function(d) { console.log(d.values);return line(d.values); })
					.style("stroke", function(d) { return color(d.name); });

				city.append("text")
					.datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
					.attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.temperature) + ")"; })
					.attr("x", 3)
					.attr("dy", ".35em")
					.text(function(d) { return d.name; });
		}
	});
	return LinesChartDataView;
});