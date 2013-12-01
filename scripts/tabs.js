define(["jquery", "underscore"], function($, _) {
	var Tabs = function(view) {
		_.bindAll(this, 'onMenuClick');
		this.view = view;
		this.$container = view.$el;
		this.$container.on('click', '.Tabs .Tabs-link', this.onMenuClick);

		var hrefs = [];
		this.$container.find('.Tabs .Tabs-link').each(function(n, val) { hrefs.push($(this).attr('href')); });
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
		this.$container.find('.Tabs-contents .Tabs-content').not('#' + id).addClass('Tabs-content--hidden');
		this.$container.find('.Tabs-contents .Tabs-content#' + id).removeClass('Tabs-content--hidden');

		this.view.trigger('tab.show', id);
	};
	return Tabs;
});