define(["backbone", "underscore", "d3"], function(Backbone, _, d3) {
	var ListChartDataView = Backbone.View.extend({
		className: 'ListChart',

		tpl: [
			'<div class="ListChart-filter">',
				'<label>Rechercher ',
					'<input type="text" name="ListChart-search" class="ListChart-search">',
				'</label>',
				'<label>',
					'<input type="checkbox" name="ListChart-slides" class="ListChart-slides">',
					'Avec slides <span class="u-icon-pictures"></span>',
				'</label>',
				'<label>',
					'<input type="checkbox" name="ListChart-video" class="ListChart-video">',
					'Avec vidéo <span class="u-icon-video"></span>',
				'</label>',
			'</div>',
			'<div class="ListChart-listWrapper">',
				'<ul class="ListChart-list"></ul>',
				// '<svg class="ListChart-chart"></svg>',
			'</div>'
		].join(''),

		itemTpl: [
			'<a style="color: <%= color %>" class="ListChart-colored ListChart-itemName" href="<%= data.talks.get(talk.id).getURL() %>" target="_blank">',
				'<%= talk.name %>',
				'<% if (!video && talk.video) { %>',
					'&nbsp;<span title="La vidéo de ce talk est disponible" class="ListChart-colored ListChart-icon u-icon-video"></span>',
				'<% } %>',
				'<% if (!slides && talk.slides) { %>',
					'&nbsp;<span title="Le support de ce talk est disponible" class="ListChart-colored ListChart-icon u-icon-pictures"></span>',
				'<% } %>',
			'</a>',
		].join(''),

		initialize: function(options) {
			this.options = options;
			this.data = options.data;

			this.itemTemplate = _.template(this.itemTpl);
			this.talks = [];

			this.parseDate = d3.time.format("%Y-%m-%d").parse;
			// this.height = 0;
			// this.y = d3.time.scale()
			// 	.nice(d3.time.month);
			// this.yAxis = d3.svg.axis()
			// 	.scale(this.y)
			// 	.orient("right")
			// 	.ticks(d3.time.month, 1)
			// 	.tickPadding(0)
			// 	.tickFormat(function(date, i) {
			// 		date = moment(date);
			// 		var format = 'MMM' + ((date.year() !== moment().year()) ? ' YY' : '');
			// 		return date.format(format);
			// 	});

			_.bindAll(this, 'render', 'onFilter', 'updateFilteredData');
		},

		render: function() {
			if (!this.data) return false;
			var that = this;

			if (!this.$el.children().length) {
				this.$el.html( this.tpl );
				this.$filter = {
					search: this.$('.ListChart-search'),
					slides: this.$('.ListChart-slides'),
					video: this.$('.ListChart-video')
				};
				this.$filter.search.on('focus blur input change', _(this.onFilter).debounce(200));
				this.$filter.slides.on('click', this.onFilter);
				this.$filter.video.on('click', this.onFilter);
				this.list = d3.select(this.$('.ListChart-list').get(0));
				// this.chart = d3.select(this.$('.ListChart-chart').get(0));
				// this.chart.attr('width', '20px');
				// this.chart.append("g").attr("class", "ListChart-axis ListChart-axis--y");
			}

			this.updateFilteredData();
			this.talks = this.data.filtered.filteredTalks.reverse();

			var slides = this.$filter.slides.prop('checked');
			var video = this.$filter.video.prop('checked');

			var selection = this.list.selectAll('.ListChart-item').data( this.talks );
			selection.enter().append('li').attr('class', 'ListChart-item');
			selection.html(function(d) {
				return that.itemTemplate({
					talk: d,
					data: that.data,
					color: that.data.cities.findWhere({ id: d.city }).get('color'),
					slides: slides,
					video: video
				});
			});
			selection.exit().remove();

			// this.height = this.$('.ListChart-list').height();
			// this.height = this.height < 500 ? 500 : this.height;
			// this.chart.attr('height', this.height);
			// this.y.range([this.height, 0]);
			// this.y.domain(d3.extent(this.talks, function(d) { return d.date ? that.parseDate(d.date) : null; }));
			// this.chart.select('.ListChart-axis--y')
			// 	.transition()
			// 	.call(this.yAxis)
			// 	.selectAll("text")
			// 		.attr("y", -10)
			// 		.attr("x", 0)
			// 		.attr("dy", ".35em")
			// 		.attr("transform", "rotate(90)")
			// 		.style("text-anchor", "end");
		},

		onFilter: function() {
			this.render();
		},

		updateFilteredData: function() {
			var search = this.$filter.search.val();
			var slides = this.$filter.slides.prop('checked');
			var video = this.$filter.video.prop('checked');
			var activeFilters = {};
			if (search.length) activeFilters.search = true;
			if (!!slides) activeFilters.slides = true;
			if (!!video) activeFilters.video = true;
			this.data.filtered.filteredTalks = _(this.data.filtered.talks).filter(function(talk) {
				var isOk = {};

				if (activeFilters.search)
					isOk.search = talk.name.toLowerCase().indexOf(search.toLowerCase()) !== -1;

				if (activeFilters.slides)
					isOk.slides = !!talk.slides;

				if (activeFilters.video)
					isOk.video = !!talk.video;

				return _.isEqual(activeFilters, isOk);
			}, this);
		},
	});
	return ListChartDataView;
});