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

function startDaemon() {
  console.log('Launching Shipshape Daemon...');
  forever.startDaemon(command, options);
  console.log('Shipshape is running in the background. Define tests by visiting https://shipshape.io/tests. Run "shipshape stop" to stop it.');
}

function stopDaemon() {
  console.log('Shutting down Shipshape');
  forever.stopAll();
}

function daemonStatus() {
  forever.list(null, function(_, processes) {
    if (processes == null) console.log('Shipshape is not running')
    else console.log('Shipshape is running: ' + JSON.stringify(processes));
  });
}

function main() {
  if (properties.daemon) startDaemon();
  else forever.start(command, options); 
}
if (require.main === module) main();

exports.startDaemon = startDaemon;
exports.stopDaemon = stopDaemon;
exports.daemonStatus = daemonStatus;
