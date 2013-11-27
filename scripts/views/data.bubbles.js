define(["backbone", "underscore", "d3", "d3utils", "moment", "d3tip", "mixins"], function(Backbone, _, d3, d3utils, moment) {
	moment.lang('fr');

	var BubblesChartDataView = Backbone.View.extend({

		initializeWithData: function() {
			var that = this;
			this.maxBubbleSize = _( _(that.data.attendees).map(function(user) {
				return user.talkIds ? user.talkIds.length : 1;
			}) ).max();
		},

		render: function() {
			if (!this.data) return false;
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
				.value(function(d) { return d.talkIds && d.talkIds.length ? d.talkIds.length*1.5 : 1; });

			var svg = d3.select(this.el)
				.attr("width", diameter)
				.attr("height", diameter)
				.attr("class", "bubble");
			svg.call(tip);

			var attendees = _(this.data.attendees).shuffle();

			var node = svg.selectAll(".node")
				.data(bubble.nodes({ children: attendees}).filter(function(d) { return !d.children; }));

			node.enter().append("g").attr("class", "node").append("circle").attr('class', 'node-circle');

			node.transition()
				.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

			node.selectAll('.node-circle').data(function(d) { return [d]; })
				.transition()
				.attr("r", function(d) { return d.r; })
				.style("fill", function(d) { return that.originalData.cities.findWhere({ id: d.mainCity }).get('color'); });

			node
				.on('mouseover', function(d) {
					console.log(d);
					clearTimeout(tooltipTimeout);
					tip.show(d);
				})
				.on('mouseout', function() {
					clearTimeout(tooltipTimeout);
					tooltipTimeout = setTimeout(tip.hide, 500);
				});

			node.exit().remove();
		}
	});
	return BubblesChartDataView;
});