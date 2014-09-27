#!/usr/bin/env node
var backend = "https://shipshape.io"
var api_url = "/api/v1/";


/* Command line tool for interacting with Shipshape.io */
var fs       = require('fs'),
    setup    = require('./setup'),
    minimist = require('minimist'),
    prompt   = require('prompt'),
    rest     = require('restler'),
    util     = require('util'),
    Table    = require('cli-table'),
    updater  = require('./install/update'),
    testly   = require('./testly');

function run(config) {
  var headers = {
    "Authorization": "ApiKey " + config.email_address + ":" + config.api_key,
    "Content-type": "application/json"
  }
  var command = argv['_'][0];
  var resource = argv['_'][1];
  if (command == 'config') {
    getConfig(console.log, true);
  }
  else if (command == 'list' && resource) {
    if (resource == 'test' || resource == 'tests')
      list('test', headers, ['name', 'creator_name', 'id']);
    else if (resource == 'tag' || resource == 'tags')
      list('tag', headers, ['id', 'name', 'test_count']);
  }
  else if (command == 'run') {
    var executionInfo = {source: 'C', email_behavior: 'F', variables: argv}
    if (argv.email && argv.email.substr(0, 2).toLowerCase() == 'no') executionInfo.email_behavior = 'N';

    if (argv.test_id) post('test/' + argv.test_id, headers, {executionInfo: executionInfo});
    else if (argv.test_ids) post('tests/', headers, {executionInfo: executionInfo, test_ids: argv.test_ids.split(",")});
    else if (argv.tag) run_tag_name(argv.tag, headers, executionInfo);
    else if (argv.tag_id) run_tag(argv.tag_id, headers, executionInfo);
  }
  else if (command == 'debug') {
    console.log(argv);
  }
  else console.log("Command not recognized. Please see https://shipshape.io for help.");
}

function run_tag(tag_id, headers, executionInfo) {
  post('tag/' + tag_id, headers, {executionInfo: executionInfo});
}

function run_tag_name(tag_name, headers, executionInfo) {
  rest.get(backend + api_url + "tag/?name=" + tag_name, {
    headers: headers
  }).on('complete', function(result) {
    if (result instanceof Error || result.length == 0) {
      if (result.message) console.log('Error:', result.message);
      else getConfig(run, true);
    } else if (result.objects) {
      if (result.objects.length == 0) console.log('No tag exists with the name: ' + tag_name);
      else run_tag(result.objects[0].id, headers, executionInfo);
    }
  });
}

function post(resource, headers, data) {
  rest.post(backend + api_url + resource, {
    headers: headers,
    data: JSON.stringify(data)
  }).on('complete', ping);
}

function ping() {
  try {
    rest.get('https://local.shipshape.io:9999/ping')
  } catch(e) {
    //do nothing
  }
}

function list(resource, headers, columns) {
  rest.get(backend + api_url + resource, {
    headers: headers
  }).on('complete', function(result) {
    if (result instanceof Error || result.length == 0) {
      if (result.message) console.log('Error:', result.message);
      else getConfig(run, true);
    } else {
      printTable(columns, result.objects);
    }
  });
}

function getConfig(callback, invalid) {
  var path = setup.platformInstallPath();
  fs.mkdir(path, function() {
    var configPath = path + "/config.json";
    var config = updater.read(configPath);
    if (invalid || !config.api_key || !config.email_address) {
      console.log("Please visit " + backend + "/account to get your key")
      prompt.get(['api_key', 'email_address'], function(err, result) {
        if (!err) {
          updater.write(result, configPath);
          callback(updater.read(configPath));
        } else {
          console.log("");
        }
      });
    } else callback(config);
  });
}

function printTable(headers, data) {
  var table = new Table({head: headers});
  function toRow(obj) {
    return headers.map(function(header) { return obj[header] });
  }
  table.push.apply(table, data.map(toRow));
  console.log(table.toString());
}

var argv = minimist(process.argv.slice(2));
if (argv['_'].length < 1) return console.error("Invalid usage. Please specify a command to run (i.e., 'shipshape run --test_id=2')");
if (argv.local) backend = "http://localhost:8000";

if (argv['_'][0] == "start") testly.startDaemon();
else if (argv['_'][0] == "stop") testly.stopDaemon();
else if (argv['_'][0] == "status") testly.daemonStatus();
else getConfig(run);