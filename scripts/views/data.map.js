define(["backbone", "underscore", "d3", "topojson", "datamaps"], function(Backbone, _, d3, topojson, Datamap) {

	var MapDataView = Backbone.View.extend({
		template: _.template([
			'<div class="data-map"></div>'
			].join('')
		),

		render: function() {
			if (!this.data) return false;

			this.$el.html( this.template({
				cities: this.data.cities,
				events: this.data.events,
				talks: this.data.talks,
				organizers: this.data.organizers,
				talkers: this.data.talkers,
				attendees: this.data.attendees,
				appearances: this.data.appearances
			}) );
		}
	});
	return MapDataView;
});