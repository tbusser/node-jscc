var exit = require('exit'),
	fs = require('fs'),
	Checker = require('./Checker'),
	path = require('path'),
	Vow = require('vow');

module.exports = function(program) {
	var args = program.args,
		checker = new Checker(),
		config,
		defer = Vow.defer(),
		promise = defer.promise(),
		reporter,
		reporterPath,
		returnArgs = {
			checker  : checker,
			promise  : promise,
			reporter : program.reporter
		};

	promise.always(function(status) {
		exit(status.valueOf());
	});

	if (!args.length && process.stdin.isTTY) {
		console.error('No input file(s) specified. Try --help help for usage information');
		defer.reject(1);

		return returnArgs;
	}

	if (config == null) {
		config = {};
	}

	// Try to determine the reporter which should be used to show the module output
	if (program.reporter) {
		reporterPath = path.resolve(process.cwd(), program.reporter);
		returnArgs.reporter = reporterPath;

		if (!fs.existsSync(reporterPath)) {
			reporterPath = './reporters/' + program.reporter;
		}
	} else {
		reporterPath = './reporters/console';
	}

	// Try to load the reporter
	try {
		reporter = require(reporterPath);
	} catch (exception) {
		console.error('Reporter %s doesn\'t exist.', reporterPath);
		defer.reject(1);

		return returnArgs;
	}

	if (args.length > 0) {
		// Now we need to do the actual work, check every file argument we've
		// received
		Vow.all(args.map(checker.check, checker)).then(function(results) {
			reporter(checker.getResult());
			defer.resolve(0);
		}).fail(function(error) {
			console.error(error.stack);
			defer.reject(1);
		});
	}

	return returnArgs;
};
