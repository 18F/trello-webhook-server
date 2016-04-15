'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WebhookRegistrar = require('./register-webhook');
var handlers = {};

var TrelloWebhookServer = function () {
  function TrelloWebhookServer(config) {
    _classCallCheck(this, TrelloWebhookServer);

    // port, host, apiKey, apiToken, clientSecret) {
    if (!config) {
      throw new Error('Config is required');
    }
    this.config = {};
    if (config.server) {
      if (config.server.constructor.name === 'Server') {
        if (config.server.use) {
          this.config.server = config.server;
          this.start = require('./get-express-server-setup')(this, handlers);
        } else {
          this.config.server = config.server;
          this.start = require('./get-http-server-setup')(this, handlers);
        }
      } else {
        throw new Error('Server (config.server) must be an Express/Restify-style server or an Http.Server');
      }
    } else {
      var numPort = 0;
      numPort = Number(config.port);
      if (!config.port || Number.isNaN(numPort) || numPort < 0 || numPort > 65535) {
        throw new Error('Port (config.port) must be numeric, greater than 0 and less than 65536');
      }
      this.config.port = numPort;
      this.start = require('./get-own-server-setup')(this, handlers);
    }

    if (!config.hostURL || !config.hostURL.match(/^https?:\/\//)) {
      throw new Error('Host URL (config.hostURL) must be specified and must begin with http:// or https://');
    }

    if (!config.apiKey) {
      throw new Error('Trello API key (config.apiKey) must be specified');
    }

    if (!config.apiToken) {
      throw new Error('Trello API token (config.apiToken) must be specified');
    }

    if (!config.clientSecret) {
      throw new Error('Trello client secret (config.clientSecret) must be specified');
    }

    this.config.hostURL = config.hostURL;
    this.config.clientSecret = config.clientSecret;

    this.registrar = new WebhookRegistrar(config.apiKey, config.apiToken);
  }

  _createClass(TrelloWebhookServer, [{
    key: 'cleanup',
    value: function cleanup() {
      return this.registrar.unregister();
    }
  }, {
    key: 'on',
    value: function on(eventName, handler) {
      if (!this.config.modelID) {
        throw new Error('Cannot subscribe to events prior to calling start');
      }
      if (!handlers[this.config.modelID]) {
        handlers[this.config.modelID] = {};
      }
      if (!Array.isArray(handlers[this.config.modelID][eventName])) {
        handlers[this.config.modelID][eventName] = [];
      }
      if (typeof handler === 'function') {
        handlers[this.config.modelID][eventName].push(handler);
      }
    }
  }]);

  return TrelloWebhookServer;
}();

module.exports = TrelloWebhookServer;