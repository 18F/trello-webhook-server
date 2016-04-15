'use strict';

var http = require('http');
var getHTTPHandler = require('./http-handler');
var setupSIG = require('./setup-sigint-sigterm');

module.exports = function getHTTPServerSetup(tws, handlers) {
  var that = tws;
  return function setup(modelID) {
    that.config.modelID = modelID;

    var path = that.config.hostURL;
    if (path.substr(0, -1) !== '/') {
      path += '/';
    }
    that.config.callbackURL = '' + path + modelID;

    var httpHandler = getHTTPHandler(that, handlers);

    var server = http.createServer();
    server.on('request', httpHandler);

    return new Promise(function (resolve) {
      server.listen(that.config.port, function () {
        setupSIG(that.registrar);
        resolve(that.registrar.register(that.config.callbackURL, modelID));
      });
    });
  };
};