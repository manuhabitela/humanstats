define(["backbone", "underscore", "d3", "d3utils", "mixins"], function(Backbone, _, d3, d3utils) {

	var TextDataView = Backbone.View.extend({
		templates: {
			talks: '<span class="TextChart-number"><%- value %></span> <%- _("talk").pluralize(value) %>',
			events: '<span class="TextChart-number"><%- value %></span> <%- _("évènement").pluralize(value) %>',
			organizers: '<span class="TextChart-number"><%- value %></span> <%- _("organisateur").pluralize(value) %>',
			talkers: '<span class="TextChart-number"><%- value %></span> <%- _("talker").pluralize(value) %>',
			attendees: '<span class="TextChart-number"><%- value[0] %></span> <%- _("participant").pluralize(value[0]) %> <%= (value[0] > 1) ? "accueillies" : "accueillis" %> <span class="TextChart-number"><%- value[1] %></span> fois',
		},

		initialize: function(options) {
			_.bindAll(this, 'render');

			this.data = options.data;
			this.data.on('filterData', this.render);
			this.render();
		},

		render: function() {
			if (!this.data) return false;

			if (!this.$el.find('.TextChart').length)
				this.$el.html('<ul class="TextChart"></ul>');

			var that = this;
			var appearances = _.reduce(this.data.filtered.events, function(memo, event) {
				return memo + event.attendeeIds.length;
			}, 0);
			var maxAppearances = _.reduce(this.data.events.toJSON(), function(memo, event) {
				return memo + event.attendeeIds.length;
			}, 0);
			var numberData = [
				{ type: "events", maxValue: this.data.events.toJSON().length, value: this.data.filtered.events.length, tpl: this.templates.events },
				{ type: "talks", maxValue: this.data.talks.toJSON().length, value: this.data.filtered.talks.length, tpl: this.templates.talks },
				{ type: "talkers", maxValue: this.data.talkers.toJSON().length, value: this.data.filtered.talkers.length, tpl: this.templates.talkers },
				{ type: "attendees", maxValue: [this.data.attendees.length, maxAppearances], value: [this.data.filtered.attendees.length, appearances], tpl: this.templates.attendees },
				{ type: "organizers", maxValue: this.data.organizers.toJSON().length, value: this.data.filtered.organizers.length, tpl: this.templates.organizers },
			];

			//update existing li with new data
			var selection = d3.select(this.el.querySelector('.TextChart')).selectAll('.TextChart-item').data(numberData);
			//create missing li (at first start)
			selection.enter().append('li').attr('class', 'TextChart-item');
			//put the templated data in the list
			selection.html(function(d) {
				return _.template(d.tpl, { value: d.value });
			});
			//visually increment/decrement numbers with new values
			selection
				.style('font-size', function(d) {
					var scale = d3.scale.linear().domain([0, _.isArray(d.maxValue) ? d.maxValue[0] : d.maxValue]).range([16, 24]);
					return scale( (_.isArray(d.value) ? d.value[0] : d.value) ) + 'px';
				})
				.transition()
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