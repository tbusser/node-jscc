# jscc-node
This is the start for a Node.js version of the JavaScript Compatibility Checker. It doesn't have feature parity with the [web version](http://jscc.info) yet. It is still very much in development and breaking changes are to be expected.

At the moment there is a CLI which outputs a very limited report for the files it has been fed.

## Roadmap
The following features still need to be added in order to have a useful module:
- The console reporter will have to be expanded upon to report browser compatibility data.
- The module options will have to be extended to accept some filters as to which browsers should show up in the report.
- Submit the module to the NPM.

## Version history
2014-10-30 - v0.3.0 - Refactored the way the module can be run from the command line. It closely follows the way [node-jscs](https://github.com/jscs-dev/node-jscs) is structured as both modules share a lot similarities.

2014-10-29 - v0.2.0 - Some information in the `package.json` file has been updated, no functional changes.

2014-10-29 - v0.1.0 - Initial attempt at a Node.js version of the JSCC. It checks files that are passed along but no output is generated.

## Contributing

If you want to contribute to the project please follow these short guidelines:

- Make atomic pull requests.
- Follow the existing code style. You can make use of the supplied JSHint and JS Code Style rulesets.
