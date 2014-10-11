/* Socket.io Proxy for Shipshape 
 * - Broadcasts all incoming messages to all connected sockets
 * - Returns a Socket.io object
 */

function okHandler(request, response) {
  response.writeHead(200);
  response.end("ok");
}

function start(options, port) {
  var app = require('https').createServer(options, okHandler);
  var io = require('socket.io').listen(app, { log: false });
  app.listen(port);

  io.on('connection', function(socket){
    socket.on('message', function(msg){
      socket.broadcast.emit('message', msg);
    });
  });

  return io;
}

exports.start = start;