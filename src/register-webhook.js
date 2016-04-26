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
            if (body === 'A webhook with that callback, model, and token already exists') {
              resolve('Unknown Webhook ID - recovering previous session');
            } else {
              reject(body);
            }
          } else {
            this.webhookID = body.id;
            resolve(body.id);
          }
        });
      } else {
        resolve(this.webhookID);
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
