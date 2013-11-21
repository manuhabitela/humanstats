_.mixin({
	//really complicated stuff
	pluralize: function(string, count) {
		if (!string) return ''; if (!count || count === 1) return string;
		return string + 's';
	}
});