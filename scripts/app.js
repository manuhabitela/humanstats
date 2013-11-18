define(
	["json!../data/humantalks.json", "./models", "./views/cities", "./views/data"],
	function(data, models, CitiesView, DataView) {

	var HumanStatistics = function(container) {
		container = document.querySelector(container);
		this.cities = new models.Cities(data.cities);
		this.events = new models.Events(data.events);
		this.talks = new models.Talks(data.talks);
		this.users = new models.Users(data.users);

		this.citiesList = new CitiesView({
			collection: this.cities,
			el: container.querySelector('.cities')
		});
		this.dataView = new DataView({
			cities: this.cities,
			events: this.events,
			talks: this.talks,
			users: this.users,
			el: container.querySelector('.data')
		});
	};

	return HumanStatistics;
});