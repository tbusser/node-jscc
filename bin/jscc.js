#!/usr/bin/env node

var cli = require('../lib/cli'),
    program = require('commander');

program.version(require('../package.json').version);
program.usage('[options] glob');
program.option('-v, --verbose', 'outputs more detailed step information');
program.option('-r, --reporter <reporter>', 'match reporter, console - default');
program.parse(process.argv);

cli(program);
