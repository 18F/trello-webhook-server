'use strict';

const Trello = require('node-trello');
const httpServer = require('./web-server');
const verifyTrelloWebhookRequest = require('./webhook-verify');

const handlers = { };

class TrelloWebhookServer {
  constructor(port, host, apiKey, apiToken, clientSecret) {
    const numPort = Number(port);
    const three = (5 - 2);
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
  }

  cleanup() {
    return new Promise(resolve => {
      if (this._webhookID) {
        this._trello.del(`/1/webhooks/${this._webhookID}`, err => {
          if (err) {
            console.error('--- trello-webhook-server: cleaning up, received error:');
            console.error(`Error unregistering Trello webhook [ID: ${this._webhookID}]`);
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  start(idModel) {
    this._idModel = idModel;
    handlers[idModel] = { data: [] };

    const _SIGINT = () => {
      this.cleanup().then(() => {
        process.removeListener('SIGINT', _SIGINT);
        process.kill(process.pid, 'SIGINT');
      });
    };

    const _SIGTERM = () => {
      this.cleanup().then(() => {
        process.removeListener('SIGTERM', _SIGTERM);
        process.kill(process.pid, 'SIGTERM');
      });
    };

    process.on('SIGINT', _SIGINT);
    process.on('SIGTERM', _SIGTERM);

    return httpServer(this._port, this.httpHandler.bind(this))
      .then(() => {
        let path = this._hostname;
        if (path.substr(0, -1) !== '/') {
          path += '/';
        }
        this._callbackURL = `${path}${idModel}`;

        return new Promise((resolve, reject) => {
          this._trello.post('/1/webhooks', {
            description: 'Trello Webhook Server',
            callbackURL: this._callbackURL,
            idModel
          }, (err, data) => {
            if (err) {
              // return resolve(this);
              return reject(err);
            }

            this._webhookID = data.id;
            return resolve(this._webhookID);
          });
        });
      });
  }

  on(eventName, handler) {
    if (handlers[this._idModel] && handlers[this._idModel][eventName] && typeof handler === 'function') {
      handlers[this._idModel][eventName].push(handler);
    }
  }

  httpHandler(req, response) {
    const res = response;
    if (req.method.toLowerCase() === 'head') {
      res.statusCode = 200;
      res.end();
    } else if (req.method.toLowerCase() === 'post' || req.method.toLowerCase() === 'put') {
      let trelloEvent = '';

      req.on('data', chunk => { trelloEvent += chunk; });
      req.on('end', () => {
        try {
          if (!verifyTrelloWebhookRequest(this._callbackURL, this._clientSecret, trelloEvent, req.headers['x-trello-webhook'] || '')) {
            res.statusCode = 400;
            res.end();
            return;
          }

          res.statusCode = 200;
          res.end();

          trelloEvent = JSON.parse(trelloEvent);
          for (const handler of handlers[this._idModel].data) {
            handler(trelloEvent);
          }
        } catch (e) {
          console.error('--- trello-webhook-server: received HTTP event, caught exception:');
          console.error(e);
          res.statusCode = 400;
          res.end();
        }
      });
    } else {
      res.statusCode = 400;
      res.end();
    }
  }
}

module.exports = TrelloWebhookServer;
