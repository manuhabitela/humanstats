require.config({
	paths: {
		text: '../bower_components/requirejs-plugins/lib/text',
		json: '../bower_components/requirejs-plugins/src/json'
	}
});

require(["json!../data/humantalks.json"], function(util) {
	console.log(util);
});