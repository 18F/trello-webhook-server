'use strict';
require('dotenv').config()
const http = require('http');
const TrelloWebhookServer = require('../src/webhook-server');

const httpServer = http.createServer();

const trelloWHServer = new TrelloWebhookServer({
  server: httpServer,
  hostURL: `${process.env.HOST}/trello`,
  apiKey: process.env.TRELLO_API_KEY,
  apiToken: process.env.TRELLO_API_TOKEN,
  clientSecret: process.env.TRELLO_CLIENT_SECRET
});

httpServer.listen(process.env.PORT, () => {
  trelloWHServer.start(process.env.MODEL_ID)
    .then(webhookID => {
      console.log(`Webhook ID: ${webhookID}`);

      trelloWHServer.on('data', event => {
        console.log('Got stuff from Trello!');
      });
    })
    .catch(e => {
      console.log('Error getting Trello webhook');
      console.log(e);
    })
});
