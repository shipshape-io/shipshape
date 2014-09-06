#!/usr/bin/env node

var forever = require('forever-win'),
    path    = require('path');

var properties = {};
var arguments = process.argv[process.argv.length - 1];
if (arguments[0] == '-') {
  properties.daemon = arguments.indexOf('d') > -1;
}

var command = path.join(__dirname, 'main.js');
var options = {
  uid: 'testly'
}
if (properties.daemon) forever.startDaemon(command, options);
else forever.start(command, options);