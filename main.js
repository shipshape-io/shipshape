#!/usr/bin/env node

var HTTP_PROXY_PORT = 9999;
var WEBDRIVER_PORT = 9515;
var SOCKET_PORT = 31415;
var ORIGINS = ['https://shipshape.io',
               'http://127.0.0.1:8000', 'http://localhost:8000']

var exec = require('child_process').spawn;
var fs = require('fs');

var socketProxy = require('./socketProxy');
var httpProxy = require('./httpProxy');
var setup = require('./setup');

var platform = require('os').platform();

function run(resources) {
  var verbose = process.argv[process.argv.length - 1] == '-v';

  //Check for updates to shipshape
  //Only do this non-windows platforms, since Windows handles this at the app level
  try {
    if (platform != 'win32') exec('sh', [__dirname + '/update.sh']);
  } catch(e) { /* do nothing */ }

  var options = {
    //Options for HTTP proxy:
    resources: resources,
    origins: ORIGINS,
    webdriverPort: WEBDRIVER_PORT,
    
    //Options common to HTTP proxy and Socket IO:
    key: fs.readFileSync(__dirname + '/keys/ssl.key'),
    cert: fs.readFileSync(__dirname + '/keys/ssl-unified.crt')
  };
  
  //Run the local Socket.io Proxy
  var io = socketProxy.start(options, SOCKET_PORT);
  
  //Run the local HTTP Proxy
  options.pingCallback = function() { io.sockets.emit('ping', {}) };
  httpProxy.start(options, HTTP_PROXY_PORT);
  
  //Start the webdriver process
  var driver = exec(resources.webdriver);

  //Gracefully exit
  process.on('SIGINT', function() {
    driver.kill('SIGINT');
    process.exit();
  });
}

setup.setup('.', function(err, resources) {
  if (err) throw err;
  run(resources);
});
