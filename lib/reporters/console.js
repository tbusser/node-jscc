/**
* Iterates over the keys of an object and calls a callback function when the
* key belongs to he object itself and not to its prototype.
*/
function iterate(object, callback) {
	for (var key in object) {
		if (object.hasOwnProperty(key)) {
			callback(key, object[key]);
		}
	}
}

module.exports = function(matches) {
	var matchCount = 0;

	iterate(matches, function(key, value) {
		matchCount++;
		console.log('API "%s" found in %s', key, value.files.join(', '));
	})

	if (matchCount) {
		/**
		 * Printing summary.
		 */
		console.log('\n' + matchCount + ' APIs detected.');
	} else {
		console.log('No APIs detected.');
	}
};
