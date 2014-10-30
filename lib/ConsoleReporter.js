(function(root, factory) {
	'use strict';

	if (typeof define === 'function' && define.amd) {
		// AMD
		define([], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory();
	} else {
		root.ConsoleReporter = factory();
	}
}(this, function() {
	'use strict';

	var exports = function(options) {
		this._options = options;
	};

	exports.prototype = {
		buildReport: function(data, filter) {
			if (data == null || data.length == 0) {
				console.log('No API calls found');
			}
		}
	};

	return exports;
}));
