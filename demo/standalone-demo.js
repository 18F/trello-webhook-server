'use strict';
require('dotenv').config()
const TrelloWebhookServer = require('../src/webhook-server');

const trelloWHServer = new TrelloWebhookServer({
  port: process.env.PORT,
  hostURL: process.env.HOST,
  apiKey: process.env.TRELLO_API_KEY,
  apiToken: process.env.TRELLO_API_TOKEN,
  clientSecret: process.env.TRELLO_CLIENT_SECRET
});

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
  });
