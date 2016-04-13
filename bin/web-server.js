'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var http = require('http');
var server = null;

var HTTPServer = function HTTPServer(port, handler) {
  _classCallCheck(this, HTTPServer);

  this._port = port;
  this._server = http.createServer(handler);
  this._server.listen(port, '0.0.0.0');
};

module.exports = function get(port, handler) {
  return new Promise(function (resolve) {
    if (!server) {
      server = new HTTPServer(port, handler);
    }
    // Wait briefly so we can be sure the server
    // is up and listening
    setTimeout(function () {
      return resolve(server);
    }, 500);
  });
};