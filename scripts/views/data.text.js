define(["backbone", "underscore", "d3", "d3utils", "mixins"], function(Backbone, _, d3, d3utils) {

	var TextDataView = Backbone.View.extend({
		tagName: 'ul',
		templates: {
			talks: '<span class="number"><%- value %></span> <%- _("talk").pluralize(value) %>',
			events: 'en <span class="number"><%- value %></span> <%- _("évènement").pluralize(value) %>',
			organizers: '<span class="number"><%- value %></span> <%- _("organisateur").pluralize(value) %>',
			talkers: '<span class="number"><%- value %></span> <%- _("talker").pluralize(value) %>',
			attendees: '<span class="number"><%- value[0] %></span> <%- _("participant").pluralize(value) %> venus <span class="number"><%- value[1] %></span> fois',
		},

		render: function() {
			if (!this.data) return false;

			var that = this;
			var numberData = [
				{ type: "talks", value: this.data.talks.length, tpl: this.templates.talks },
				{ type: "events", value: this.data.events.length, tpl: this.templates.events },
				{ type: "organizers", value: this.data.organizers.length, tpl: this.templates.organizers },
				{ type: "talkers", value: this.data.talkers.length, tpl: this.templates.talkers },
				{ type: "attendees", value: [this.data.attendees.length, this.data.appearances], tpl: this.templates.attendees },
			];

			//update existing li with new data
			var selection = d3.select(this.el).selectAll('li').data(numberData);
			//create missing li (at first start or when going from city to all view)
			selection.enter().append('li');
			//put the templated data in the list
			selection.html(function(d) {
				return _.template(d.tpl, { value: d.value });
			});
			//visually increment/decrement numbers with new values
			selection.transition()
				.duration(1500)
				.tween("text", function(d) {
					var prevVal = that.numberData ? _(that.numberData).findWhere({ type: d.type }).value : 0;
					var i = d3.interpolate( prevVal, d.value),
						prec = (d.value + "").split("."),
						round = (prec.length > 1) ? Math.pow(10, prec[1].length) : 1;
					return function(t) {
						this.innerHTML = _.template(d.tpl, { value: Math.round(i(t) * round) / round });
					};
				})
				.call(d3utils.transitionEndAll, function() {
					//don't forget to save the data to be able to compare it next time we update the list
					that.numberData = numberData;
				});

		}
	});
	return TextDataView;
});