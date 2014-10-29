var Intermediary = require('./Intermediary'),
	FileLoader = require('./FileLoader'),
	DataStore = require('./DataStore'),
	CodeAnalyzer = require('./CodeAnalyzer'),
	glob = require('glob'),
	fs = require('fs');

(function() {
	'use strict';

	var argv = require('minimist')(process.argv.slice(2)),
	    dataLoaderHandler,
	    fileLoaderController,
	    callCount = 0,
	    matches = {};


	/* ====================================================================== *\
		APP LOGIC
	\* ====================================================================== */
	/**
	 * This method handles the message from the CodeAnalyzer signaling a file
	 * has been analyzed
	 */
	function onCodeAnalyzed(message) {
		// 1: The message from the analyzer contains a reference to the instance
		//    of the analyzer that sent the message
		// 2: Get the matches that the instance of the CodeAnalyzer has found
		var analyzer = message.sender,					/* [1] */
			fileMatches = analyzer.getMatches();		/* [2] */

		// Log a message for debugging purposes
		logMessage('Code analyzed for "' + analyzer.getFileName() + '"');

		// Loop over the matches found by the analyzer
		for (var index = 0, ubound = fileMatches.length; index < ubound; index++) {
			// Get an easy reference to the current item
			var currentItem = fileMatches[index];
			// Check of the current item is already in our master object of matches
			if (matches[currentItem.key]) {
				// The API has already been detected in another file. We just
				// add the filename this analyzer has been working on to the
				// array of files in which the API was detected
				matches[currentItem.key].files.push(analyzer.getFileName());
			} else {
				// This is the first time the API has been detected, give it an
				// array we can use to store the filenames in of the files in
				// which the API is detected
				currentItem.files = [];
				// Push the filename of the file the analyzer has been working
				// on in the array
				currentItem.files.push(analyzer.getFileName());
				// Add the API in the master object of matches
				matches[currentItem.key] = currentItem;
			}
		}

		// Decrease the call count, another analyzer has completed its work
		callCount--;

		// Check if all analyzers have completed their work
		if (callCount === 0) {
			// All files have been analyzed, our work is done
			logMessage('All files analyzed');
			logMessage(matches);
		}
	}

	/**
	 * This method handles messages posted by the FileLoader module, it informs
	 * us on the progress of loading the compatibility data
	 */
	function onDataLoaderMessage(message, channel) {
		var cleanUp = false;

		switch (channel) {
		case 'dataloader:download-completed':
			// The loader was able to download all the data we need, we can proceed
			// with intializing the data store and analyzing the code
			DataStore.init(fileLoaderController.getData());
			// With the DataStore initialized we can start processing the files
			processFiles();
			cleanUp = true;
			break;
		case 'dataloader:too-many-attempts':
			logMessage('Unable to download the necessary files, maximum attempts reached', channel);
			cleanUp = true;
			break;
		default:
			// The compatibility data didn't get downloaded, this needs some
			// more to better deal with situations where things didn't go as
			// planned
			logMessage('Unable to download necessary data for analysis', channel);
			break;
		}

		// Check if the cleanup flag is set, if it is we clean up the data loader
		if (cleanUp) {
			Intermediary.unsubscribe('dataloader', dataLoaderHandler);
			fileLoaderController = null;
			dataLoaderHandler = null;
		}
	}

	/**
	 * This method takes the file glob and loops over all the files covered by
	 * the glob.
	 */
	function processFiles() {
		// Make sure the DataStore is ready before we continue
		if (DataStore.isReady()) {
			// Resolve the glob to individual files
			glob(argv.files, function(er, files) {
				if (er != null)  {
					logMessage(er, 'processFiles');
				} else if (files.length === 0) {
					logMessage('No files matching the critria were found', 'processFiles');
				} else {
					// Log the resolved files from the glob
					logMessage(files, 'processFiles');
					// Set the call count, this will be decreased once each file
					// has been processed or was unable to load
					callCount = files.length;
					// Loop over all the files and load each and every one
					for (var index = 0, ubound = files.length; index < ubound; index++) {
						loadFile(files[index]);
					}
				}
			});
		} else {
			logMessage('DataStore not ready!', 'processFiles');
		}
	}


	/* ====================================================================== *\
		FILE LOADING
	\* ====================================================================== */
	function loadFile(fileName) {
		// Load the file async
		fs.exists(fileName, function(exists) {
			if (exists) {
				fs.readFile(fileName, function(error, data) {
					if (error) {
						callCount--;
						throw error;
					} else {
						onFileLoaded(fileName, data.toString());
					}
				});
			} else {
				callCount--;
				logMessage('The file "' + fileName + '" (no) longer exists');
			}
		});
	}

	function onFileLoaded(fileName, data) {
		// Log a message so we can track the progress
		logMessage('Data loaded from "' + fileName + '"');
		// Create a new instance of the CodeAnalyzer
		var analyzer = new CodeAnalyzer();

		// Analyze the file content for API calls. Once the analyzer is done it
		// will post a message to the 'codeAnalyzed' channel.
		analyzer.check(data, fileName);
	}


	/* ====================================================================== *\
		LOGGING
	\* ====================================================================== */
	function logMessage(message, channel) {
		// If no channel name has been provided we will default to jscc
		if (channel == null) {
			channel = 'jscc';
		}
		// If this method was called as a result of a message being received
		// than message is an object and should have a message property
		if (typeof message === 'object' && message.hasOwnProperty('message')) {
			// Get the message property and assign it to message, this way it
			// will be the same as when the method is called manually
			message = message.message;
		}
		// Log the message to the command line
		console.log('[' + channel + '] ', message);
	}


	/* ====================================================================== *\
		INITIALIZATION
	\* ====================================================================== */
	function init() {
		// Subscribe to notification messages, these need to be logged
		Intermediary.subscribe('notification', logMessage);
		// Subscribe to the message posted when a file has been analyzed
		Intermediary.subscribe('codeAnalyzed', onCodeAnalyzed);
		// Subscribe to the messages from the dataloader, keep the subscriber ID
		// so we can unsubscribe at a later time
		dataLoaderHandler = Intermediary.subscribe('dataloader', onDataLoaderMessage);

		// Initialize the file loader and have it load the compatibility data
		fileLoaderController = new FileLoader();
		fileLoaderController.loadData({
			'./data/caniuse2.json'   : null,
			'./data/additional.json' : null
		});
	}

	// Check if a files argument has been provided, if not we don't have any work to do
	if (argv.files == null) {
		throw('No file (pattern) specified');
	} else {
		// Start the work
		init();
	}
})();
