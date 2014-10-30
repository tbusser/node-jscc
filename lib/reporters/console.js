/**
 * @param {Errors[]} errorsCollection
 */
module.exports = function(matches) {
	var matchCount = 0;

	matches.forEach(function(errors) {
		matchCount++;
	});

	if (matchCount) {
		/**
		 * Printing summary.
		 */
		console.log('\n' + matchCount + ' APIs detected.');
	} else {
		console.log('No APIs detected.');
	}
};
