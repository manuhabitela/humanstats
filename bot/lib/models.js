var _ = require('underscore');
var Backbone = require('backbone');
var appUtils = require('./utils.js');

var _originalAdd = Backbone.Collection.prototype.add;
Backbone.Collection.prototype.add = function(models, options) {
	options = _.extend({ parse: true, merge: true }, options);
	return _originalAdd.call(this, models, options);
};

Backbone.Collection.prototype.parse = function(resp, options) {
	var data = resp;
	if (this.model && resp.length) {
		data = _(resp).map(function(item) {
			if (!(item instanceof Backbone.Model)) {
				item = new this.model(item, _.extend({ parse: true }, options));
				return item.toJSON();
			}
			return item;
		}, this);
	}
	return data;
};

var City = module.exports.City = Backbone.Model.extend({
	parse: function(data) {
		if (data.url) {
			data.id = data.url.replace('http://humantalks.com/cities/', '');
			delete data.url;
		}
		return data;
	},

	getURL: function() {
		if (!this.collection) return false;
		return _.template(this.collection.htURL, { city: this.get('id') });
	}
});
var Cities = module.exports.Cities = Backbone.Collection.extend({
	model: City,
	htURL: 'http://humantalks.com/cities/<%= city %>'
});


var Event = module.exports.Event = Backbone.Model.extend({
	parse: function(data) {
		if (data.url) {
			var city = data.url.match(/\/cities\/(.*)\/events/);
			data.city = city[1] ? city[1] : '';
			data.id = data.url.replace('http://humantalks.com/cities/' + data.city + '/events/', '')*1;
			delete data.url;
		}
		if (data.date)
			data.date = appUtils.frenchDateToNumber(data.date);
		return data;
	},

	getURL: function() {
		if (!this.collection) return false;
		return _.template(this.collection.htURL, { city: this.get('city'), event: this.get('id') });
	}
});
var Events = module.exports.Events = Backbone.Collection.extend({
	model: Event,
	htURL: 'http://humantalks.com/cities/<%= city %>/events/<%= event %>',
	meetupURL: 'http://www.meetup.com/<%= city %>/events/<%= event %>/'
});


var Talk = module.exports.Talk = Backbone.Model.extend({
	parse: function(data) {
		if (data.url) {
			data.id = modelsUtils.getIDFromURL(data.url);
			data.slug = modelsUtils.getSlugFromURL(data.url);
			delete data.url;
		}
		if (data.event && data.event.id) {
			data.eventId = data.event.id;
			delete data.event;
		}
		if (data.author && data.author.url) {
			data.authorId = modelsUtils.getIDFromURL(data.author.url);
			delete data.author;
		}
		return data;
	}
});
var Talks = module.exports.Talks = Backbone.Collection.extend({
	model: Talk,
	htURL: 'http://humantalks.com/talks/'
});


var User = module.exports.User = Backbone.Model.extend({
	parse: function(data) {
		if (data.event && data.event.id) {
			data.eventId = event.id;
			delete data.event;
		}
		if (data.url) {
			data.id = modelsUtils.getIDFromURL(data.url);
			data.slug = modelsUtils.getSlugFromURL(data.url);
			delete data.url;
		}
		return data;
	},
});
var Users = module.exports.Users = Backbone.Collection.extend({
	model: User,
	htURL: 'http://news.humancoders.com/users/<%= id %>-<%= slug %>'
});

var modelsUtils = {
	getInfoFromURL: function getInfoFromURL(url, info) {
		if (!_(['slug', 'id']).contains(info))
			return false;
		if (url.indexOf('humancoders.com') !== false) {
			url = url.substr(_(url).lastIndexOf('/')+1);
			if (info === 'id')
				return (url.substr(0, _(url).indexOf('-')-1))*1;
			if (info === 'slug')
				return url.substr(_(url).indexOf('-')+1);
		}
		return false;
	},

	getIDFromURL: function getIDFromURL(url) {
		return this.getInfoFromURL(url, 'id');
	},

	getSlugFromURL: function getSlugFromURL(url) {
		return this.getInfoFromURL(url, 'slug');
	}
};