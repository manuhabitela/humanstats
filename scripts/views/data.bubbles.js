define(["backbone", "underscore", "d3", "d3utils", "moment", "d3tip", "mixins"], function(Backbone, _, d3, d3utils, moment) {
	moment.lang('fr');

	//bubbles chart, code based on http://bl.ocks.org/mbostock/4063269 Bubble Chart
	var BubblesChartDataView = Backbone.View.extend({
		className: 'BubblesChart',
		tpl: [
			'<div class="BubblesChart-info">',
				'<div class="BubblesChart-slider Grid u-paddingButtonM">',
					'<output class="BubblesChart-slider-min Grid-cell Grid-cell--sizeFit">1</output>',
					'<input class="BubblesChart-slider-input Grid-cell Grid-cell--sizeFit" name="BubblesChart-slider" type="range" min="1" step="1" value="1">',
					'<output class="BubblesChart-slider-max Grid-cell Grid-cell--sizeFit"></output>',
					'<p class="BubblesChart-text Grid-cell Grid-cell--sizeFit u-marginLl">',
						'<output class="BubblesChart-attendeesCount"></output> <output class="BubblesChart-slider-value">1</output> fois <output class="BubblesChart-city"></output>',
					'</p>',
				'</div>',
				'<p class="BubblesChart-golden u-paddingButtonM u-marginTs u-isHidden">Hey, ces gens sont venus à tous les Human Talks de leur ville !</p>',
			'</div>',
			'<svg class="BubblesChart-chart"></svg>',
			'<div class="BubblesChart-userInfo u-closable u-isHidden"></div>'
		].join(''),

		userInfoTpl: [
			'<button type="button" class="u-closable-close">&times;</button>',
			'<p class="BubblesChart-userInfo-content">',
				'<a href="<%= data.users.get(user.id).getURL() %>" target="_blank"><%= user.name %></a> ',
				'<% if (user.attendedEventIds.all.length === 1) { %>',
					'est venu(e) une fois à <%= _(user.mainCityIds[0]).capitalize() %>',
					'<% if (typeof user.talkIds === "undefined" || !user.talkIds.length) { %>, comme ça, pour voir<% } %>',
					'. ',
				'<% } else if (user.attendedEventIds[ user.mainCityIds[0] ].length === (data.cities.get( user.mainCityIds[0] ).get("eventIds").length) ) { %>',
					'a assisté à <strong>tous les Human Talks <%= _(user.mainCityIds[0]).capitalize() %></strong> ! Gros respect. ',
				'<% } else if (user.attendedEventIds[ user.mainCityIds[0] ].length >= (data.cities.get( user.mainCityIds[0] ).get("eventIds").length*0.6) ) { %>',
					'est un(e) grand(e) habitué(e) des Human Talks <%= _(user.mainCityIds[0]).capitalize() %>. ',
				'<% } else { %>',
					'est venu(e) plusieurs fois à <%= _(user.mainCityIds[0]).capitalize() %>. ',
				'<% } %>',
			'</p>',
			'<% if (user.mainCityIds.length > 1) { %>',
				'<p class="BubblesChart-userInfo-content">',
					'Il/elle est aussi passé par ',
					'<%= _( _(user.mainCityIds.slice(1)).map(function(city) { return _(city).capitalize(); }) ).toSentence(", ", " et ") %>. ',
				'</p>',
			'<% } %>',
			'<% if (typeof user.talkIds !== "undefined" && user.talkIds.length > 0) { %>',
				'<% if (user.talkIds.length === 1) { %>',
					'<p class="BubblesChart-userInfo-content">',
						'C\'est l\'auteur de <a href="<%= data.talks.get(user.talkIds[0]).getURL() %>" target="_blank"><%= data.talks.get(user.talkIds[0]).get("name") %></a>.',
					'</p>',
				'<% } else { %>',
					'<p class="BubblesChart-userInfo-content">C\'est l\'auteur de :</p>',
					'<ul class="BubblesChart-userInfo-content"><% _(user.talkIds).each(function(talkId) { %>',
						'<li><a href="<%= data.talks.get(talkId).getURL() %>" target="_blank"><%= data.talks.get(talkId).get("name") %></a>',
					'<% }) %></ul>',
				'<% } %>',
			'<% } %>',
			'<% if (typeof user.organizedCityIds !== "undefined" && user.organizedCityIds.length > 0) { %>',
				'<p class="BubblesChart-userInfo-content">',
					"Il (co-)organise les évènements sur ",
					'<%= _( _(user.organizedCityIds).map(function(city) { return _(city).capitalize(); }) ).toSentence(", ", " et ") %>. Super sympa.',
				'</p>',
			'<% } %>'
		].join(''),

		initialize: function(options) {
			this.options = options;
			this.data = options.data;

			_.bindAll(this, 'onSliderChange', 'onSliderMouseup', 'render', 'updateFilteredData', 'updateInfoView');


			var that = this;
			this.attendees = [];
			this.diameter = 700;
			this.tip = d3.tip()
				.attr('class', 'ChartTooltip')
				.html(function(d) {
					return [
						'<div class="ChartTooltip-inner ChartTooltip-inner--withImg Grid" style="background-color: ',
						that.data.cities.findWhere({ id: d.mainCityIds[0] }).get('color'),
						'">',
							'<span class="ChartTooltip-text Grid-cell Grid-cell--sizeFit u-alignMiddle u-textTruncate">',
								d.name,
							'</span> ',
							'<img class="ChartTooltip-img Grid-cell Grid-cell--sizeFit u-alignMiddle" src="' + d.img + '">',
						'</div>'
					].join('');
				});
			this.radiusScale = d3.scale.linear().domain([1, this.data.attendees.length]).range([12, 6]);
			this.bubble = d3.layout.pack()
				.sort(null)
				.size([this.diameter, this.diameter])
				.padding(4)
				.value(function(d) { return d.talkIds && d.talkIds.length ? d.talkIds.length*(that.attendees.length > 500 ? 2 : 4) : 1; })
				.radius(function(d) { return that.radiusScale(that.attendees.length) + d; });

			this.userInfoTemplate = _.template(this.userInfoTpl);
		},

		render: function() {
			if (!this.data) return false;
			var that = this;

			if (!this.$el.children().length) {
				this.$el.html( this.tpl );
				this.$slider = {
					min: this.$('.BubblesChart-slider-min'),
					input: this.$('.BubblesChart-slider-input'),
					value: this.$('.BubblesChart-slider-value'),
					max: this.$('.BubblesChart-slider-max'),
					attendeesCount: this.$('.BubblesChart-attendeesCount'),
					city: this.$('.BubblesChart-city'),
					golden: this.$('.BubblesChart-golden')
				};
				this.$slider.input.on('change', this.onSliderChange);
				this.$slider.input.on('mouseup', this.onSliderMouseup);
			}

			this.updateFilteredData();
			this.attendees = _(this.data.filtered.filteredAttendees).shuffle();

			this.$slider.input.attr('max', this.data.filtered.cities.length > 1 ?
				_(this.attendees).chain().pluck('attendedEventIds').map(function (attended) { return attended.all.length; }).max().value() :
				this.data.filtered.events.length
			);
			this.$slider.max.text( this.$slider.input.attr('max') );
			if (!this.attendees)
				this.$slider.input.val(1);
			if (this.$slider.input.val()*1 > this.$slider.input.attr('max')*1)
				this.$slider.input.val(this.$slider.input.attr('max'));

			this.updateFilteredData();
			this.attendees = _(this.data.filtered.filteredAttendees).shuffle();
			this.updateInfoView();

			if (!this.svg) {
				this.svg = d3.select(this.el.querySelector('svg'))
					.attr("width", this.diameter)
					.attr("height", this.diameter)
					.attr("class", "BubblesChart-bubble");
				this.svg.call(this.tip);
			}

			var node = this.svg.selectAll(".BubblesChart-node")
				.data(this.bubble.nodes({ children: this.attendees}).filter(function(d) { return !d.children; }));

			node.enter().append("g").attr("class", "BubblesChart-node").append("circle").attr('class', 'BubblesChart-node-circle').style("fill", function(d) { return "#fff"; });

			node.transition()
				.duration(500)
				.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

			node.selectAll('.BubblesChart-node-circle').data(function(d) { return [d]; })
				.transition()
				.duration(500)
				.attr("r", function(d) { return d.id ? d.r : 0; })
				.style("fill", function(d) { return d.id ? that.data.cities.findWhere({ id: d.mainCityIds[0] }).get('color') : ''; });

			var tooltipTimeout = null;
			node
				.on('.mouseover', null)
				.on('.mouseout', null)
				.on('.click', null)
				.on('mouseover', function(d) {
					clearTimeout(tooltipTimeout);
					that.tip.show(d);
				})
				.on('mouseout', function() {
					clearTimeout(tooltipTimeout);
					tooltipTimeout = setTimeout(that.tip.hide, 500);
				})
				.on('click', function(d) {
					that.$el.find('.BubblesChart-userInfo').html( that.userInfoTemplate({ user: d, data: that.data }) );
					that.$el.find('.BubblesChart-userInfo').removeClass('u-isHidden');
				});

			node.exit().remove();
		},

		onSliderChange: function(e) {
			this.render();
		},

		updateFilteredData: function() {
			this.data.filtered.filteredAttendees = _(this.data.filtered.attendees).filter(function(user) {
				if (user.attendedEventIds) {
					var city = this.data.filtered.cities.length > 1 || !this.data.filtered.cities.length ? 'all' : this.data.filtered.cities[0].id;
					if (user.attendedEventIds[city])
						return user.attendedEventIds[city].length >= Math.round(this.$slider.input.val());
					return false;
				}
				return false;
			}, this);
		},

		updateInfoView: function() {
			this.$slider.value.text( this.$slider.input.val() );
			var tpl = '<%- attendees %> <%= _.pluralize("personne", attendees) %> <%= _.pluralize("venue", attendees) %>';
			this.$slider.attendeesCount.text( _.template(tpl, { attendees: this.data.filtered.filteredAttendees.length } ) );
			this.$slider.city.text( this.data.filtered.cities.length > 1 || !this.data.filtered.cities.length ?
				'aux Human Talks' :
				'à ' + this.data.filtered.cities[0].name
			);
			var goldenAttendees = (this.data.filtered.cities.length === 1 &&
				this.$slider.input.val()*1 === this.$slider.input.attr('max')*1 &&
				this.data.filtered.filteredAttendees.length > 0);
			this.$slider.golden.toggleClass('u-isHidden', !goldenAttendees);
		},

		onSliderMouseup: function(e) {
			this.$slider.input.val( Math.round(this.$slider.input.val()) );
		}
	});
	return BubblesChartDataView;
});