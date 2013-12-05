define(
	["backbone", "json!../data/all.json", "./models", "./views/cities", "./views/data", "./views/data.info"],
	function(Backbone, originalData, models, CitiesView, DataView, InfoView) {

	var HumanStatistics = function(container) {
		container = document.querySelector(container);

		_.bindAll(this, 'filterData');

		this.initData(originalData);

		this.citiesList = new CitiesView({
			collection: this.data.cities,
			el: container.querySelector('.cities-container')
		});
		this.dataView = new DataView({
			data: this.data,
			el: container.querySelector('.tabbed-data-container')
		});
		this.infoView = new InfoView({
			data: this.data,
			el: container.querySelector('.info-container')
		});
	};

	HumanStatistics.prototype.initData = function(data) {
		this.data = { filtered: {} };
		_(this.data).extend(Backbone.Events);

		this.data.cities = new models.Cities(data.cities);
		this.data.cities.setColors();
		this.data.cities.activateAll();

		this.data.events = new models.Events(data.events);
		this.data.events.removeUpcomings();
		this.data.events.removeEmpty();

		this.data.cities.setAttendeesCount(this.data.events);

		this.data.talks = new models.Talks(data.talks);

		this.data.users = new models.Users(data.users);
		this.data.users.setMainCities(this.data.events);

		var attendees = this.data.users.filter(function(user) {
			return !!(user.get('attendedEventIds') && user.get('attendedEventIds').length);
		});
		this.data.attendees = new models.Users(attendees);

		var organizerIds = _.uniq( _.flatten( this.data.cities.pluck('organizerIds') ) );
		var organizers = this.data.users.filter(function(user) {
			return _(organizerIds).contains(user.id);
		});
		this.data.organizers = new models.Users(organizers);

		var talkerIds = this.data.talks.pluck('authorId');
		var talkers = this.data.users.filter(function(user) {
			return _(talkerIds).contains(user.id);
		});
		this.data.talkers = new models.Users(talkers);

		this.data.cities.on('activate deactivate deactivateAll activateAll', this.filterData);
		this.filterData();
	};

	HumanStatistics.prototype.filterData = function() {
		this.data.filtered.cities = this.data.cities.activeItems.toJSON();
		this.data.filtered.events = this.data.events.filterByCities(this.data.cities.activeItems);
		this.data.filtered.talks = this.data.talks.filterByCities(this.data.cities.activeItems);
		this.data.filtered.organizers = this.data.organizers.filterOrganizersByCities(this.data.cities.activeItems);
		this.data.filtered.talkers = this.data.talkers.filterTalkersByTalks(this.data.talks.activeItems);
		this.data.filtered.attendees = this.data.attendees.filterAttendeesByEvents(this.data.events.activeItems);
		this.data.trigger('filterData');
	};

	return HumanStatistics;
});