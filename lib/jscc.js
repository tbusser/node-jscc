var Intermediary = require('./Intermediary'),
	FileLoader = require('./FileLoader'),
	DataStore = require('./DataStore'),
	CodeAnalyzer = require('./CodeAnalyzer'),
	glob = require('glob');

(function() {
	var argv = require('minimist')(process.argv.slice(2));
	    dataLoaderHandler = null;

	function logMessage(message, channel) {
		console.log('[' + channel + '] ' + message.message);
	}

	function processFiles() {
		if (DataStore.isReady()) {
			glob(argv.files, function(er, files) {
				if (er != null)  {
					console.log(er);
				} else if (files.length === 0){
					console.log('No files matching the critria were found');
				} else {
					console.log(files);
				}
			});
		} else {
			console.log('DataStore not ready!');
		}
	}

	function onDataLoaderMessage(message, channel) {
		var cleanUp = false;
		switch (channel) {
		case 'dataloader:download-completed':
			// The loader was able to download all the data we need, we can proceed
			// with intializing the data store and analyzing the code
			DataStore.init(fileLoaderController.getData());
			processFiles();
			cleanUp = true;
			break;
		case 'dataloader:too-many-attempts':
			console.log('[' + channel + '] Unable to download the necessary files, maximum attempts reached');
			cleanUp = true;
			break;
		default:
			// The compatibility data didn't get downloaded, this needs some
			// more to better deal with situations where things didn't go as
			// planned
			console.log('[' + channel + '] Unable to download necessary data for analysis.');
			break;
		}

		if (cleanUp) {
			Intermediary.unsubscribe('dataloader', dataLoaderHandler);
			fileLoaderController = null;
			dataLoaderHandler = null;
		}
	}

	function init() {
		// Subscribe to notification messages, these need to be logged
		Intermediary.subscribe('notification', logMessage);

		dataLoaderHandler = Intermediary.subscribe('dataloader', onDataLoaderMessage);

		// Initialize the file loader and have it load the compatibility data
		fileLoaderController = new FileLoader();
		fileLoaderController.loadData({
			'./data/caniuse2.json'   : null,
			'./data/additional.json' : null
		});
	}

	if (argv.files == null) {
		console.log('No file (pattern) specified');
		process.exit(-1);
	} else {
		init();
	}
})();
