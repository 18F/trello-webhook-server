'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var request = require('request');

var WebhookRegistrar = function () {
  function WebhookRegistrar(apiKey, apiToken) {
    _classCallCheck(this, WebhookRegistrar);

    this.apiKey = apiKey;
    this.apiToken = apiToken;
    this.webhookID = false;
  }

  _createClass(WebhookRegistrar, [{
    key: 'register',
    value: function register(callbackURL, modelID) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        if (!_this.webhookID) {
          request.post('https://api.trello.com/1/webhooks', {
            body: {
              description: 'Trello Webhook Server',
              callbackURL: callbackURL,
              idModel: modelID,
              key: _this.apiKey,
              token: _this.apiToken
            },
            json: true
          }, function (err, res, body) {
            if (err) {
              reject(err);
            } else if (typeof body === 'string') {
              reject(body);
            } else {
              _this.webhookID = body.id;
              resolve(body.id);
            }
          });
        } else {
          resolve();
        }
      });
    }
  }, {
    key: 'unregister',
    value: function unregister() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        if (_this2.webhookID) {
          request.del('https://api.trello.com/1/webhooks/' + _this2.webhookID + '?key=' + _this2.apiKey + '&token=' + _this2.apiToken, { json: true }, function (err, res, body) {
            if (err) {
              reject(err);
            } else if (typeof body === 'string') {
              reject(body);
            } else {
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
    }
  }]);

  return WebhookRegistrar;
}();

module.exports = WebhookRegistrar;