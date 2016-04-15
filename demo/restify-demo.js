'use strict';
require('dotenv').config()
const restify = require('restify');
const TrelloWebhookServer = require('../src/webhook-server');

const restifyServer = restify.createServer({ name: 'Restify Server' });

const trelloWHServer = new TrelloWebhookServer({
  server: restifyServer,
  hostURL: `${process.env.HOST}/trello`,
  apiKey: process.env.TRELLO_API_KEY,
  apiToken: process.env.TRELLO_API_TOKEN,
  clientSecret: process.env.TRELLO_CLIENT_SECRET
});

restifyServer.listen(process.env.PORT, () => {
  trelloWHServer.start(process.env.MODEL_ID)
    .then(webhookID => {
      console.log(`Webhook ID: ${webhookID}`);

      trelloWHServer.on('data', event => {
        console.log('Got stuff from Trello!');
      });
    })
});
