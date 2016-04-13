'use strict';

const http = require('http');
let server = null;

class HTTPServer {
  constructor(port, handler) {
    this._port = port;
    this._server = http.createServer(handler);
    this._server.listen(port, '0.0.0.0');
  }
}

module.exports = function get(port, handler) {
  return new Promise((resolve) => {
    if (!server) {
      server = new HTTPServer(port, handler);
    }
    // Wait briefly so we can be sure the server
    // is up and listening
    setTimeout(() => resolve(server), 500);
  });
};
