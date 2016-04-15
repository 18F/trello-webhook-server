'use strict';

var verifyTrelloWebhookRequest = require('./webhook-verify');
var log = require('./error-log');

module.exports = function getHandler(tws, handlers) {
  return function httpHandler(req, response) {
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
            if (!verifyTrelloWebhookRequest(tws.config.callbackURL, tws.config.clientSecret, trelloEvent, req.headers['x-trello-webhook'] || '')) {
              res.statusCode = 400;
              res.end();
              return;
            }

            res.statusCode = 200;
            res.end();

            trelloEvent = JSON.parse(trelloEvent);
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = handlers[tws.config.modelID].data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
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
            log('--- trello-webhook-server: received HTTP event, caught exception:');
            log(e);
            res.statusCode = 400;
            res.end();
          }
        });
      })();
    } else {
      if (!tws._httpServer) {
        res.statusCode = 400;
        res.end();
      }
    }
  };
};