'use strict';
const verifyTrelloWebhookRequest = require('./webhook-verify');
const log = require('./error-log');

module.exports = function getHandler(tws, handlers) {
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

          res.statusCode = 200;
          res.end();

          trelloEvent = JSON.parse(trelloEvent);
          for (const handler of handlers[tws.config.modelID].data) {
            handler(trelloEvent);
          }
        } catch (e) {
          log('--- trello-webhook-server: received HTTP event, caught exception:');
          log(e);
          res.statusCode = 400;
          res.end();
        }
      });
    } else {
      if (!tws._httpServer) {
        res.statusCode = 400;
        res.end();
      }
    }
  };
};
