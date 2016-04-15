'use strict';

const request = require('request');

class WebhookRegistrar {
  constructor(apiKey, apiToken) {
    this.apiKey = apiKey;
    this.apiToken = apiToken;
    this.webhookID = false;
  }

  register(callbackURL, modelID) {
    return new Promise((resolve, reject) => {
      if (!this.webhookID) {
        request.post('https://api.trello.com/1/webhooks', {
          body: {
            description: 'Trello Webhook Server',
            callbackURL,
            idModel: modelID,
            key: this.apiKey,
            token: this.apiToken
          },
          json: true
        }, (err, res, body) => {
          if (err) {
            reject(err);
          } else if (typeof body === 'string') {
            reject(body);
          } else {
            this.webhookID = body.id;
            resolve(body.id);
          }
        });
      } else {
        resolve();
      }
    });
  }

  unregister() {
    return new Promise((resolve, reject) => {
      if (this.webhookID) {
        request.del(`https://api.trello.com/1/webhooks/${this.webhookID}?key=${this.apiKey}&token=${this.apiToken}`, { json: true }, (err, res, body) => {
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
}

module.exports = WebhookRegistrar;
