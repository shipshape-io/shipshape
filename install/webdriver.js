var fs      = require('fs'),
    path    = require('path'),
    install = require('./install'),
    utils   = require('./utils');

function WebDriverInstaller(config) {
  install.Installer.call(config);

  this.webdriverResource = config.resources.webdriver;
  this.executableLookup = {
    darwin: 'chromedriver',
    linux:  'chromedriver',
    win32:  'chromedriver.exe'
  }
}

WebDriverInstaller.prototype = Object.create(install.Installer.prototype);
WebDriverInstaller.prototype.constructor = WebDriverInstaller;

WebDriverInstaller.prototype.resource = function(platform, installPath) {
  return {
    name: 'webdriver',
    path: path.join(installPath, this.executableLookup[platform.platform])
  }
}

WebDriverInstaller.prototype.install = function(platform, installPath, tmpPath, callback) {
  var zipFileUrl = this.webdriverResource[platform.platform][platform.arch];
  var installedResource = this.resource(platform, installPath);

  fs.exists(installedResource.path, function(exists) {
    if (exists) callback(null, installedResource);
    else {
      utils.downloadFile(zipFileUrl, tmpPath, function(downloadErr, zipFilePath) {
        if (downloadErr) callback(downloadErr, null);
        else {
          utils.unzipFile(zipFilePath, installPath, function(unzipErr, _) {
            if (unzipErr) callback(unzipErr, null);
            else {
              fs.chmod(installedResource.path, 0755, function(chmodErr) {
                if (chmodErr) callback(chmodErr, null);
                else callback(null, installedResource);
              });
            };
          });
        }
      });
    }
  });
}

exports.WebDriverInstaller = WebDriverInstaller;