define(["jquery", "backbone", "underscore", "d3", "topojson", "datamaps"], function($, Backbone, _, d3, topojson, Datamap) {

	var MapDataView = Backbone.View.extend({
		className: 'MapChart',
		initialize: function(options) {
			this.data = options.data;

			_.bindAll(this, 'render');

			var that = this;
			var mapOptions = {
				element: this.el,
				fills: {
					bubble: '#fff',
					dot: '#ddd',
					defaultFill: '#dedede'
				},
				geographyConfig: {
					dataUrl: '/data/regions.topojson',
					popupOnHover: false,
					highlightOnHover: false,
					borderColor: '#999'
				},
				scope: "france",
				setProjection: function(element, options) {
					var projection = d3.geo.albers()
						.center([2, 46])
						.rotate([-1, 0])
						.translate([700/2, 700/2])
						.scale(5400 * 700 / 1060);

					var path = d3.geo.path().projection(projection);
					return { path: path, projection: projection};
				},
				done: function() {
					that.map.done = true;
					that.render();
				}
			};
			this.data.cities.each(function(city) {
				if (city.get('color'))
					mapOptions.fills[city.id] = city.get('color');
			});
			this.map = new Datamap(mapOptions);
		},

		render: function() {
			if (!this.data || !this.map.done) return false;
			var sortedEventIds =  _(this.data.filtered.cities).chain().pluck('eventIds').sortBy(function(ids) { return ids.length*-1; }).value();
			var maxEventsNb = sortedEventIds && sortedEventIds[0] ? sortedEventIds[0].length : 0;
			var maxRadius = 40;
			var bubbles = _(this.data.filtered.cities).map(function(city) {
				var radius = city.eventIds.length / maxEventsNb * maxRadius;
				return _.extend({ latitude: city.coords.lat, longitude: city.coords.lng, radius: radius, fillKey: city.id }, city);
			});
			var dots = _(this.data.filtered.cities).map(function(city) {
				return _.extend({ latitude: city.coords.lat, longitude: city.coords.lng, radius: 1, fillKey: 'dot' }, city);
			});
			this.map.bubbles([].concat(bubbles, dots), {
				popupTemplate: function (geography, data) {
					return ['<div class="hoverinfo"><strong>' +  data.name + '</strong>',
					'<br/>' + data.eventIds.length + ' évènements',
					'</div>'].join('');
				},
				borderWidth: 1,
				borderColor: '#fff',
				fillOpacity: 0.8,
				highlightOnHover: false
			});
		}
	});
	return MapDataView;
});