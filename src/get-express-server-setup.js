'use strict';

const getHTTPHandler = require('./http-handler');
const setupSIG = require('./setup-sigint-sigterm');

module.exports = function getExpressServerSetup(tws, handlers) {
  const that = tws;
  return function setup(modelID) {
    that.config.modelID = modelID;

    let path = that.config.hostURL;
    if (path.substr(0, -1) !== '/') {
      path += '/';
    }
    that.config.callbackURL = `${path}${modelID}`;
    path = that.config.callbackURL.match(/https?:\/\/[^\/]+(\/.*)/)[1];

    const httpHandler = getHTTPHandler(that, handlers);

    const realHandler = function realHandler(req, res, next) {
      httpHandler(req, res);
      next();
    };

    that.config.server.head(path, realHandler);
    that.config.server.put(path, realHandler);
    that.config.server.post(path, realHandler);

    setupSIG(that.registrar);
    return that.registrar.register(that.config.callbackURL, modelID);
  };
};
