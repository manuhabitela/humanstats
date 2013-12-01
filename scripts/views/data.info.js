define(["backbone", "underscore", "d3", "d3utils", "mixins"], function(Backbone, _, d3, d3utils) {

	var TextDataView = Backbone.View.extend({
		className: 'TextChart',
		templates: {
			talks: '<span class="TextChart-number"><%- value %></span> <%- _("talk").pluralize(value) %>',
			events: 'en <span class="TextChart-number"><%- value %></span> <%- _("évènement").pluralize(value) %>',
			organizers: '<span class="TextChart-number"><%- value %></span> <%- _("organisateur").pluralize(value) %>',
			talkers: '<span class="TextChart-number"><%- value %></span> <%- _("talker").pluralize(value) %>',
			attendees: '<span class="TextChart-number"><%- value[0] %></span> <%- _("participant").pluralize(value) %> venus <span class="TextChart-number"><%- value[1] %></span> fois',
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
			//create missing li (at first start)
			selection.enter().append('li');
			//put the templated data in the list
			selection.html(function(d) {
				return _.template(d.tpl, { value: d.value });
			});
			//visually increment/decrement numbers with new values
			selection.transition()
				.duration(750)
				.tween("text", function(d) {
					var prevVal = that.numberData ? _(that.numberData).findWhere({ type: d.type }).value : 0;
					var newVal;
					if ( _(d.value).isArray() ) {
						newVal = d.value;
						if (prevVal === 0) {
							prevVal = [];
							_(d.value.length).times(function() { prevVal.push(0); });
						}
					}
					if ( !_(d.value).isArray() ) {
						prevVal = [prevVal];
						newVal = [d.value];
					}

					var stuff = _(prevVal).map(function(val, n) {
						var i = d3.interpolate( val, newVal[n]),
							prec = (d[n] + "").split("."),
							round = (prec.length > 1) ? Math.pow(10, prec[1].length) : 1;
						return [i, round];
					}, this);

					return function(t) {
						var values = _( stuff ).map(function(data) {
							return Math.round(data[0](t) * data[1]) / data[1];
						});
						var newFinalValueForReal = values.length > 1 ? values : values[0];
						this.innerHTML = _.template(d.tpl, { value: newFinalValueForReal });
						if (that.numberData)
							_(that.numberData).findWhere({type : d.type }).value = newFinalValueForReal;
					};
				})
				.call(d3utils.allTransitionEnd, function() {
					//don't forget to save the data to be able to compare it next time we update the list
					that.numberData = numberData;
				});
		}
	});
	return TextDataView;
});