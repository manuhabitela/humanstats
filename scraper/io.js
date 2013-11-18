var fs = require('fs');

module.exports = {
	saveJSON: function saveJSON(filepath, data) {
		data = JSON.stringify(data);
		fs.write(filepath, data, 'w');
	},

	getDataFromJSON: function getDataFromJSON(filepath) {
		var file = null;
		try {
			file = fs.read(filepath);
			file = JSON.parse(file);
		} catch (e) {}
		return file;
	}
};