'use strict';
const verifyTrelloWebhookRequest = require('./webhook-verify');
const log = require('./error-log');

module.exports = function getHandler(tws, handlers) {
  if (typeof handlers !== 'object') {
    handlers = { }; // eslint-disable-line no-param-reassign
  }

  return function httpHandler(req, response) {
    const res = response;
    if (req.method.toLowerCase() === 'head') {
      res.statusCode = 200;
      res.end();
    } else if (req.method.toLowerCase() === 'post' || req.method.toLowerCase() === 'put') {
      let trelloEvent = '';

      req.on('data', chunk => { trelloEvent += chunk; });
      req.on('end', () => {
        try {
          if (!verifyTrelloWebhookRequest(tws.config.callbackURL, tws.config.clientSecret, trelloEvent, req.headers['x-trello-webhook'] || '')) {
            res.statusCode = 400;
            res.end();
            log('Invalid Trello signature');
            return;
          }

          trelloEvent = JSON.parse(trelloEvent);
          if (handlers[tws.config.modelID] && Array.isArray(handlers[tws.config.modelID].data)) {
            handlers[tws.config.modelID].data.forEach(h => h(trelloEvent));
          }

          res.statusCode = 200;
          res.end();
        } catch (e) {
          log('--- trello-webhook-server: received HTTP event, caught exception:');
          log(e);
          res.statusCode = 400;
          res.end();
        }
      });
    } else {
      if (!tws.config.server) {
        res.statusCode = 400;
        res.end();
      }
    }
  };
};
