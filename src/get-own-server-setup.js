'use strict';

const http = require('http');
const getHTTPHandler = require('./http-handler');
const setupSIG = require('./setup-sigint-sigterm');

module.exports = function getHTTPServerSetup(tws, handlers) {
  const that = tws;
  return function setup(modelID) {
    that.config.modelID = modelID;

    let path = that.config.hostURL;
    if (path.substr(0, -1) !== '/') {
      path += '/';
    }
    that.config.callbackURL = `${path}${modelID}`;

    const httpHandler = getHTTPHandler(that, handlers);

    const server = http.createServer();
    server.on('request', httpHandler);

    return new Promise(resolve => {
      server.listen(that.config.port, () => {
        setupSIG(that.registrar);
        resolve(that.registrar.register(that.config.callbackURL, modelID));
      });
    });
  };
};
