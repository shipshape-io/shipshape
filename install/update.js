var rmdir     = require('rimraf'),
    utils     = require('./utils'),
    path      = require('path'),
    fs        = require('fs');

var DB_FILE = 'db.json';

function Updater(config) {
  this.updateResource = config.resources.update;

}

Updater.prototype.constructor = Updater;
Updater.prototype.update = function(installPath, callback) {
  var resource = this.updateResource;
  var filePath = path.join(installPath, DB_FILE);
  utils.getHeaders(resource.endpoint, function(headers) {
    var hash = headers[resource.header];
    if (!fs.existsSync(filePath) || read(filePath)[resource.header] != hash) {
      rmdir(installPath, function(error) {
        if (error) {
          console.error("Unable to update testly.");
          callback();
        } else {
          var updateInfo = {}; updateInfo[resource.header] = hash;
          callback(updateInfo);
        }
      });
    } else {
      console.log("Testly is up to date");
      callback();
    }
  });
}

Updater.prototype.writeUpdateInfo = function(updateInfo, installPath) {
  var filePath = path.join(installPath, DB_FILE);
  write(updateInfo, filePath);
}

function write(obj, filePath) {
  fs.writeFileSync(filePath, JSON.stringify(obj)); 
}

function read(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch(e) {
    return {};
  }
}

exports.read = read;
exports.write = write;
exports.Updater = Updater;