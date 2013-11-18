var _ = require('underscore');

module.exports = {
	key: null,
	baseURL: "http://dev.virtualearth.net/REST/v1/Locations",
	getQueryURL: function(opts) {
		var params = _(opts).pick('adminDistrict', 'locality', 'postalCode', 'addressLine', 'countryRegion', 'includeNeighborhood', 'maxResults') || {};
		var url = this.baseURL + "?key=" + this.key;
		_(params).each(function(value, name) {
			if (value)
				url += "&" + name + "=" + encodeURIComponent(value);
		});
		return url;
	},
	getCoordsFromResponse: function(res) {
		var coords = { lat: null, lng: null };
		if (res.statusCode === 200 &&
			res.resourceSets && res.resourceSets[0] &&
			res.resourceSets[0].resources &&
			res.resourceSets[0].resources[0] &&
			res.resourceSets[0].resources[0]['point']) {
				coords.lat = res.resourceSets[0].resources[0].point.coordinates[0];
				coords.lng = res.resourceSets[0].resources[0].point.coordinates[1];
		}
		return coords;
	}
};