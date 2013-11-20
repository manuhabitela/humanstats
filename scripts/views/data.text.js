define(["backbone", "underscore", "d3"], function(Backbone, _, d3) {

	var TextDataView = Backbone.View.extend({
		template: _.template([
			'<div class="data-text"><div class="row">',
				'<div class="col">',
					'<h2>Les Human Talks <% if (cities && cities.length === 1) { %><%- cities[0].name %><% } %>, c\'est :</h2>',
					'<ul>',
						'<li><span class="number"><%- talks.length %></span> talks</li>',
						'<li>en <span class="number"></span> évènements</li>',
						'<li>dans <span class="number"></span> villes</li>',
						'<li><span class="number"></span> organiseurs</li>',
						'<li><span class="number"></span> talkers</li>',
						'<li><span class="number"></span> participants venus <span class="number"></span> fois</li>',
					'</ul>',
				'</div>',
			'</div></div>'
			].join('')
		),

		render: function() {
			if (!this.data) return false;

			var firstRendering = false;
			if (!this.$el.find('.data-text').length) {
				this.$el.html( this.template({
					cities: this.data.cities,
					talks: this.data.talks
				}) );
				firstRendering = true;
			}

			//must match the .number elements order in the template
			var numberData = [
				this.data.talks.length,
				this.data.events.length,
				this.data.cities.length,
				this.data.organizers.length,
				this.data.talkers.length,
				this.data.attendees.length,
				this.data.appearances
			];
			// if (this.data.cities.length > 1)
			// 	numberData.splice(2, 0, this.data.cities.length);

			d3.select(this.el)
				.selectAll(".number")
				.data(numberData)
				.text(function() {
					return firstRendering ? 0 : this.textContent;
				})
				.transition()
				.duration(1500)
				.tween("text", function(d) {
					var i = d3.interpolate(this.textContent, d),
						prec = (d + "").split("."),
						round = (prec.length > 1) ? Math.pow(10, prec[1].length) : 1;
					return function(t) {
						this.textContent = Math.round(i(t) * round) / round;
					};
				});
		}
	});
	return TextDataView;
});