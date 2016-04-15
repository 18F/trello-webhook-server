'use strict';

var log = require('./error-log');

module.exports = function setupProcessEndHandlers(registrar) {
  var _SIGINT = function _SIGINT() {
    var callback = function callback() {
      process.removeListener('SIGINT', _SIGINT);
      process.kill(process.pid, 'SIGINT');
    };

    registrar.unregister().then(callback).catch(function () {
      log('Failed to unregister webhook');
      callback();
    });
  };

  var _SIGTERM = function _SIGTERM() {
    var callback = function callback() {
      process.removeListener('SIGTERM', _SIGTERM);
      process.kill(process.pid, 'SIGTERM');
    };

    registrar.unregister().then(callback).catch(function () {
      log('Failed to unregister webhook');
      callback();
    });
  };

  process.on('SIGINT', _SIGINT);
  process.on('SIGTERM', _SIGTERM);
};