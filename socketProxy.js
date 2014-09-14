/* Socket.io Proxy for Shipshape 
 * - Broadcasts all incoming messages to all connected sockets
 * - Returns a Socket.io object
 */

var https = require('https');
var app = require('express')();

function start(options, port) {
  var httpsServer = https.createServer(options, app);
  var io = require('socket.io').listen(httpsServer);
  httpsServer.listen(port);

  io.on('connection', function(socket){
    socket.on('message', function(msg){
      socket.broadcast.emit('message', msg);
    });
  });

  return io;
}

exports.start = start;