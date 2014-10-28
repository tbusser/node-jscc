(function(root, factory) {
	'use strict';

	if (typeof define === 'function' && define.amd) {
		// AMD
		define(['Intermediary'], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory(require('./Intermediary'));
	} else {
		root.FileLoader = factory(root.Intermediary);
	}
}(this, function(Intermediary) {
	'use strict';

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

	var fs = require('fs'),
	    exports = function(options) {
		    this._options = options;
		    this._attempts = 0;
		    this._callCount = 0;
		    this._isReady = false;
	    };

	exports.prototype = {
		_fileCompleted: function() {
			var ref = this;
			// Check if the call count is 0, if not we need to wait for more data to
			// arrive
			if (this._callCount !== 0) {
				return;
			}

			var retry = false;
			iterate(this._sources, function(key, data) {
				if (data == null) {
					retry = true;
				}
			});

			if (retry) {
				if (this._attempts < 5) {
					this._loadData();
				} else {
					Intermediary.publish('dataloader:too-many-attempts');
				}
			} else {
				// Set the ready flag
				this._isReady = true;

				// Inform subscribers of the fact that the data has been downloaded
				Intermediary.publish('dataloader:download-completed', {
					level   : 9,
					message : 'Compatibility data successfully downloaded'
				});
			}
		},

		_fileLoadFailed: function(fileName) {
			// Decrease the number of outstanding calls
			this._callCount--;

			// Send out a message about the failed attempt
			Intermediary.publish('dataloader:download-failed', {
				level   : 1,
				message : 'Unable to download compatibility data from (' + fileName + ')'
			});

			// Call the call completed method for some housekeeping
			this._fileCompleted();
		},

		_fileLoadSuccess: function(fileName, data) {
			Intermediary.publish('notification:info', {
				level   : 9,
				message : 'Compatibility data from "' + fileName + '" downloaded.'
			});

			// Decrease the number of outstanding calls
			this._callCount--;

			// Store the raw data
			try {
				this._sources[fileName] = JSON.parse(data);
			} catch (exception) {
				Intermediary.publish('notification:error', {
					level   : 1,
					message : 'Unable to JSON.parse the data from "' + fileName + '".'
				});
			}

			// Call the call completed method for some housekeeping
			this._fileCompleted();
		},

		_loadData: function() {
			var ref = this;

			this._attempts++;

			iterate(this._sources, function(key, data) {
				if (data == null) {
					ref._callCount++;

					Intermediary.publish('notification:info', {
						level   : 9,
						message : 'Downloading compatibility data from "' + key + '" (attempt ' + ref._attempts + ').'
					});

					ref._loadFile(key);
				}
			});
		},

		_loadFile: function(fileName) {
			var ref = this;
			fs.exists(fileName, function(exists) {
				if (exists) {
					fs.stat(fileName, function(error, stats) {
						fs.open(fileName, 'r', function(error, fd) {
							var buffer = new Buffer(stats.size);

							fs.read(fd, buffer, 0, buffer.length, null, function(error, bytesRead, buffer) {
							var data = buffer.toString('utf8', 0, buffer.length);

							//console.log(data);
							fs.close(fd);
							ref._fileLoadSuccess(fileName, data);
						});
					});
				});
				} else {
					ref._fileLoadFailed(fileName);
				}
			});
		},

		getData: function() {
			return this._sources;
		},

		loadData: function(sources) {
			this._isReady = false;
			this._sources = sources;
			this._attempts = 0;
			this._loadData();
		}
	};

	return exports;
}));
