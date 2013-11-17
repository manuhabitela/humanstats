var data = require('../data/humantalks.json');
var models = require('../shared/models');
var views = require('./views');

var cities = new models.Cities(data.cities);
var events = new models.Events(data.events);
var talks = new models.Talks(data.talks);
var users = new models.Users(data.users);

var citiesView = new views.Cities({ collection: cities, el: document.querySelector('.cities') });