var Additional = require('../data/additional.json'),
    CanIUse = require('../data/caniuse2.json'),
    CodeAnalyzer = require('./CodeAnalyzer'),
    DataStore = require('./DataStore'),
    Intermediary = require('./Intermediary'),
    path = require('path'),
    Vow = require('vow'),
    VowFs = require('vow-fs');

var Checker = function(options) {
	'use strict';

	DataStore.init({
		'./data/caniuse2.json'   : CanIUse,
		'./data/additional.json' : Additional
	});

	this.result = {};
};

Checker.prototype.check = function(file) {
	'use strict';

	var extension = path.extname(file).toLowerCase(),
	    ref = this;
	if (extension === '.js') {
		return VowFs.read(file, 'utf-8').then(function(data) {
			var analyzer = new CodeAnalyzer();
			analyzer.check(data);

			var matches = [].concat.apply([], analyzer.getMatches());

			for (var index = 0, ubound = matches.length; index < ubound; index++) {
				var currentItem = matches[index],
				    key = currentItem.key;
				if (ref.result[key] == null) {
					currentItem.files = [];
					currentItem.files.push(file);
					ref.result[key] = currentItem;
				} else {
					ref.result[key].files.push(file);
				}
			}

			return {
				file    : file,
				matches : matches.length
			};
		});

		var defer = Vow.defer();
		defer.resolve(null);

		return defer.promise();
	}
};

Checker.prototype.getResult = function() {
	'use strict';

	return this.result;
};

module.exports = Checker;
