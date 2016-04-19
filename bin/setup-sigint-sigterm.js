'use strict';

var log = require('./error-log');

function getHandler(signal, registrar) {
  var fn = function fn() {
    var callback = function callback() {
      process.removeListener(signal, fn);
      process.kill(process.pid, signal);
    };

    registrar.unregister().then(callback).catch(function () {
      log('Failed to unregister webhook');
      callback();
    });
  };

  return process.on(signal, fn);
}

module.exports = function setupProcessEndHandlers(registrar) {
  getHandler('SIGINT', registrar);
  getHandler('SIGTERM', registrar);
};