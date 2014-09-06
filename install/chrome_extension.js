var fs      = require('fs'),
    path    = require('path'),
    install = require('./install'),
    utils   = require('./utils');

function ChromeExtensionInstaller(config) {
  install.Installer.call(config);
  this.extensionResource = config.resources.extension;
}

ChromeExtensionInstaller.prototype = Object.create(install.Installer.prototype);
ChromeExtensionInstaller.prototype.constructor = ChromeExtensionInstaller;

ChromeExtensionInstaller.prototype.resource = function(platform, installPath) {
  return {
    name: 'extension',
    path: path.join(installPath, 'src')
  }
}

ChromeExtensionInstaller.prototype.install = function(platform, installPath, tmpPath, callback) {
  var zipFileUrl = this.extensionResource.all;
  var installedResource = this.resource(platform, installPath);

  fs.exists(installedResource.path, function(exists) {
    if (exists) callback(null, installedResource);
    else {
      utils.downloadFile(zipFileUrl, tmpPath, function(downloadErr, zipFilePath) {
        if (downloadErr) callback(downloadErr, null);
        else {
          utils.unzipFile(zipFilePath, installPath, function(unzipErr, _) {
            if (unzipErr) callback(unzipErr, null);
            else callback(null, installedResource);
          });
        }
      });
    }
  });
}

exports.ChromeExtensionInstaller = ChromeExtensionInstaller;