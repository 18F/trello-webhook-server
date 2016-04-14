'use strict';
require('dotenv').config()

const http = require('http');
const httpServer = http.createServer();
httpServer.listen(process.env.PORT);

const TrelloWebhookServer = require('./src/webhook-server');
const server = new TrelloWebhookServer(httpServer, process.env.HOST, process.env.TRELLO_API_KEY, process.env.TRELLO_API_TOKEN, process.env.TRELLO_CLIENT_SECRET);

server.start(process.env.MODEL_ID)
  .then(webhookID => {
    console.log(`Webhook ID: ${webhookID}`);
  })
  .catch(e => {
    console.log(e);
  });

server.on('data', function(event) {
  console.log(event);
});
