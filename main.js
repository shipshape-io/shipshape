#!/usr/bin/env node

var TESTLY_PORT = 9999;
var WEBDRIVER_PORT = 9515;
var SOCKET_PORT = 31415;
var ORIGINS = ['https://shipshape.io',
               'http://127.0.0.1:8000', 'http://localhost:8000']

var exec = require('child_process').spawn;
var fs = require('fs');
var httpProxy = require('http-proxy');
var https = require('https');

var setup = require('./setup');

function run(resources) {
  var verbose = process.argv[process.argv.length - 1] == '-v';
  var proxy = httpProxy.createProxyServer({});
  var options = {
    key: fs.readFileSync(__dirname + '/keys/ssl.key'),
    cert: fs.readFileSync(__dirname + '/keys/ssl-unified.crt')
  };
  var server = https.createServer(options, function(req, res) {
    res.oldWriteHead = res.writeHead;
    res.writeHead = function(statusCode, headers) {
      var originIndex = ORIGINS.indexOf(req.headers.origin);
      if (originIndex > -1) {
        res.setHeader('Access-Control-Allow-Origin', ORIGINS[originIndex]);
        res.setHeader('Access-Control-Allow-Methods', 'HEAD, POST, GET, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'content-type');
	      res.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      if (req.method == 'OPTIONS') statusCode = 200;
      if (req.method == 'GET' && req.url.indexOf("/status") != -1) {
        res.setHeader('Access-Control-Expose-Headers', 'X-Chrome-Extension-Path');
        res.setHeader('X-Chrome-Extension-Path', resources.extension);
      }
      if (req.method == 'GET' && req.url.indexOf("/ping") != -1) {
        io.sockets.emit('ping', {});
      }
      res.oldWriteHead(statusCode, headers);
    }

    proxy.web(req, res, { target: 'http://localhost:' + WEBDRIVER_PORT });
  });

  var app = require('express')();
  var httpsServer = https.createServer(options, app);
  var io = require('socket.io').listen(httpsServer);
  httpsServer.listen(SOCKET_PORT);

  console.log('launching Testly on port ' + TESTLY_PORT);
  if (verbose) console.log('verbose logging enabled');
  server.listen(TESTLY_PORT);
  
  var driver = exec(resources.webdriver);
  process.on('SIGINT', function() {
    driver.kill('SIGINT');
    process.exit();
  });

  io.on('connection', function(socket){
    socket.on('message', function(msg){
      if (verbose) console.log("type: " + msg.type);
      socket.broadcast.emit('message', msg);
    });
  });
}

setup.setup('.', function(err, resources) {
  if (err) throw err;
  run(resources);
});
