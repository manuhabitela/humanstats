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
	},

	frenchDateToNumber: function frenchDateToNumber(date) {
		var months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
		date = date.replace(/\n/g, '').trim();
		date = date.split(' ');
		date[1] = (_(months).indexOf(date[1])+1).toString();
		date[1] = (date[1]).toString().length > 1 ? date[1] : "0" + date[1];
		date[0] = (date[0]).toString().length > 1 ? date[0] : "0" + date[0];
		date = date.reverse().join('-');
		return date;
	}
};