var fs              = require('fs'),
    os              = require('os'),
    path            = require('path'),
    Q               = require('q'),
    update          = require('./install/update'),
    webDriver       = require('./install/webdriver'),
    chromeExtension = require('./install/chrome_extension');

function platformInstallPath(platform) {
  if (!platform) platform = os.platform();
  
  var installRoot = null;
  var installFolderName = null;

  if (platform == 'win32') {
    installRoot = process.env.LOCALAPPDATA || process.env.APPDATA;
    installFolderName = "Testly";
  } else {
    installRoot = path.resolve(process.env.HOME);
    installFolderName = '.testly';
  }

  return path.join(installRoot, installFolderName);
}

/**
 * Setup all requirements to a given path.
 *
 * @param {String} path
 * @return {Promise}
 */
function setup(setupPath, callback) {
  var config = require('./config');
  var platform = os.platform();
  var arch = process.arch;
  var tmpPath = os.tmpdir();
  var installPath = platformInstallPath(platform);

  var updater = new update.Updater(config);
  console.log("checking for updates");
  updater.update(installPath, function(updateInfo) {
    console.log("creating the install directory");
    fs.mkdir(installPath, function(installPathErr) {
      if (installPathErr && installPathErr.code != 'EEXIST') callback(installPathErr, null);
      else {
        if (updateInfo) {
          console.log("update installed");
          updater.writeUpdateInfo(updateInfo, installPath);
        }
        // Try to create the tmp directory
        fs.mkdir(tmpPath, function(tmpPathErr) {
          if (tmpPathErr && tmpPathErr.code != 'EEXIST') callback(tmpPathErr, null);
          else {
            var installers = [
              // Add all your installers here.
              new webDriver.WebDriverInstaller(config),
              new chromeExtension.ChromeExtensionInstaller(config),
            ];

            var installFutures = installers.map(function(installer) {
              return installer.installFuture({ platform: platform, arch: arch }, installPath, tmpPath);
            });

            Q.all(installFutures)
              .then(function(results) {
                var installLookup = {};
                for (var i = 0; i < results.length; i++) {
                  installLookup[results[i].name] = results[i].path;
                }

                callback(null, installLookup);
              }, function(error) {
                callback(error, null);
              }).done();
          }
        });
      }
    });
  });
}
exports.platformInstallPath = platformInstallPath;
exports.setup = setup;
