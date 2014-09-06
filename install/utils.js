var fs    = require('fs'),
    http  = require('http'),
    https = require('https'),
    path  = require('path'),
    url   = require('url'),
    restler = require('restler'),
    unzip = require('unzip');

/**
 * GET a HTTPS resource and save it to a file. Upon completion,
 * invoke a callback with the path of the generated file.
 *
 * @param {String} fileUrl
 * @param {String} directory
 * @param {Function} callback
 */
function downloadFile(fileUrl, directory, callback) {
  var fileName = path.basename(fileUrl);
  var targetPath = path.join(directory, fileName);
  var localFileStream = null;

  var protocol = url.parse(fileUrl).protocol;
  var httplib = (protocol == 'http:') ? http : https;

  httplib.get(fileUrl, function(res) {
    if (res.statusCode != 200) {
      var error = new Error('Could not GET ' + fileUrl);
      callback(error, null);
    } else {
      localFileStream = fs.createWriteStream(targetPath);
      res.on('data', function(chunk) {
        localFileStream.write(chunk);
      });
      res.on('end', function() {
        localFileStream.end();
        callback(null, targetPath);
      });
    }
  }).on('error', function(e) { 
    if (localFileStream != null) {
      try {
        localFileStream.end();
        // Delete the partial file, but don't wait for it.
        fs.unlink(targetPath)
      } catch(fe) {}
    }
    callback(e, null);
  });
}

/**
 * Unzip a zip file, and upon completion, invoke a callback
 * with the path that the zip was extracted to.
 *
 * @param {String} zipPath
 * @param {String} directory
 * @param {Function} callback
 */
function unzipFile(zipPath, directory, callback) {
  try {
    fs.createReadStream(zipPath)
      .pipe(unzip.Extract({ path: directory }))
      .on('close', function() {
        callback(null, directory);
      });
  } catch(e) {
    callback(e, null);
  }
}

/**
 * GET headers for a HTTP resource
 *
 * @param {String} fileUrl
 * @param {Function(headers)} callback
 */
function getHeaders(fileUrl, callback) {
  restler.head(fileUrl).on('complete', function(data, response) {
    if (data instanceof Error) {
      console.log("connection failed, retry in 10 seconds");
      setTimeout(function() { getHeaders(fileUrl, callback) }, 10000);
    } else {
      callback(response.headers);
    }
  });
}

exports.downloadFile = downloadFile;
exports.unzipFile = unzipFile;
exports.getHeaders = getHeaders;