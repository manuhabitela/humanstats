var $ = require('../bower_components/jquery/jquery');
var Backbone = require('backbone');
var _ = require('underscore');
Backbone.$ = $;

var CitiesView = module.exports.Cities = Backbone.View.extend({
	template: _.template("<ul><% _.each(cities, function(city) { %><li><%- city.name %></li><% }) %></ul>"),

	initialize: function() {
		this.render();
	},

	render: function() {
		this.$el.html( this.template({cities: this.collection.toJSON() }) );
	}
});