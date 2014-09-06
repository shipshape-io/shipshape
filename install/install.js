var Q = require('q');

function Installer(config) {
  this.config = config;
}

Installer.prototype.install = function(platform, installPath, tmpPath, callback) {
  var error = new Error("Method unimplemented.");
  callback(error, null);
}

Installer.prototype.installFuture = function(platform, installPath, tmpPath) {
  var deferredInstall = Q.defer();
  this.install(platform, installPath, tmpPath, function(err, resource) {
    if (err) deferredInstall.reject(err);
    else deferredInstall.resolve(resource);
  });

  return deferredInstall.promise;
}

exports.Installer = Installer;