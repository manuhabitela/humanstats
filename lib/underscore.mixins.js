define(["underscore"], function(_) {
	_.mixin({
		//really complicated stuff
		pluralize: function(string, count) {
			if (!string) return ''; if (!count || count === 1) return string;
			return string + 's';
		},

		capitalize: function(string) {
			return string.substr(0, 1).toUpperCase() + string.substr(1);
		},

		//underscore.string
		toSentence: function(array, separator, lastSeparator, serial) {
			separator = separator || ', ';
			lastSeparator = lastSeparator || ' and ';
			var a = array.slice(), lastMember = a.pop();

			if (array.length > 2 && serial) lastSeparator = separator + lastSeparator;

			return a.length ? a.join(separator) + lastSeparator + lastMember : lastMember;
		}
	});
});