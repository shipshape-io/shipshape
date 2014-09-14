/* HTTP Proxy for Shipshape 
 * - Allows CORS access to webdriver running at webdriverPort for specified origins
 * - Sends path to Shipshape Chrome extension as part of the /status request
 * - Handles a ping request which calls pingCallback()
 */

var httpProxy = require('http-proxy');
var https = require('https');

function start(options, port) {
  var proxy = httpProxy.createProxyServer({});
  var server = https.createServer(options, function(req, res) {
    res.oldWriteHead = res.writeHead;
    res.writeHead = function(statusCode, headers) {
      var originIndex = options.origins.indexOf(req.headers.origin);
      if (originIndex > -1) {
        res.setHeader('Access-Control-Allow-Origin', options.origins[originIndex]);
        res.setHeader('Access-Control-Allow-Methods', 'HEAD, POST, GET, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'content-type');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      if (req.method == 'OPTIONS') statusCode = 200;
      if (req.method == 'GET' && req.url.indexOf("/status") != -1) {
        res.setHeader('Access-Control-Expose-Headers', 'X-Chrome-Extension-Path');
        res.setHeader('X-Chrome-Extension-Path', options.resources.extension);
      }
      if (req.method == 'GET' && req.url.indexOf("/ping") != -1) {
        options.pingCallback();
      }
      res.oldWriteHead(statusCode, headers);
    }

    proxy.web(req, res, { target: 'http://localhost:' + options.webdriverPort });
  });

  server.listen(port);
}

exports.start = start;