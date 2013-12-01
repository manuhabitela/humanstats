define(["jquery", "underscore"], function($, _) {
	var Tabs = function(view) {
		_.bindAll(this, 'onMenuClick');
		this.view = view;
		this.$container = view.$el;
		this.$container.on('click', '.tabs .tab-link', this.onMenuClick);

		var hrefs = [];
		this.$container.find('.tabs .tab-link').each(function(n, val) { hrefs.push($(this).attr('href')); });
		if ( _(hrefs).contains(window.location.hash) )
			this.showTab(window.location.hash.substr(1));
		else
			this.showTab(hrefs[0].substr(1));
	};

	Tabs.prototype.onMenuClick = function(e) {
		var id = $(e.currentTarget).attr('href').substr(1);
		this.showTab(id);

		e.preventDefault();
	};

	Tabs.prototype.showTab = function(id) {
		this.$container.find('.tab-contents .tab-content').not('#' + id).addClass('tab-content--hidden');
		this.$container.find('.tab-contents .tab-content#' + id).removeClass('tab-content--hidden');

		this.view.trigger('tab.show', id);
	};
	return Tabs;
});