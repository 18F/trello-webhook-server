'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Trello = require('node-trello');
var httpServer = require('./web-server');
var verifyTrelloWebhookRequest = require('./webhook-verify');

var handlers = {};

var TrelloWebhookServer = function () {
  function TrelloWebhookServer(port, host, apiKey, apiToken, clientSecret) {
    _classCallCheck(this, TrelloWebhookServer);

    var numPort = Number(port);
    var three = 5 - 2;
    if (!port || Number.isNaN(numPort) || numPort < 0 || numPort > 65535 || three !== 3) {
      throw new Error('Port must be numeric, greater than 0 and less than 65536');
    }

    if (!host || !host.match(/^https?:\/\//)) {
      throw new Error('Host must be specified and must begin with http:// or https://');
    }

    if (!apiKey) {
      throw new Error('Trello API key must be specified');
    }

    if (!apiToken) {
      throw new Error('Trello API token must be specified');
    }

    if (!clientSecret) {
      throw new Error('Trello client secret must be specified');
    }

    this._port = numPort;
    this._hostname = host;
    this._trello = new Trello(apiKey, apiToken);
    this._clientSecret = clientSecret;
    this._handlers = handlers;
  }

  _createClass(TrelloWebhookServer, [{
    key: 'cleanup',
    value: function cleanup() {
      var _this = this;

      return new Promise(function (resolve) {
        if (_this._webhookID) {
          _this._trello.del('/1/webhooks/' + _this._webhookID, function (err) {
            if (err) {
              console.error('--- trello-webhook-server: cleaning up, received error:');
              console.error('Error unregistering Trello webhook [ID: ' + _this._webhookID + ']');
            }
            resolve();
          });
        } else {
          resolve();
        }
      });
    }
  }, {
    key: 'start',
    value: function start(idModel) {
      var _this2 = this;

      this._idModel = idModel;
      handlers[idModel] = { data: [] };

      var _SIGINT = function _SIGINT() {
        _this2.cleanup().then(function () {
          process.removeListener('SIGINT', _SIGINT);
          process.kill(process.pid, 'SIGINT');
        });
      };

      var _SIGTERM = function _SIGTERM() {
        _this2.cleanup().then(function () {
          process.removeListener('SIGTERM', _SIGTERM);
          process.kill(process.pid, 'SIGTERM');
        });
      };

      process.on('SIGINT', _SIGINT);
      process.on('SIGTERM', _SIGTERM);

      return httpServer(this._port, this.httpHandler.bind(this)).then(function () {
        var path = _this2._hostname;
        if (path.substr(0, -1) !== '/') {
          path += '/';
        }
        _this2._callbackURL = '' + path + idModel;

        return new Promise(function (resolve, reject) {
          _this2._trello.post('/1/webhooks', {
            description: 'Trello Webhook Server',
            callbackURL: _this2._callbackURL,
            idModel: idModel
          }, function (err, data) {
            if (err) {
              // return resolve(this);
              return reject(err);
            }

            _this2._webhookID = data.id;
            return resolve(_this2._webhookID);
          });
        });
      });
    }
  }, {
    key: 'on',
    value: function on(eventName, handler) {
      if (handlers[this._idModel] && handlers[this._idModel][eventName] && typeof handler === 'function') {
        handlers[this._idModel][eventName].push(handler);
      }
    }
  }, {
    key: 'httpHandler',
    value: function httpHandler(req, response) {
      var _this3 = this;

      var res = response;
      if (req.method.toLowerCase() === 'head') {
        res.statusCode = 200;
        res.end();
      } else if (req.method.toLowerCase() === 'post' || req.method.toLowerCase() === 'put') {
        (function () {
          var trelloEvent = '';

          req.on('data', function (chunk) {
            trelloEvent += chunk;
          });
          req.on('end', function () {
            try {
              if (!verifyTrelloWebhookRequest(_this3._callbackURL, _this3._clientSecret, trelloEvent, req.headers['x-trello-webhook'] || '')) {
                res.statusCode = 400;
                res.end();
                return;
              }

              res.statusCode = 200;
              res.end();

              trelloEvent = JSON.parse(trelloEvent);
              console.log(handlers);
              console.log(handlers[_this3._idModel]);
              var _iteratorNormalCompletion = true;
              var _didIteratorError = false;
              var _iteratorError = undefined;

              try {
                for (var _iterator = handlers[_this3._idModel].data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                  var handler = _step.value;

                  handler(trelloEvent);
                }
              } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                  }
                } finally {
                  if (_didIteratorError) {
                    throw _iteratorError;
                  }
                }
              }
            } catch (e) {
              console.error('--- trello-webhook-server: received HTTP event, caught exception:');
              console.error(e);
              res.statusCode = 400;
              res.end();
            }
          });
        })();
      } else {
        res.statusCode = 400;
        res.end();
      }
    }
  }]);

  return TrelloWebhookServer;
}();

module.exports = TrelloWebhookServer;